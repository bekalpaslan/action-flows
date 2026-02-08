# Second Opinion Action

> Invoke local Ollama model for independent critique of agent output.

## Model

haiku (agent is lightweight -- just runs a CLI and reads output)

## Code Package

packages/second-opinion/

## Required Inputs

| Input | Description | Example |
|-------|-------------|---------|
| actionType | Action that produced original output | `review`, `audit` |
| claudeOutputPath | Absolute path to the agent's output file | `.claude/actionflows/logs/review/.../review-report.md` |
| originalInput | Brief description of what was reviewed/audited | `packages/backend/src/routes/sessions.ts` |

## Optional Inputs

| Input | Description | Default |
|-------|-------------|---------|
| modelOverride | Specific Ollama model name | (uses config default for action type) |

## Output

Writes: `.claude/actionflows/logs/second-opinion/{description}_{datetime}/second-opinion-report.md`

## Extends

- `_abstract/agent-standards`
- `_abstract/create-log-folder`

## Notes

- Never blocks workflow -- all errors become SKIPPED
- Auto-triggered by orchestrator after review/ and audit/ steps
- Opt-in triggered for analyze/ and plan/ steps (orchestrator must add explicitly)
