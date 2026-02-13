# @afw/hooks - ActionFlows Claude Code Hook Scripts

Hook scripts that integrate Claude Code's execution lifecycle with the ActionFlows Dashboard backend event system.

## Documentation Structure

This package is documented across three files:

- **README.md** (this file) - Overview and quick reference
- **ARCHITECTURE.md** - System design and hook lifecycle diagrams
- **IMPLEMENTATION_GUIDE.md** - Comprehensive implementation guide with detailed parsing patterns, design decisions, and complete test suite

## Hooks

### `pre-commit-contract` - Contract Drift Prevention Hook

Triggered on every commit when contract files are modified. Runs `contract:validate` and blocks the commit if drift is detected between CONTRACT.md specification, TypeScript types, Zod schemas, and parser implementations.

#### Trigger Condition

Hook runs when ANY of these files are staged for commit:

- `.claude/actionflows/CONTRACT.md`
- `packages/shared/src/contract/types/*.ts`
- `packages/shared/src/contract/validation/schemas.ts`
- `packages/shared/src/contract/parsers/*.ts`
- `packages/shared/src/contract/patterns/*.ts`

If no contract files are modified, the hook skips validation (fast path for non-contract commits).

#### Processing

1. **Get staged files** from `git diff --cached --name-only`
2. **Check for contract files** against pattern list
3. **Skip if no contract files** modified (exit 0)
4. **Run validation** via `pnpm run contract:validate`
5. **Block commit** if validation fails (exit 1)
6. **Allow commit** if validation passes (exit 0)

#### Validation

The validation script (`packages/shared/scripts/validate-contract.ts`) performs 4-layer field-level verification:

1. **Spec Layer** - Field documented in CONTRACT.md
2. **Type Layer** - Field exists in TypeScript interface
3. **Schema Layer** - Field exists in Zod schema
4. **Parser Layer** - Field extracted by parser function

**Exit codes:**
- `0` - All formats aligned, commit allowed
- `1` - Drift detected, commit blocked
- `2` - Validation script error

#### Setup

**Option A: Automatic (recommended)**

```bash
# Install simple-git-hooks
pnpm add -D simple-git-hooks

# Add to root package.json:
{
  "simple-git-hooks": {
    "pre-commit": "node packages/hooks/dist/pre-commit-contract.js"
  }
}

# Register hooks
pnpm exec simple-git-hooks
```

**Option B: Manual**

```bash
# Create .git/hooks/pre-commit
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
node packages/hooks/dist/pre-commit-contract.js
EOF

# Make executable
chmod +x .git/hooks/pre-commit
```

#### Skip Hook (Emergency Bypass)

```bash
# Skip pre-commit hook for a single commit
git commit --no-verify

# WARNING: Only use when:
# - Fixing the validation script itself
# - Emergency hotfix (must fix drift in next commit)
# - You are absolutely certain the drift is intentional
```

#### Error Messages

**Drift detected:**
```
❌ Contract validation failed. Commit blocked.

Format 2.2 (DualOutputParsed): ⚠️ DRIFT
  🔴 [schema] Field "action" exists in TypeScript type but missing in Zod schema
  🔴 [schema] Field "secondOpinionSummary" exists in TypeScript type but missing in Zod schema

Fix the drift issues above and try again.

To bypass (NOT RECOMMENDED): git commit --no-verify
```

**No contract changes:**
```
[pre-commit-contract] No contract files modified, skipping validation
```

#### Rationale

Implements L021 (Contract Drift Prevention). Before this hook, contract changes could create drift where:
- Field exists in spec but missing from type definition
- Field exists in type but parser doesn't extract it
- Field name differs between layers (`stepNumber` vs `number`)
- Zod schema uses wrong nullability (`.optional()` vs `.nullable()`)

The pre-commit hook makes drift **impossible to commit** by enforcing 4-layer alignment at the Git level.

#### See Also

