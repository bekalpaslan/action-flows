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
**Triggers:** "create a new flow", "create a new action", "check framework health", "delete action"

### Engineering
**Owns:** Code implementation, reviews, bug fixes, refactoring
**Key Flows:** code-and-review/, bug-triage/, post-completion/
**Triggers:** "implement", "add feature", "fix bug", "refactor", "code change"

### QA
**Owns:** Audits, quality sweeps, security scans
**Key Flows:** audit-and-fix/
**Triggers:** "audit", "security scan", "quality check", "performance review"

### Human
**Owns:** Human-led ideation, brainstorming, thinking sessions, decision exploration
**Key Flows:** ideation/
**Triggers:** "I have an idea", "brainstorm", "let's think about something", "ideation"

## Routing Guide

| Human Says | Department | Flow/Action |
|------------|-----------|-------------|
| "implement X" / "add feature X" | Engineering | code-and-review/ |
| "fix bug X" / "X is broken" | Engineering | bug-triage/ |
| "refactor X" | Engineering | code-and-review/ |
| "audit security" / "security scan" | QA | audit-and-fix/ |
| "audit architecture" / "check performance" | QA | audit-and-fix/ |
| "run tests" | — | test/ (direct action) |
| "analyze coverage" / "check dependencies" | — | analyze/ (direct action) |
| "create a new flow" | Framework | flow-creation/ |
| "create a new action" | Framework | action-creation/ |
| "check framework health" | Framework | framework-health/ |
| "plan X" | — | plan/ (direct action) |
| "I have an idea" / "brainstorm X" | Human | ideation/ |
| "let's think about X" / "ideation" | Human | ideation/ |
