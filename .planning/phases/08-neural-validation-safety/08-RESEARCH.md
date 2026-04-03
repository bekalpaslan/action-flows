# Phase 8: Neural Validation & Safety - Research

**Researched:** 2026-04-03
**Domain:** Claude Code hooks (PreToolUse/PostToolUse), design system enforcement, WebSocket event delivery, git checkpoint/rollback, human-in-the-loop approval gates
**Confidence:** HIGH

## Summary

Phase 8 adds the intelligence layer that prevents agents from bypassing the design system and gives humans granular control over destructive operations. The phase has two distinct halves: (1) **hook-based validation** (NEURAL-01 through NEURAL-07) -- PreToolUse hooks that regex-scan file writes for raw CSS violations and block them, PostToolUse hooks that audit compliance, and /btw signal delivery via WebSocket; and (2) **safety controls** (SAFETY-01 through SAFETY-05) -- a git-based checkpoint/rollback timeline in the pipeline panel, human-in-the-loop approval gates rendered as interactive cards in the chat panel, and per-workbench autonomy level settings.

The codebase has strong foundations for both halves. The hooks package (`@afw/hooks`) already contains 12 hook scripts with established patterns for reading stdin JSON, calling backend APIs, and exiting with appropriate codes. The settings.json hook registration format is well-established. The frontend has the AskUserRenderer pattern from Phase 7 that approval gates can follow exactly, the pipeline StepNode component that can be extended with checkpoint markers, and the sonner toast system already wired in AppShell.

