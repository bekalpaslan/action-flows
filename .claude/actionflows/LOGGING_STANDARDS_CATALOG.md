# Logging Standards Catalog

> Index pointing to where logging standards are defined.

---

## Quick Reference

| Topic | Location |
|-------|----------|
| **Log levels** (TRACE/DEBUG/INFO/WARN/ERROR) | `actions/_abstract/agent-standards/instructions.md` § Trace Standards |
| **Universal log types** (tool-usage, agent-reasoning, data-flow) | `actions/_abstract/agent-standards/instructions.md` § Trace Standards |
| **Trace depth convention** | `actions/_abstract/agent-standards/instructions.md` § Trace Standards |
| **analyze/ logging requirements** | `actions/analyze/agent.md` § Logging Requirements |
| **code/ logging requirements** | `actions/code/agent.md` § Logging Requirements |
| **review/ logging requirements** | `actions/review/agent.md` § Logging Requirements |
| **plan/ logging requirements** | `actions/plan/agent.md` § Logging Requirements |
| **audit/ logging requirements** | `actions/audit/agent.md` § Logging Requirements |
| **commit/ logging requirements** | `actions/commit/agent.md` § Logging Requirements |
| **Gate checkpoint specifications** | `packages/backend/src/services/gateCheckpoint.ts` (JSDoc) |
| **Log file structure** | `logs/` (convention: `{action}/{description}_{datetime}/`) |

---

## Log Output Structure

```
.claude/actionflows/logs/
├── [action-type]/
│   └── [session-name]_[timestamp]/
│       ├── report.md (main output)
│       └── logs/ (optional, for DEBUG+ level)
│           ├── orchestrator-decisions.log (JSON lines)
│           ├── tool-usage.log (JSON lines)
│           ├── agent-reasoning.log (JSON lines)
│           └── data-flow.log (JSON lines)
```

---

## See Also

- **Contract formats:** `CONTRACT.md`
- **Agent standards:** `actions/_abstract/agent-standards/instructions.md`
- **Gate architecture:** `packages/shared/src/types/gateTrace.ts`

---

**Last Updated:** 2026-02-12
**Status:** Index only (standards dissolved to source locations)
