# Contract Evolution Process

**Last Updated:** 2026-02-09
**Audience:** Framework developers modifying CONTRACT.md

This guide consolidates the process for adding new formats or modifying existing formats in the Orchestrator Contract.

---

## Adding a New Format

Follow these steps to add a new contract-defined format:

### 1. Define the Type Specification (CONTRACT.md)
- Add new format section to CONTRACT.md under appropriate category
- Include: TypeScript type name, parser function, pattern regex, required fields
- Assign priority level (P0-P5) based on implementation urgency
- Provide markdown structure example (if complex)

**Example:**
```markdown
### Format X.Y: New Format Name (P2)
**TypeScript:** NewFormatParsed
**Parser:** parseNewFormat(text: string)
**Pattern:** /^## New Format: (.+)$/m
**Example:** ORCHESTRATOR.md § New Format Section

**Required Fields:**
- Field 1 (string)
- Field 2 (enum: VALUE_A | VALUE_B)
```

### 2. Implement TypeScript Definitions
- **Types:** `packages/shared/src/contract/types/newFormat.ts`
- **Patterns:** `packages/shared/src/contract/patterns/newFormatPatterns.ts`
- **Parser:** `packages/shared/src/contract/parsers/parseNewFormat.ts`
- **Guard:** Add `isNewFormatParsed` to `packages/shared/src/contract/guards.ts`
- **Export:** Update `packages/shared/src/contract/index.ts`

### 3. Update Orchestrator or Agent Instructions
**If orchestrator produces this format:**
- Add example to ORCHESTRATOR.md § Response Format Standard
- Include when to produce, required fields, formatting rules

**If agent produces this format:**
- Add reference to agent-standards/instructions.md § Contract Compliance
- Add explicit reference to specific agent.md file (e.g., review/agent.md)

### 4. Update Dashboard Components
- Create or update parser in `packages/app/src/parsers/`
- Add rendering component in `packages/app/src/components/`
- Test graceful degradation if parsing fails

### 5. Run Harmony Validation
```bash
pnpm run harmony:check
```
- Validates parsers against contract specifications
- Ensures TypeScript types match expected structure
- Tests example inputs from ORCHESTRATOR.md

### 6. Increment CONTRACT_VERSION (if structure changes)
- **Minor changes** (add optional field): 1.0 → 1.1
- **Breaking changes** (remove field, change enum): 1.0 → 2.0
- Update version in CONTRACT.md header

---

## Modifying an Existing Format

**CRITICAL:** Existing formats are load-bearing. Dashboard depends on them. Follow this process:

### Step 1: Assess Impact
**Questions:**
- Is this a breaking change? (removes field, changes required field, changes enum values)
- Which dashboard components consume this format?
- Are there active deployments relying on this format?

### Step 2: Increment CONTRACT_VERSION
- **Minor (non-breaking):** Add optional field, expand enum → 1.0 → 1.1
- **Major (breaking):** Remove field, change required structure → 1.0 → 2.0

### Step 3: Implement Version-Specific Parsers
```typescript
// packages/shared/src/contract/parsers/parseChainCompilation.ts
export function parseChainCompilationV1_0(text: string): ChainCompilationParsedV1_0 { ... }
export function parseChainCompilationV1_1(text: string): ChainCompilationParsedV1_1 { ... }

// Default export uses latest version
export function parseChainCompilation(text: string): ChainCompilationParsed {
  return parseChainCompilationV1_1(text);
}
```

### Step 4: Support Both Versions During Migration
- **Migration window:** Minimum 90 days
- Backend accepts both v1.0 and v1.1 parsers
- Dashboard gracefully handles both formats
- Harmony detector validates against correct version

### Step 5: Update CONTRACT.md
- Mark old version as deprecated (add "Deprecated since vX.Y")
- Document new version with full specification
- Update TypeScript reference
- Update ORCHESTRATOR.md example

### Step 6: Notify via Harmony Detection
- Harmony detector shows version mismatch warning
- Dashboard displays "Parsing with legacy format" banner
- Broadcast upgrade recommendation via WebSocket

---

## Breaking Changes Checklist

Before merging a breaking contract change:

- [ ] CONTRACT_VERSION incremented (major version bump)
- [ ] Version-specific parser implemented (parseFormatV2_0)
- [ ] Backward compatibility maintained for 90 days minimum
- [ ] CONTRACT.md updated with new format specification
- [ ] ORCHESTRATOR.md example updated
- [ ] Dashboard components handle both versions
- [ ] Harmony detection validates both versions
- [ ] Migration guide added to this document
- [ ] Team notified of migration timeline

---

## Validation & Testing

### Automated Validation
```bash
pnpm run harmony:check
```

Runs:
- TypeScript type checking across all packages
- Parser unit tests against contract examples
- Harmony detector validation
- Dashboard parser integration tests

### Manual Testing
See `packages/shared/src/contract/README.md` for parser testing examples.

---

## Questions?

- Read: `.claude/actionflows/docs/HARMONY_SYSTEM.md` (philosophy)
- Test: Complete onboarding Module 9 (interactive learning)
- Monitor: Dashboard harmony panel (real-time status)
