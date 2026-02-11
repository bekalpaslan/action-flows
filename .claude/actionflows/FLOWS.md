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
| cleanup/ | Human-directed repository cleanup | analyze → plan → human gate → code → review → second-opinion/ → commit |

## explore

| Flow | Purpose | Chain |
|------|---------|-------|
| doc-reorganization/ | Reorganize documentation | analyze → human gate → plan → human gate → code → review |
| ideation/ | Structured ideation sessions | classify (human gate) → analyze → brainstorm → code (summary) |

## review

| Flow | Purpose | Chain |
|------|---------|-------|
| audit-and-fix/ | Audit and remediate | audit → second-opinion/ → review |
| test-coverage/ | Analyze test coverage and address gaps | test → analyze → code (conditional) |
| backwards-harmony-audit/ | Audit contract harmony from frontend backwards | analyze×3 (parallel) → audit → second-opinion/ |
| cli-integration-test/ | Systematic CLI integration testing | analyze → code → test → review |
| e2e-chrome-mcp/ | Chrome MCP browser E2E test creation and execution | analyze → plan → human gate → code → chrome-mcp-test → review |
| contract-index/ | Create/update behavioral contract specifications for components | analyze → plan → human gate → code×N → review → commit |
| contract-compliance-audit/ | Audit contracts for inconsistencies, drift, and create compliance tests | analyze×2 (parallel) → plan → human gate → code×2 (parallel) → review → second-opinion/ → commit |

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
| learning-dissolution/ | Process accumulated learnings into doc updates, agent patches, template fixes | analyze → plan → human gate → code×N (parallel) → review → commit |
