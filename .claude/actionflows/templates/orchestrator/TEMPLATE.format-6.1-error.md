<!-- Format 6.1: Error Announcement (P1) -->
<!-- Purpose: Announce an error during chain execution -->
<!-- Source: CONTRACT.md § Format 6.1 -->
<!-- TypeScript Type: ErrorAnnouncementParsed -->
<!-- Parser: parseErrorAnnouncement(text: string) -->

---

## Required Fields

- `{error_title}` (string) — Brief error description
- `{step_num}` (integer) — Step number where error occurred
- `{action}` (string) — Action path (with trailing slash)
- `{message}` (string) — Error message
- `{context}` (string) — What was being attempted
- `{recovery_options}` (list) — Retry, Skip, Cancel options

---

## Optional Fields

- Stack trace or detailed error information
- File paths and line numbers
- Suggestions for resolution

---

## Validation Rules

- Must start with heading `## Error: {title}`
- Step and action must be valid
- Recovery options must be one of: Retry, Skip, Cancel
- Error message should be concise but informative

---

## Template Structure

```markdown
## Error: {error_title}

**Step:** {step_num}
**Action:** {action}/

**Message:**
{Detailed error message}

**Context:**
{What was being attempted when the error occurred}

**Recovery Options:**
- **Retry:** Run this step again (useful if temporary network issue)
- **Skip:** Continue to next step (useful if this step is optional)
- **Cancel:** Stop the chain (useful if error is critical)
```

---

## Examples

**Network timeout:**
```markdown
## Error: Backend Health Check Failed

**Step:** 1
**Action:** health-check/

**Message:**
ECONNREFUSED 127.0.0.1:3001 — Cannot connect to backend server

**Context:**
Initial health check before spawning agent steps. Backend should be running on port 3001.

**Recovery Options:**
- **Retry:** Wait for backend startup (run `pnpm dev:backend` in another terminal)
- **Skip:** Proceed without health check (experimental, not recommended)
- **Cancel:** Stop chain and start fresh

**Suggestion:** Start backend service first with `pnpm dev:backend`, then retry this step.
```

**Validation error:**
```markdown
## Error: Invalid Input to code/backend Action

**Step:** 3
**Action:** code/backend/

**Message:**
Task parameter is empty. Expected non-empty string describing code changes.

**Context:**
Attempting to spawn code generation step for backend implementation. Task field is required and must contain a description of what to implement.

**Recovery Options:**
- **Retry:** Provide a task description and rerun (e.g., "Implement JWT authentication middleware")
- **Skip:** Continue to next step (may result in incomplete implementation)
- **Cancel:** Recompile chain with better-specified inputs
```

**Permission error:**
```markdown
## Error: File Permission Denied

**Step:** 5
**Action:** commit/

**Message:**
EACCES /d/ActionFlowsDashboard/.git/HEAD — Permission denied

**Context:**
Attempting to commit changes to git repository. Permission denied on .git directory.

**Recovery Options:**
- **Retry:** Fix file permissions and retry (run `chmod -R u+w .git`)
- **Skip:** Save changes manually
- **Cancel:** Stop execution and investigate git permissions
```

---

## Cross-References

- **CONTRACT.md:** § Format 6.1 — Error Announcement
- **TypeScript Type:** `ErrorAnnouncementParsed`
- **Parser:** `parseErrorAnnouncement(text: string)` in `packages/shared/src/contract/parsers.ts`
- **Pattern:** `/^## Error: (.+)$/m`
- **Related:** Format 3.2 (Learning Surface for post-mortem analysis)
