# Abstract Actions

> Reusable behavior patterns embedded into concrete actions.

Abstract actions are NOT standalone agents. They are instructions that concrete actions reference. When an action "extends" an abstract, the agent reads and follows those instructions as part of its execution.

## Available

| Abstract | Purpose |
|----------|---------|
| agent-standards/ | Core behavioral principles (8 rules) |
| create-log-folder/ | Create datetime-isolated output folders |
| post-notification/ | Post completion notifications |
| update-queue/ | Track status in queue.md |
| post-completion/ | Commit + notify + update status |