**Primary recommendation:** Build hooks first (pure Node.js scripts with no frontend dependency), then backend API routes for checkpoints and approvals, then frontend components last. The hooks are the core value of this phase and can be validated independently.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use regex pattern matching in PreToolUse hooks for violation detection (not AST parsing). Fast, simple to maintain.
- **D-02:** Block edits that violate design system rules. Hook returns non-zero exit code; Claude Code prevents the file write from landing. Agent sees rejection reason and must fix.
- **D-03:** Moderate strictness: block raw hex colors (#fff, rgb()), inline style= attributes. Allow raw HTML elements (component library preferred but not enforced for elements).
- **D-04:** Only validate .tsx and .css files. Pure .ts logic files are exempt to avoid false positives.
- **D-05:** Violation signals delivered via WebSocket broadcast to the active workbench session. Backend emits violation event on the workbench's WS channel. Violations for inactive workbenches queue until session starts.
- **D-06:** Agents auto-fix critical violations immediately. Pause current work, fix, resume. Critical violations are blocking.
- **D-07:** Severity levels: Critical = blocked edit (raw hex/inline style in PreToolUse). Warning = allowed edit with issue (non-token color in PostToolUse). Info = style suggestion (could use better token).
- **D-08:** Git-based revert. Each checkpoint is a git commit hash. Revert creates a new commit that undoes changes back to that point. Clean history, no data loss.
- **D-09:** Checkpoint timeline lives in the pipeline panel. Extend existing pipeline visualization with checkpoint markers. Each node shows a revert button.
- **D-10:** Checkpoints created on every agent commit. Natural granularity -- one revert = one task. Maps to pipeline step nodes.
- **D-11:** Block destructive file operations only: deleting files, removing directories, git force-push, dropping database tables. Normal edits, creates, test runs are allowed.
- **D-12:** 3 autonomy levels: Full (auto-approve everything -- Settings), Supervised (approve destructive only -- Work, Explore), Restricted (approve all edits -- Review for auditing).
- **D-13:** Approval requests appear as interactive cards in the chat panel (same pattern as AskUserQuestion from Phase 7). Approve/Deny buttons inline in conversation context.

### Claude's Discretion
- Implementation details of regex patterns for violation detection
- WebSocket event schema for violation signals
- Checkpoint data model and storage
- Default autonomy level assignments per workbench
- Gate timeout behavior (auto-deny vs auto-approve after N seconds)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NEURAL-01 | Claude Code hooks validate agent file edits against component library rules | Hook scripts in packages/hooks/src/ with PreToolUse/PostToolUse matchers for Write/Edit tools; regex patterns against design-tokens.css values |
| NEURAL-02 | PreToolUse allowlist hooks block unauthorized patterns (raw CSS, inline styles, non-library components) | PreToolUse with permissionDecision: "deny" and stderr message; regex for hex colors, rgb(), inline style= |
| NEURAL-03 | PostToolUse linter hook validates design system compliance on every file write | PostToolUse with decision: "block" for critical, systemMessage for warnings; read file content from tool_input |
| NEURAL-04 | /btw delivers violation signals to workbench agents with severity levels | Hook POSTs violation event to backend API; backend broadcasts via WebSocket hub channel; frontend shows sonner toast |
| NEURAL-05 | Agent decides: fix now (critical) or note for future heal pass (non-critical) | Critical violations use PreToolUse block (exit 2) forcing immediate fix; warnings via PostToolUse systemMessage are advisory |
| NEURAL-06 | Prompt-based hooks evaluate semantic design system compliance | PostToolUse can return additionalContext with compliance guidance; systemMessage surfaces to agent |
| NEURAL-07 | Machine-readable component manifest injected into agent context | manifest.ts already exists at components/ui/manifest.ts; can be injected via SessionStart hook or agent prompt |
| SAFETY-01 | Checkpoint/rollback system with timeline UI and one-click revert | CheckpointMarker component on pipeline StepNode; backend route for git revert; checkpoint data in pipelineStore |
| SAFETY-02 | Human-in-the-loop approval gates with configurable autonomy levels | ApprovalGateCard in chat panel following AskUserRenderer pattern; approval_request message type |
| SAFETY-03 | Risk-based escalation: low-risk auto-approves, high-risk requires human OK | PreToolUse hook checks autonomy level via backend API; destructive ops get approval_request; normal ops pass through |
| SAFETY-04 | Approval gates don't block entire pipeline -- only the specific action | Gate is per-tool-call via PreToolUse hook; other steps continue; only the gated action waits |
| SAFETY-05 | Per-workbench permission boundaries | Autonomy settings in validationStore per WorkbenchId; backend persists levels; settings UI in SettingsPage |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @afw/hooks | workspace:* | Hook scripts package | Existing monorepo package with build pipeline and shared utilities |
| @afw/shared | workspace:* | Shared types (WSEnvelope, branded types) | Project's type contract between packages |
| sonner | ^2.0.7 | Toast notifications for violation signals | Already installed and wired in AppShell |
| zustand | ^5.0.12 | validationStore for violations/approvals/autonomy | Existing state management pattern in project |
| lucide-react | ^1.7.0 | Icons (ShieldAlert, RotateCcw, CheckCircle, etc.) | Already installed, used across all components |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| class-variance-authority | (installed) | CVA variants for severity styling | Approval card and violation toast severity variants |
| @radix-ui/react-tooltip | (installed) | Checkpoint marker tooltip | Hover tooltip on pipeline checkpoint dots |
| @radix-ui/react-dialog | (installed) | Revert confirmation dialog | Confirmation before git revert |
| @radix-ui/react-select | (installed) | Autonomy level selector | Per-workbench autonomy settings |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Regex validation (D-01) | AST parsing (TypeScript compiler API) | AST is more accurate but 10-100x slower; regex is sufficient for pattern blocking per locked decision |
| Git revert (D-08) | Custom file snapshot system | Git revert is native, audit-trailed, and already the project's VCS; custom adds complexity |
| sonner toasts (violations) | Custom notification system | sonner is already installed and configured with design tokens in AppShell |

**Installation:**
No new npm packages required. All dependencies are already installed.

## Architecture Patterns

### Recommended Project Structure

```
packages/hooks/src/
  afw-design-validate-pre.ts    # PreToolUse hook: block raw CSS violations
  afw-design-validate-post.ts   # PostToolUse hook: audit compliance, warn
  utils/
    design-rules.ts             # Shared regex patterns for both hooks
    violation-reporter.ts       # POST violation events to backend

packages/backend/src/
  routes/
    checkpoints.ts              # GET/POST checkpoint data, POST revert
    approvals.ts                # GET/POST approval requests, POST resolve
    validation.ts               # GET violations, POST violation signal
  services/
    checkpointService.ts        # Git operations (log, revert)
    approvalService.ts          # Approval lifecycle management

packages/app/src/
  stores/
    validationStore.ts          # Violations, approvals, autonomy levels
  components/
    pipeline/
      CheckpointMarker.tsx      # Dot + tooltip + revert on step nodes
    ViolationToast.tsx           # Custom sonner toast with severity
  workbenches/
    chat/
      ApprovalGateCard.tsx       # Approve/deny interactive card

packages/shared/src/
  validation-events.ts          # Shared types for violation/approval events
```

### Pattern 1: Hook Script Architecture

**What:** PreToolUse and PostToolUse hooks are standalone Node.js scripts that read JSON from stdin, apply regex validation, and output JSON to stdout or exit with code 2 to block.

**When to use:** Every file write to .tsx or .css files by agents.

**Example:**
```typescript
// PreToolUse hook pattern (from official Claude Code docs)
// Receives on stdin:
{
  "session_id": "abc123",
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",  // or "Edit"
  "tool_input": {
    "file_path": "/path/to/Component.tsx",
    "content": "...",               // Write: full content
    // OR
    "old_string": "...",            // Edit: what to replace
    "new_string": "..."             // Edit: replacement
  }
}

// To BLOCK (exit code 2): stderr message shown to Claude
process.stderr.write("Design system violation: raw hex color #fff detected. Use var(--color-*) tokens.");
process.exit(2);

// To ALLOW with warning (exit code 0 + JSON):
console.log(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "allow",
    additionalContext: "Warning: consider using design token for this color"
  }
}));
process.exit(0);
```

### Pattern 2: WebSocket Event Delivery for Violations

**What:** Hooks POST violation events to backend; backend broadcasts via WebSocket hub to the workbench channel; frontend validationStore receives and shows toast.

**When to use:** Every violation detected by hooks (NEURAL-04).

**Example:**
```typescript
// Backend broadcasts violation event via WSEnvelope
hub.broadcast(workbenchId, JSON.stringify({
  channel: workbenchId,
  type: 'validation:violation',
  payload: {
    id: 'viol_123',
    severity: 'critical',      // | 'warning' | 'info'
    rule: 'no-raw-hex',
    description: 'Raw hex color #fff found',
    filePath: 'packages/app/src/components/MyWidget.tsx',
    line: 42,
    timestamp: new Date().toISOString(),
    resolved: false,
  },
  ts: new Date().toISOString(),
} satisfies WSEnvelope));
```

### Pattern 3: Approval Gate Lifecycle

**What:** PreToolUse hook for destructive operations sends approval request via backend API, waits for response or timeout, then allows or blocks.

**When to use:** When autonomy level requires approval for the operation type (SAFETY-02/03/04).

**Example flow:**
1. PreToolUse hook detects destructive operation (file delete, force-push)
2. Hook checks autonomy level via backend API (`GET /api/approvals/autonomy/:workbenchId`)
3. If approval required: hook POSTs approval request to backend, enters polling loop
4. Backend broadcasts `approval:request` via WebSocket to chat panel
5. Frontend renders ApprovalGateCard with approve/deny buttons + 120s timeout bar
6. User clicks approve/deny (or timeout triggers auto-deny)
7. Frontend POSTs resolution to backend
8. Hook's polling detects resolution; exits with 0 (approved) or 2 (denied)

### Pattern 4: Checkpoint as Pipeline Extension

**What:** Extend existing StepNodeData with optional CheckpointData. CheckpointMarker renders as a small dot below completed step nodes.

**When to use:** After agent commits (SAFETY-01).

**Example:**
```typescript
// Extend existing StepNodeData (in pipeline-types.ts)
export interface CheckpointData {
  commitHash: string;        // Short hash (7 chars)
  commitMessage: string;     // First line of commit message
  timestamp: string;         // ISO timestamp
  filesChanged: number;      // Count of files in this commit
}

// Add to StepNodeData
checkpoint: CheckpointData | null;
```

### Anti-Patterns to Avoid

- **AST parsing in hooks:** Decision D-01 locks regex. AST parsing adds 500ms+ per file and requires TypeScript compiler as hook dependency.
- **Blocking entire pipeline for one approval:** Decision D-04 says only the specific action waits. Other pipeline steps must continue. Never use a global lock.
- **Storing violations in Redux/Context:** This project uses zustand module singletons with Map<WorkbenchId, State>. Follow the pattern.
- **Hardcoding design token values in hooks:** Read token values from theme.css at hook startup or maintain a separate allowlist file, not inline hex values.
- **Using `git reset --hard` for rollback:** Decision D-08 mandates `git revert` which creates a new commit. Never use destructive git operations.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom notification system | sonner (already wired in AppShell) | Positioning, stacking, animations, auto-dismiss all handled |
| Tooltip on hover | Custom mouseenter/leave | Radix UI Tooltip (already installed) | Accessibility, portal, positioning, delay |
| Confirmation dialog | Custom modal | Radix UI Dialog (already installed) | Focus trap, escape close, a11y |
| Select dropdown | Custom dropdown | Radix UI Select (already installed) | Typeahead, scroll-into-view, ARIA combobox |
| Git operations | Shell out directly from frontend | Backend API route + child_process.execSync | Security, error handling, cross-platform |
| CSS color validation regex | Multiple separate regex | Single comprehensive pattern | Consistency, maintenance |

**Key insight:** The project's Phase 3 component library already has every UI primitive needed. This phase composes existing components into new patterns -- it does not create new primitives.

## Common Pitfalls

### Pitfall 1: Hook Timeout Causing False Allows
**What goes wrong:** Hooks have a 10-second timeout in settings.json. If a hook takes too long (e.g., network call to check autonomy), Claude Code kills it and proceeds as if exit 0.
**Why it happens:** Approval gate hooks must poll backend for user response, but polling 120 seconds exceeds the 10s timeout.
**How to avoid:** The approval gate cannot live entirely in the hook. The hook must POST the request and immediately exit 0, while the *actual blocking* happens through a different mechanism -- either the hook returns `permissionDecision: "ask"` to prompt the user in Claude Code's own UI, or the hook uses a longer timeout (settings.json timeout can be increased per-hook to 300 seconds for the approval hook).
**Warning signs:** Tests where the hook silently allows operations it should gate.

### Pitfall 2: Regex Over-Matching in Design Validation
**What goes wrong:** Regex for hex colors matches legitimate strings in code (e.g., `const HASH = '#abc123'`, `// color: #fff`, error messages with hex).
**Why it happens:** Naive regex like `/#[0-9a-fA-F]{3,8}/` matches any hex-like string in any context.
**How to avoid:** Scope regex to CSS/style contexts: match `color:`, `background:`, `border:`, `fill:`, `stroke:` followed by hex. Also check for `className="..."` with `style={{ }}`. For .tsx files, only match within JSX return blocks or style objects. Skip comments and strings.
**Warning signs:** False positives on utility files, test files, or documentation strings.

### Pitfall 3: Edit Tool Has Different Input Shape Than Write
**What goes wrong:** Hook handles `tool_input.content` (Write) but crashes on Edit where the field is `tool_input.new_string`.
**Why it happens:** Write tool provides full file content; Edit provides old_string + new_string for a patch.
**How to avoid:** Check `tool_name` first, then extract content accordingly: `const content = toolName === 'Write' ? input.content : input.new_string`. Also handle `MultiEdit` which has an array of edits.
**Warning signs:** Hooks that only test with Write but not Edit/MultiEdit.

### Pitfall 4: Windows Path Separators in Hook File Path Matching
**What goes wrong:** Hook checks if file_path ends with `.tsx` but Windows paths use backslashes, and the tool may provide forward or back slashes.
**Why it happens:** This project runs on Windows (per env). Claude Code normalizes some paths but not all.
**How to avoid:** Normalize paths before matching: `path.normalize(filePath).replace(/\\/g, '/')`. Also use `path.extname()` instead of string matching.
**Warning signs:** Hooks that pass on macOS/Linux but fail on Windows.

### Pitfall 5: Git Revert of Merge Commits
**What goes wrong:** `git revert <hash>` fails on merge commits without `-m` flag specifying which parent.
**Why it happens:** Agent commits from parallel agents may produce merge commits.
**How to avoid:** Backend checkpointService should detect merge commits (`git cat-file -p <hash>` and count parents) and use `git revert -m 1 <hash>` for merges. Surface a clear error if revert fails.
**Warning signs:** Revert button works in simple cases but fails when agents create merge histories.

### Pitfall 6: Race Condition Between PreToolUse Block and PostToolUse Audit
**What goes wrong:** PostToolUse fires for a write that PreToolUse already blocked, causing double violation reports.
**Why it happens:** If PreToolUse exits 2, the tool call is blocked -- PostToolUse should NOT fire. But if the hook fails to detect (e.g., different regex scope), PostToolUse catches it as a warning.
**How to avoid:** This is actually the intended design (defense in depth). PreToolUse is the primary gate. PostToolUse is the audit layer. They should share the same rule definitions (import from utils/design-rules.ts) but PostToolUse reports at warning level for issues PreToolUse might miss.
**Warning signs:** Duplicate violation toasts for the same edit.

## Code Examples

### Hook Registration in .claude/settings.json

```jsonc
// Add to existing hooks.PreToolUse array
{
  "matcher": "Write|Edit|MultiEdit",
  "hooks": [
    {
      "type": "command",
      "command": "node D:/ActionFlowsDashboard/packages/hooks/dist/hooks/src/afw-design-validate-pre.js",
      "timeout": 15
    }
  ]
}

// Add to existing hooks.PostToolUse array
{
  "matcher": "Write|Edit|MultiEdit",
  "hooks": [
    {
      "type": "command",
      "command": "node D:/ActionFlowsDashboard/packages/hooks/dist/hooks/src/afw-design-validate-post.js",
      "timeout": 15
    }
  ]
}
```

### Design Rule Regex Patterns (utils/design-rules.ts)

```typescript
// Source: CONTEXT.md D-03 (moderate strictness)

/** Patterns that are BLOCKED in PreToolUse (critical violations) */
export const CRITICAL_PATTERNS = [
  // Raw hex colors in CSS property contexts
  {
    rule: 'no-raw-hex',
    // Match color-related CSS properties followed by hex color
    pattern: /(?:color|background(?:-color)?|border(?:-color)?|fill|stroke|outline-color)\s*:\s*#[0-9a-fA-F]{3,8}\b/g,
    message: 'Raw hex color detected. Use var(--color-*) design tokens.',
  },
  // rgb()/rgba()/hsl()/hsla() in CSS contexts
  {
    rule: 'no-raw-color-fn',
    pattern: /(?:color|background(?:-color)?|border(?:-color)?|fill|stroke)\s*:\s*(?:rgb|rgba|hsl|hsla)\s*\(/g,
    message: 'Raw color function detected. Use var(--color-*) design tokens.',
  },
  // Inline style= attribute in JSX
  {
    rule: 'no-inline-style',
    pattern: /style\s*=\s*\{\s*\{/g,
    message: 'Inline style attribute detected. Use Tailwind classes with design tokens.',
  },
] as const;

/** Patterns checked in PostToolUse (warnings) */
export const WARNING_PATTERNS = [
  // Hex colors anywhere (broader catch, not just CSS properties)
  {
    rule: 'hex-outside-tokens',
    pattern: /['"]#[0-9a-fA-F]{3,8}['"]/g,
    message: 'Hex color string found. Consider using a design token reference.',
  },
] as const;

/** File extensions to validate (per D-04) */
export const VALIDATED_EXTENSIONS = ['.tsx', '.css'];

/** Files to always skip (test files, config, etc.) */
export const SKIP_PATTERNS = [
  /\.test\./,
  /\.spec\./,
  /\.config\./,
  /design-tokens/,
  /theme\.css/,
  /__tests__/,
  /__mocks__/,
];
```

### PreToolUse Hook Script Structure

```typescript
#!/usr/bin/env node
/**
 * PreToolUse Hook: Design System Validation
 * Blocks file writes containing raw CSS violations.
 * Exit 2 = block with stderr message.
 * Exit 0 = allow.
 */
import * as fs from 'fs';
import * as path from 'path';
import { CRITICAL_PATTERNS, VALIDATED_EXTENSIONS, SKIP_PATTERNS } from './utils/design-rules.js';

interface PreToolUseInput {
  session_id: string;
  tool_name: string;
  tool_input: {
    file_path?: string;
    content?: string;       // Write tool
    new_string?: string;    // Edit tool
    edits?: Array<{ new_string: string }>; // MultiEdit
  };
}

async function main() {
  const inputData = fs.readFileSync(0, 'utf-8');
  const input: PreToolUseInput = JSON.parse(inputData);

  const filePath = input.tool_input.file_path;
  if (!filePath) { process.exit(0); return; }

  // Normalize path for cross-platform
  const normalizedPath = path.normalize(filePath).replace(/\\/g, '/');
  const ext = path.extname(normalizedPath);

  // Only validate .tsx and .css files (D-04)
  if (!VALIDATED_EXTENSIONS.includes(ext)) { process.exit(0); return; }

  // Skip test/config files
  if (SKIP_PATTERNS.some(p => p.test(normalizedPath))) { process.exit(0); return; }

  // Extract content to validate
  let contentToCheck = '';
  if (input.tool_name === 'Write') {
    contentToCheck = input.tool_input.content ?? '';
  } else if (input.tool_name === 'Edit') {
    contentToCheck = input.tool_input.new_string ?? '';
  } else if (input.tool_name === 'MultiEdit') {
    contentToCheck = (input.tool_input.edits ?? [])
      .map(e => e.new_string)
      .join('\n');
  }

  // Check critical patterns
  const violations: string[] = [];
  for (const rule of CRITICAL_PATTERNS) {
    const matches = contentToCheck.match(rule.pattern);
    if (matches) {
      violations.push(`[${rule.rule}] ${rule.message} (${matches.length} occurrence(s))`);
    }
  }

  if (violations.length > 0) {
    process.stderr.write(
      `Design System Violation (BLOCKED):\n${violations.join('\n')}\n\n` +
      `Fix: Use var(--color-*) tokens from design-tokens.css instead of raw values.\n` +
      `Reference: packages/app/src/styles/theme.css`
    );
    // POST violation to backend for dashboard display
    // (fire-and-forget, don't await)
    reportViolation(normalizedPath, violations);
    process.exit(2);
  }

  process.exit(0);
}

main().catch(() => process.exit(0)); // Silent failure = allow
```

### ApprovalGateCard (follows AskUserRenderer pattern from Phase 7)

```typescript
// Based on existing AskUserRenderer.tsx structure
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApprovalRequest, ApprovalStatus } from '@/lib/chat-types';

export interface ApprovalGateCardProps {
  request: ApprovalRequest;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}

export function ApprovalGateCard({ request, onApprove, onDeny }: ApprovalGateCardProps) {
  const resolved = request.status !== 'pending';
  // ... render following AskUserRenderer pattern:
  // border-l-2 border-warning bg-surface-2 rounded-md p-3
  // with approve/deny buttons replaced by badge on resolution
}
```

### WebSocket Violation Event Subscription (frontend)

```typescript
// In validationStore or a useViolationToasts hook
wsClient.subscribe(workbenchId, (envelope: WSEnvelope) => {
  if (envelope.type === 'validation:violation') {
    const violation = envelope.payload as ViolationSignal;
    addViolation(workbenchId, violation);

    // Show toast via sonner
    toast.custom((id) => <ViolationToast violation={violation} toastId={id} />, {
      duration: violation.severity === 'critical' ? Infinity : violation.severity === 'warning' ? 8000 : 5000,
      id: violation.id,
    });
  }
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PreToolUse top-level `decision` field | `hookSpecificOutput.permissionDecision` | Claude Code v2.0+ | Must use new format for PreToolUse permission decisions |
| Exit code 1 to block | Exit code 2 to block | Claude Code v1.0+ | Exit 1 is generic error (may not block); exit 2 is explicit block |
| PreToolUse read-only | PreToolUse can modify inputs via `updatedInput` | Claude Code v2.0.10+ | Could sanitize content instead of blocking, but D-02 says block |
| Session-based WS subscriptions | Channel-per-workbench multiplexing | Phase 2 | Violation events target specific workbench channels, not sessions |

**Deprecated/outdated:**
- Top-level `decision` and `reason` fields in PreToolUse output -- use `hookSpecificOutput.permissionDecision` and `permissionDecisionReason` instead
- Exit code 1 for blocking -- ambiguous; use exit code 2 for explicit block

## Open Questions

1. **Approval Gate Timeout Mechanism**
   - What we know: settings.json timeout is per-hook (currently 10s). Approval gates need up to 120s for human response.
   - What's unclear: Whether increasing hook timeout to 300s is acceptable, or whether the approval flow should use a different mechanism (e.g., PreToolUse returns `permissionDecision: "ask"` to let Claude Code handle the prompt natively, or the hook polls backend with a timeout loop).
   - Recommendation: Increase the specific approval hook timeout to 300s in settings.json. Use a polling loop inside the hook (1s intervals, max 120 iterations). If timeout, exit 2 with "Approval timed out - action denied." This keeps the blocking mechanism within the hook where it belongs.

2. **MultiEdit Tool Input Shape**
   - What we know: Write has `content`, Edit has `old_string`/`new_string`.
   - What's unclear: The exact shape of MultiEdit's `tool_input` (may be `edits: Array<{old_string, new_string}>`).
   - Recommendation: Handle gracefully -- if `tool_input.edits` is an array, iterate and check each `new_string`. If the shape is different at runtime, log and allow (fail-open for unknown shapes).

3. **Which Workbench ID to Associate With Hook Violations**
   - What we know: Hooks receive `session_id` but not a workbench ID directly. The backend maps session IDs to workbenches.
   - What's unclear: Whether the hook can reliably determine which workbench triggered the edit.
   - Recommendation: Hook POSTs violation with `session_id` to backend. Backend looks up session-to-workbench mapping and broadcasts to the correct channel. If mapping not found, broadcast to `_system` channel as fallback.

4. **Component Manifest Injection (NEURAL-07)**
   - What we know: manifest.ts exists at `packages/app/src/components/ui/manifest.ts`. It's a TypeScript file, not a JSON file.
   - What's unclear: Best injection point -- SessionStart hook? Agent prompt template? Or a separate file the agent reads?
   - Recommendation: Export a static JSON version of the manifest alongside the .ts file. Inject the JSON path via system message in SessionStart hook. Agents can then read it with the Read tool.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Hook scripts, backend | Yes | (system) | -- |
| Git | Checkpoint/rollback | Yes | (system) | -- |
| pnpm | Package builds | Yes | 10.29.3 | -- |
| TypeScript | Hook compilation | Yes | ^5.3.3 | -- |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.0 |
| Config file (app) | packages/app/vitest.config.ts |
| Config file (backend) | packages/backend/vitest.config.ts |
| Quick run command | `pnpm --filter @afw/app test -- --run` |
| Full suite command | `pnpm test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NEURAL-01 | Hook validates .tsx/.css files against design rules | unit | `pnpm --filter @afw/hooks vitest run src/__tests__/design-validate.test.ts -x` | Wave 0 |
| NEURAL-02 | PreToolUse blocks raw hex, rgb(), inline style | unit | `pnpm --filter @afw/hooks vitest run src/__tests__/design-validate-pre.test.ts -x` | Wave 0 |
| NEURAL-03 | PostToolUse warns on non-token colors | unit | `pnpm --filter @afw/hooks vitest run src/__tests__/design-validate-post.test.ts -x` | Wave 0 |
| NEURAL-04 | Violation events delivered via WebSocket | integration | `pnpm --filter @afw/backend vitest run src/__tests__/validation-events.test.ts -x` | Wave 0 |
| NEURAL-05 | Critical = block, warning = advisory | unit | covered by NEURAL-02/03 tests | -- |
| NEURAL-06 | Semantic compliance via additionalContext | unit | covered by NEURAL-03 tests | -- |
| NEURAL-07 | manifest.json injected/available | unit | `pnpm --filter @afw/hooks vitest run src/__tests__/manifest-inject.test.ts -x` | Wave 0 |
| SAFETY-01 | Checkpoint timeline + one-click revert | unit + integration | `pnpm --filter @afw/app vitest run src/__tests__/checkpointMarker.test.tsx -x` | Wave 0 |
| SAFETY-02 | Approval gates with approve/deny | unit | `pnpm --filter @afw/app vitest run src/__tests__/approvalGateCard.test.tsx -x` | Wave 0 |
| SAFETY-03 | Risk-based escalation per autonomy level | unit | `pnpm --filter @afw/backend vitest run src/__tests__/approval-service.test.ts -x` | Wave 0 |
| SAFETY-04 | Gates don't block pipeline | integration | covered by SAFETY-03 test (per-action scope) | -- |
| SAFETY-05 | Per-workbench autonomy settings | unit | `pnpm --filter @afw/app vitest run src/__tests__/autonomySettings.test.tsx -x` | Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm type-check && pnpm --filter @afw/hooks vitest run --run`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `packages/hooks/vitest.config.ts` -- hooks package has no vitest config (needs creation)
- [ ] `packages/hooks/src/__tests__/design-validate-pre.test.ts` -- PreToolUse regex validation tests
- [ ] `packages/hooks/src/__tests__/design-validate-post.test.ts` -- PostToolUse audit tests
- [ ] `packages/backend/src/__tests__/validation-events.test.ts` -- WebSocket violation broadcast
- [ ] `packages/backend/src/__tests__/approval-service.test.ts` -- Approval lifecycle
- [ ] `packages/app/src/__tests__/checkpointMarker.test.tsx` -- Pipeline checkpoint UI
- [ ] `packages/app/src/__tests__/approvalGateCard.test.tsx` -- Approval card render + interaction
- [ ] `packages/app/src/__tests__/autonomySettings.test.tsx` -- Settings page section

## Project Constraints (from CLAUDE.md)

- **Tech stack preservation:** React 18 + TypeScript + Vite (frontend), Express + ws (backend), pnpm monorepo -- no new frameworks
- **Design system enforcement:** No raw CSS in agent output. Component library is the only way agents build UI
- **Naming conventions:** PascalCase .tsx components, camelCase hooks with `use` prefix, `[ModuleName]` log prefixes
- **TypeScript strict mode:** `strict: true`, `noUncheckedIndexedAccess: true` -- all new code must comply
- **ES modules:** All packages use `"type": "module"` -- use `.js` extensions in imports
- **Branded types:** Use branded string types from @afw/shared (SessionId, etc.) -- no raw string casting
- **Error handling:** Silent failure pattern for secondary services (log at debug, don't crash)
- **GSD workflow:** Do not make direct repo edits outside a GSD workflow

## Sources

### Primary (HIGH confidence)
- Existing hook scripts in `packages/hooks/src/` -- afw-format-check.ts, afw-control-check.ts, afw-step-spawned.ts (established patterns for stdin reading, exit codes, backend API calls)
- `.claude/settings.json` -- hook registration format with matchers and timeouts
- `packages/app/src/styles/theme.css` -- complete design token definitions (the source of truth for what tokens exist)
- `packages/app/src/components/ui/manifest.ts` -- component library manifest
- `packages/app/src/workbenches/chat/AskUserRenderer.tsx` -- interactive card pattern (the model for ApprovalGateCard)
- `packages/app/src/components/pipeline/StepNode.tsx` -- pipeline node component to extend
- `packages/app/src/lib/pipeline-types.ts` -- StepNodeData to extend with CheckpointData
- `packages/app/src/lib/chat-types.ts` -- message types to extend with ApprovalRequest
- `packages/app/src/stores/pipelineStore.ts` -- zustand store pattern for pipeline state
- `packages/app/src/lib/ws-client.ts` -- WSClient singleton, channel subscription API
- `packages/shared/src/ws-envelope.ts` -- WSEnvelope interface, SYSTEM_CHANNEL, BROADCAST_CHANNEL
- `packages/backend/src/ws/hub.ts` -- WebSocketHub channel broadcast method
- `packages/backend/src/services/gateCheckpoint.ts` -- GateCheckpoint service (existing gate validation pattern)

### Secondary (MEDIUM confidence)
- [Claude Code Hooks reference](https://code.claude.com/docs/en/hooks) -- PreToolUse/PostToolUse input/output format, exit codes, hookSpecificOutput.permissionDecision format
- [Claude Code hook development skill](https://github.com/anthropics/claude-code/blob/main/plugins/plugin-dev/skills/hook-development/SKILL.md) -- official patterns

### Tertiary (LOW confidence)
- MultiEdit tool_input shape -- inferred from Edit pattern, needs runtime validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed, versions verified from package.json
- Architecture: HIGH -- patterns directly derived from existing codebase (AskUserRenderer, StepNode, hook scripts)
- Pitfalls: HIGH -- identified from real codebase patterns (Windows paths, hook timeouts, tool input shapes)
- Hook I/O format: HIGH -- verified against official Claude Code docs
- Approval gate timeout mechanism: MEDIUM -- multiple viable approaches, recommendation provided but needs validation

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable -- hooks API is mature, project patterns are established)
