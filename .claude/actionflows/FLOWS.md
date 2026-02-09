# Flow Registry

> Orchestrator checks here first.

## work

| Flow | Purpose | Chain |
|------|---------|-------|
| code-and-review/ | Implement and review code | code → review → second-opinion/ → (loop if needed) |
| post-completion/ | Wrap-up after work | commit → registry update |

## maintenance

| Flow | Purpose | Chain |
|------|---------|-------|
| bug-triage/ | Structured bug fix | analyze → code → test → review |
| code-and-review/ | Refactor and review code | code → review → second-opinion/ → (loop if needed) |

## explore

| Flow | Purpose | Chain |
|------|---------|-------|
| doc-reorganization/ | Reorganize documentation | analyze → human gate → plan → human gate → code → review |
| ideation/ | Structured ideation sessions | classify (human gate) → analyze → brainstorm → code (summary) |

## review

| Flow | Purpose | Chain |
|------|---------|-------|
| audit-and-fix/ | Audit and remediate | audit → second-opinion/ → review |

## settings

| Flow | Purpose | Chain |
|------|---------|-------|
| onboarding/ | Interactive teaching session for ActionFlows | onboarding (single step, foreground) |
| flow-creation/ | Create a new flow | plan → human gate → code → review |
| action-creation/ | Create a new action | plan → human gate → code → review → second-opinion/ |
| action-deletion/ | Remove action safely | analyze → code → review |
| framework-health/ | Validate structure | analyze |

## pm

| Flow | Purpose | Chain |
|------|---------|-------|
| planning/ | Structured roadmap review and prioritization | analyze → plan → human gate → code → commit |
