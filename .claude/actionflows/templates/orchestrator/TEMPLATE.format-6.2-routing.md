<!-- Format 6.2: Context Routing Announcement (P5) -->
<!-- Purpose: Announce routing decision for a user request -->
<!-- Source: CONTRACT.md § Format 6.2 -->
<!-- TypeScript Type: DepartmentRoutingParsed -->
<!-- Parser: parseDepartmentRouting(text: string) -->

---

## Required Fields

- `{request_brief}` (string) — Summary of user request
- `{context}` (enum) — Target context (work, maintenance, explore, review, settings, pm, archive, harmony, editor)
- `{flow}` (string) — Recommended flow name or "Composed from actions"
- `{actions}` (list) — List of actions in the recommended flow
- `{explanation}` (string) — Why this routing was chosen
- `{confidence}` (number, nullable) — Routing confidence (0.0-1.0)
- `{disambiguated}` (boolean) — Whether human disambiguation was needed

---

## Optional Fields

- Alternative contexts considered
- Confidence breakdown

---

## Validation Rules

- Context must be from: work | maintenance | explore | review | settings | pm | archive | harmony | editor
- Confidence must be between 0.0 and 1.0 if provided
- Explanation should justify the routing choice
- Context names are extensible for custom workbenches

---

## Template Structure

```markdown
## Routing: {request_brief}

**Context:** {context}/
**Flow:** {flow_name}

**Actions:**
1. {action}
2. {action}
...

**Confidence:** {score}% ({disambiguated: yes/no})

**Explanation:**
{Why this routing was chosen based on keyword matching and context analysis}

**Next:**
Ready to execute the {flow_name} flow. Waiting for your confirmation.
```

---

## Examples

**Feature request routing:**
```markdown
## Routing: Add JWT authentication to backend

**Context:** work/
**Flow:** code-and-review/

**Actions:**
1. code/backend/ — Implement JWT middleware
2. review/ — Review authentication implementation
3. commit/ — Commit changes to git

**Confidence:** 94% (no disambiguation)

**Explanation:**
User request contains keywords "add", "implement", "backend", "authentication" — all matching work context indicators. Recommended flow is `code-and-review/` which combines implementation + quality check. This is a straightforward feature development task.

**Next:**
Ready to execute code-and-review/ flow. Confirm to proceed with JWT authentication implementation.
```

**Exploratory request routing:**
```markdown
## Routing: How does WebSocket reconnection work in our system?

**Context:** explore/
**Flow:** Composed from actions

**Actions:**
1. analyze/ — Codebase analysis of WebSocket implementation
2. brainstorm/ — Structured discussion of reconnection patterns

**Confidence:** 87% (no disambiguation)

**Explanation:**
Request contains "How does" and "understand" — learning-focused keywords matching explore context. Request is about understanding existing code, not modifying it. Recommended composition: analysis + brainstorm for collaborative learning.

**Next:**
Ready to explore WebSocket reconnection patterns. Confirm to proceed with analysis + discussion.
```

**Maintenance request with disambiguation:**
```markdown
## Routing: Fix the failing test suite (DISAMBIGUATION)

**Context:** maintenance/ (66% confidence) OR review/ (62% confidence)

**Primary Recommendation:** maintenance/

**Actions (maintenance/fix-tests/):**
1. test/vitest/ — Run failing tests and collect error details
2. code/backend/ — Fix implementation bugs
3. test/vitest/ — Verify fixes
4. commit/ — Commit repairs

**Alternative (review/):**
Would focus on code quality review first, then identify test failures as symptoms.

**Confidence:** 66% for maintenance, 62% for review (too close)

**Explanation:**
Request uses "fix" (maintenance keyword, 60% match) but context is ambiguous. Could be either fixing broken code (maintenance) or reviewing test coverage (review). Defaulting to maintenance since broken tests indicate code bugs, not quality gaps.

**Human Input Needed:**
Which is the primary issue?
- **Option A:** Code has bugs breaking tests → use maintenance flow
- **Option B:** Tests are insufficient for code quality → use review flow

Reply with your interpretation and we'll route accordingly.
```

---

## Cross-References

- **CONTRACT.md:** § Format 6.2 — Context Routing Announcement
- **TypeScript Type:** `DepartmentRoutingParsed` (legacy name, will be renamed to ContextRoutingParsed)
- **Parser:** `parseDepartmentRouting(text: string)` in `packages/shared/src/contract/parsers.ts`
- **Pattern:** `/^## Routing: (.+)$/m`
- **Related:** CONTEXTS.md (context definitions), FLOWS.md (flow registry)
- **Note:** Currently NOT produced by orchestrator (internal routing only). Legacy name "Department" will be renamed to "Context" in future contract version.
