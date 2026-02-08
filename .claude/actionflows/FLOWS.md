# Flow Registry

> Orchestrator checks here first.

## Framework

| Flow | Purpose | Chain |
|------|---------|-------|
| flow-creation/ | Create a new flow | plan → human gate → code → review |
| action-creation/ | Create a new action | plan → human gate → code → review |
| action-deletion/ | Remove action safely | analyze → code → review |
| framework-health/ | Validate structure | analyze |
| doc-reorganization/ | Reorganize documentation | analyze → human gate → plan → human gate → code → review |

## Engineering

| Flow | Purpose | Chain |
|------|---------|-------|
| code-and-review/ | Implement and review code | code → review → (loop if needed) |
| bug-triage/ | Structured bug fix | analyze → code → test → review |
| post-completion/ | Wrap-up after work | commit → registry update |

## QA

| Flow | Purpose | Chain |
|------|---------|-------|
| audit-and-fix/ | Audit and remediate | audit → review |
