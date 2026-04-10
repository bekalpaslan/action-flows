# Second Opinion Action

> Independent sonnet-based critique of another action's output.

## Model

sonnet

## Required Inputs

| Input | Description | Example |
|-------|-------------|---------|
| actionType | Action that produced original output | `review`, `audit` |
| targetReport | Absolute path to the report file to critique | `.claude/actionflows/logs/review/.../review-report.md` |
| originalInput | Brief description of what was reviewed/audited | `packages/backend/src/routes/sessions.ts` |

## Optional Inputs

| Input | Description | Default |
|-------|-------------|---------|
| focus | Specific concerns to focus on during critique | (general critique) |

## Output

Writes: `.claude/actionflows/logs/second-opinion/{original_action}_{datetime}/second-opinion-report.md`

## Extends

- `_abstract/agent-standards`
- `_abstract/create-log-folder`

## When to Use

- After any `review/` or `audit/` step (auto-triggered by orchestrator)
- Opt-in for `analyze/` and `plan/` steps when a second perspective adds value
- Whenever the stakes are high enough to warrant an independent read of the original agent's conclusions

## Notes

- Never blocks workflow -- missing or empty targetReport becomes SKIPPED
- The agent reasons independently; it does not defer to the original agent's conclusions
- Verdict is one of: ALIGNED, PARTIALLY_ALIGNED, or DIVERGENT
