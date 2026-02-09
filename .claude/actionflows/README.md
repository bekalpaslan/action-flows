# ActionFlows Framework

> Orchestration framework for delegating work to specialized agents.

## How It Works

1. Human makes a request
2. Orchestrator reads registries (CONTEXTS.md → FLOWS.md → ACTIONS.md)
3. Orchestrator compiles a chain of actions
4. Orchestrator presents chain to human for approval
5. Orchestrator spawns agents to execute
6. Agents report results; orchestrator coordinates handoffs

## Directory Structure

- `actions/` — Atomic building blocks (agent.md + instructions.md each)
- `actions/_abstract/` — Reusable behavior patterns
- `flows/` — Predefined action sequences by context
- `checklists/` — Validation criteria for reviews/audits
- `logs/` — Execution history and learnings

## Key Files

- `ACTIONS.md` — Registry of all actions
- `FLOWS.md` — Registry of all flows
- `CONTEXTS.md` — Context routing rules
