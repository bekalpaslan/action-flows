# Organization Structure

> Maps human intent to the right team.

## Routing

```
Request → Which department? → Which flow? → No flow? Compose from actions → Execute
```

## Departments

### Framework
**Owns:** ActionFlows framework maintenance
**Key Flows:** flow-creation/, action-creation/, action-deletion/, framework-health/
**Triggers:** "create a new flow", "add an action", "remove action", "check framework health", "validate framework"

### Engineering
**Owns:** Code implementation, testing, bug fixes, post-completion workflows
**Key Flows:** code-and-review/, post-completion/, bug-triage/
**Triggers:** "implement", "build", "add feature", "fix bug", "refactor", "commit", "deploy"

### QA
**Owns:** Reviews, audits, analysis, quality gates
**Key Flows:** audit-and-fix/
**Triggers:** "review", "audit", "analyze", "check security", "check architecture", "coverage"

## Routing Guide

| Human Says | Department | Flow/Action |
|------------|-----------|-------------|
| "Add a new component" | Engineering | code-and-review/ |
| "Fix this bug" | Engineering | bug-triage/ |
| "Implement Phase 6" | Engineering | code-and-review/ (with plan/ first) |
| "Review the changes" | QA | compose: review/ |
| "Run security audit" | QA | audit-and-fix/ |
| "Check test coverage" | QA | compose: analyze/ (coverage) |
| "Run the tests" | Engineering | compose: test/ |
| "Commit the changes" | Engineering | compose: commit/ |
| "Create a new flow" | Framework | flow-creation/ |
| "Add a new action" | Framework | action-creation/ |
| "Check framework health" | Framework | framework-health/ |
| "Plan the next phase" | Engineering | compose: plan/ |
| "Analyze dependencies" | QA | compose: analyze/ (dependencies) |
| "Update project status" | Engineering | compose: status-update/ |