- **Validation Script:** `packages/shared/scripts/validate-contract.ts`
- **Alignment Gate:** `.claude/actionflows/CONTRACT.md` § Alignment Verification Gate
- **Learning:** `.claude/actionflows/LEARNINGS.md` § L021

---

### `afw-step-completed` - SubagentStop Hook

Triggered when Claude Code completes a subagent step execution.

#### Input (via stdin)

Receives SubagentStop hook data as JSON:

```json
{
  "session_id": "unique-session-identifier",
  "agent_id": "agent-instance-id",
  "exit_status": "completed" | "error" | "cancelled",
  "duration_ms": 12345,
  "output": "agent's final output text"
}
```

#### Processing

1. **Validates** hook data has all required fields
2. **Extracts automatic fields**:
   - `sessionId` - from `session_id`
   - `stepNumber` - parsed from output, falls back to 1
   - `duration` - from `duration_ms`
3. **Parses agent output** to extract:
   - `stepNumber` - regex pattern matching "Step 1", "## Step 2", etc.
   - `action` - regex pattern matching "action/" or step context
   - `result` - regex matching "Result:", "Summary:", or last meaningful line
   - `learning` - regex matching "## Learnings" section or "Agent Learning" pattern
4. **Maps exit status** to Status enum:
   - `"completed"` → `Status.COMPLETED`
   - `"error"` → `Status.FAILED`
   - `"cancelled"` → `Status.SKIPPED`
5. **Posts StepCompletedEvent** to backend `/api/events` endpoint

#### Configuration

- **Backend URL**: Read from `AFW_BACKEND_URL` environment variable
- **Defaults to**: `http://localhost:3000` if not set

#### Error Handling

- **Silent failure mode**: Exits with code 0 regardless of success
- **Non-blocking**: POST failures don't affect hook execution
- **Graceful degradation**: Missing parsed fields are nullable (null or undefined)

#### Event Type

Sends a `StepCompletedEvent` to the backend with:

```typescript
interface StepCompletedEvent extends BaseEvent {
  type: 'step:completed';
  stepNumber: StepNumber;
  duration: DurationMs;
  action?: string | null;           // Parsed from output
  status?: StatusString | null;      // Mapped from exit_status
  result?: unknown | null;           // Parsed from output
  learning?: string | null;          // Parsed from output
  succeeded: boolean;                // Computed from status
  outputLength?: number;             // Computed from output
}
```

## Utilities

### `settings.ts`

Provides hook configuration management:

- `readSettings()` - Loads settings from environment variables
- `validateSettings(settings)` - Validates required settings are present

### `http.ts`

Handles HTTP communication with backend:

- `postEvent(backendUrl, event)` - POSTs WorkspaceEvent to backend
  - Implements 5-second timeout
  - Returns boolean success/failure
  - Never throws (silent failure)

### `parser.ts`

Parses Claude Code agent output to extract structured data:

- `parseAgentOutput(output)` - Main parsing function returning `ParsedAgentOutput`
- `parseStepNumber(output)` - Extracts step number from text
- `parseAction(output)` - Extracts action name
- `parseResult(output)` - Extracts result/summary
- `parseLearning(output)` - Extracts learning section

All parsing functions return `null` if pattern not found (graceful degradation).

## Building

```bash
# Build hook scripts
npm run build

# Type checking
npm run type-check

# Watch mode (development)
npm run dev
```

## Integration

1. Set `AFW_BACKEND_URL` environment variable
2. Register `afw-step-completed` as SubagentStop hook in Claude Code
3. Hook receives stdin data when subagent completes
4. Events are automatically POSTed to dashboard backend

## Example Usage

```bash
# Simulate hook execution
echo '{"session_id":"sess-123","agent_id":"agent-456","exit_status":"completed","duration_ms":5000,"output":"Step 1 complete: code/"}' | \
  node dist/afw-step-completed.js
```

## Debugging

Hook logs errors to stderr:

- JSON parse failures
- Invalid hook data format
- Network/POST failures
- Unexpected errors

All errors are non-fatal (exit code 0) to prevent blocking Claude Code.
