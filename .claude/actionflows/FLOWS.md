# Flow Registry

> Orchestrator checks here first.

## Framework

| Flow | Purpose | Chain |
|------|---------|-------|
| framework/flow-creation/ | Create a new flow | plan → human gate → code → review |
| framework/action-creation/ | Create a new action | plan → human gate → code → review |
| framework/action-deletion/ | Remove action safely | analyze → code → review |
| framework/framework-health/ | Validate structure | analyze (drift check) |

## Engineering

| Flow | Purpose | Chain |
|------|---------|-------|
| engineering/code-and-review/ | Implement + review + commit | code → review → (loop if needed) → post-completion |
| engineering/post-completion/ | Standardized wrap-up | commit → status-update |
| engineering/bug-triage/ | Investigate and fix bugs | analyze → code → test → review → post-completion |

## QA

| Flow | Purpose | Chain |
|------|---------|-------|
| qa/audit-and-fix/ | Deep audit with remediation | audit → review → post-completion |
