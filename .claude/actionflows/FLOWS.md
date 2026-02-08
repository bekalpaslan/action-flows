# Flow Registry

> Orchestrator checks here first.

## Framework

| Flow | Purpose | Chain |
|------|---------|-------|
| onboarding/ | Interactive teaching session for ActionFlows | onboarding (single step, foreground) |
| flow-creation/ | Create a new flow | plan → human gate → code → review |
| action-creation/ | Create a new action | plan → human gate → code → review → second-opinion/ |
| action-deletion/ | Remove action safely | analyze → code → review |
| framework-health/ | Validate structure | analyze |
| doc-reorganization/ | Reorganize documentation | analyze → human gate → plan → human gate → code → review |

## Engineering

| Flow | Purpose | Chain |
|------|---------|-------|
| code-and-review/ | Implement and review code | code → review → second-opinion/ → (loop if needed) |
| bug-triage/ | Structured bug fix | analyze → code → test → review |
| post-completion/ | Wrap-up after work | commit → registry update |

## QA

| Flow | Purpose | Chain |
|------|---------|-------|
| audit-and-fix/ | Audit and remediate | audit → second-opinion/ → review |

## Human

| Flow | Purpose | Chain |
|------|---------|-------|
| ideation/ | Structured ideation sessions | classify (human gate) → analyze → brainstorm → code (summary) |
