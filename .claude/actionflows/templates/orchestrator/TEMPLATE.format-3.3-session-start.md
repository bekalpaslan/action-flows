<!-- Format 3.3: Session-Start Protocol Acknowledgment (P4) -->
<!-- Purpose: Acknowledge successful session initialization -->
<!-- Source: CONTRACT.md § Format 3.3 -->
<!-- TypeScript Type: SessionStartProtocolParsed -->
<!-- Parser: parseSessionStartProtocol(text: string) -->

---

## Required Fields

- Heading: `## Session Started`
- Configuration summary (project, contexts, flows, actions loaded)
- Past execution context (if any)

---

## Optional Fields

- Environment status
- Active settings
- Loaded extensions

---

## Validation Rules

- Must include heading `## Session Started`
- Configuration summary must mention loaded components
- Used internally by orchestrator (not typically exposed to users)

---

## Template Structure

```markdown
## Session Started

**Project:** {project_name}

**Configuration Loaded:**
- Contexts: {count} contexts ready
- Flows: {count} flows indexed
- Actions: {count} actions available
- Components: {component_list}

**Past Executions:**
- Total chains: {count}
- Last execution: {date_or_never}
- Success rate: {percentage}

**Status:** Ready for input
```

---

## Examples

**Clean session start:**
```markdown
## Session Started

**Project:** ActionFlows Dashboard

**Configuration Loaded:**
- Contexts: 8 contexts ready
- Flows: 12 flows indexed
- Actions: 24 actions available
- Components: backend, frontend, shared, mcp-server

**Past Executions:**
- Total chains: 0
- Last execution: Never
- Success rate: N/A

**Status:** Ready for input
```

**Session with history:**
```markdown
## Session Started

**Project:** ActionFlows Dashboard

**Configuration Loaded:**
- Contexts: 8 contexts ready
- Flows: 12 flows indexed
- Actions: 24 actions available
- Components: backend, frontend, shared, mcp-server

**Past Executions:**
- Total chains: 47
- Last execution: 2026-02-21 14:30:45 UTC
- Success rate: 94%

**Recent Activity:**
- Last 5 chains: code→review→commit (88% success)
- Active learnings: 3 learning entries logged
- Pending issues: None

**Status:** Ready for input
```

---

## Cross-References

- **CONTRACT.md:** § Format 3.3 — Session-Start Protocol Acknowledgment
- **TypeScript Type:** `SessionStartProtocolParsed`
- **Parser:** `parseSessionStartProtocol(text: string)` in `packages/shared/src/contract/parsers.ts`
- **Pattern:** `/^## Session Started$/m`
- **Note:** Currently NOT produced by orchestrator (internal use only)
