# ActionFlows Quick Reference Card

**Generated:** {YYYY-MM-DD}
**For:** {Human name if provided, otherwise "ActionFlows User"}
**Level:** Beginner

---

## Sacred vs Safe

### Sacred (Don't Touch)
**If the dashboard PARSES it → Sacred**

**Critical formats:**
- Chain Compilation Table (columns: #, Action, Model, Key Inputs, Waits For, Status)
- Step Completion Announcement (`>> Step N complete: action/ -- result. Continuing...`)
- Log Folder Naming (`.claude/actionflows/logs/{action}/{desc}_{datetime}/`)

**See full list:** `.claude/actionflows/CONTRACT.md`

### Safe (Change Freely)
**If the dashboard READS it → Safe**

**Change freely:**
- Add/edit flows (FLOWS.md)
- Add/edit actions (agent.md, instructions.md)
- Customize routing (CONTEXTS.md)
- Modify agent instructions (within standards)
- Update project config (project.config.md)

---

## The Sin Test (Simple Version)

**Rule:** Orchestrator coordinates, never produces content.

**If orchestrator starts writing code, analysis, or documentation:**
Say: **"It's a sin"**

**Orchestrator will:**
1. Stop
2. Acknowledge boundary
3. Compile proper chain
4. Spawn specialized agent

**Why:** Agents produce higher quality (95%) than orchestrator doing work itself (70%).

---

## Common Request Examples

### Request a Feature
```
Human: "Implement login rate limiting"

Orchestrator:
- Reads routing: "implement" → work context → code-and-review/
- Compiles chain: code → review → commit
- Presents for approval
- You: "Execute"
- Orchestrator spawns agents
```

### Fix a Bug
```
Human: "Fix validation error in auth.ts"

Orchestrator:
- Routing: "fix" → maintenance context → bug-triage/
- Compiles chain: analyze → code → review → commit
- Presents for approval
```

### Audit Code
```
Human: "Audit security of API routes"

Orchestrator:
- Routing: "audit" → review context → audit-and-fix/
- Compiles chain: audit → remediate (if critical) → report
- Presents for approval
```

---

## Emergency Commands

| Command | What It Does |
|---------|-------------|
| "It's a sin" | Reset orchestrator boundary violation |
| "Cancel" | Abort current chain |
| "Skip second opinions" | Suppress second-opinion steps |
| "Show me the chain again" | Re-display chain compilation |
| "Go back" | Return to previous decision point |

---

## When to Compile Chains vs Quick Triage

### Compile Full Chain (delegate)
- 4+ files affected
- Requires analysis or design
- Cross-package changes
- Any uncertainty

### Quick Triage (orchestrator may handle)
- 1-3 files affected
- Obvious, mechanical fix
- Single package
- 100% confident

**When in doubt → Compile chain**

---

## Where to Get Help

- Show examples: "Show me an example of X"
- Explain again: "Explain {topic} again"
- Review onboarding: "Review sacred formats"
- Read docs: `.claude/actionflows/CONTRACT.md`, `ORCHESTRATOR.md`, `CONTEXTS.md`

---

## Next Steps

1. **Try a request:** "I have an idea—{your idea}"
2. **Customize routing:** Edit CONTEXTS.md
3. **Create a flow:** "Create a flow called {flow-name}/"
4. **Join evolution loop:** Approve agent learnings

---

**Completed:** Beginner Level
**Next:** Intermediate Level (context routing, review pipeline)
**Resume anytime:** "Continue onboarding to Intermediate"
