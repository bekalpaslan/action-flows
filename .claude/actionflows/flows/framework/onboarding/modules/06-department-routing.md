# Module 6: Department Routing

**Level:** Intermediate
**Duration:** ~15 min
**Prerequisites:** Modules 1-5 (Beginner complete)

---

## Presentation

Welcome to Intermediate level!

You've learned to USE the framework safely. Now let's learn to CUSTOMIZE it.

We'll start with department routing—how requests map to flows.

---

## Structure

ORGANIZATION.md defines departments and routing:

### Departments:
```
├── Framework — ActionFlows itself (flows, actions, orchestrator)
├── Engineering — Code, features, bug fixes
├── QA — Testing, auditing, quality checks
└── Human — Ideation, decision-making, brainstorming
```

### Routing Table:
```markdown
| Human Says | Department | Flow/Action |
|------------|-----------|-------------|
| "implement X" | Engineering | code-and-review/ |
| "fix bug X" | Engineering | bug-triage/ |
| "audit security" | QA | audit-and-fix/ |
| "I have an idea" | Human | ideation/ |
```

This is the FIRST routing decision in the orchestrator's workflow.

---

## Example Walk-Through

**Request:** "implement rate limiting"

### Step 1: Match trigger
Orchestrator scans routing table:
`"implement"` → Engineering department

### Step 2: Find flow
Orchestrator reads FLOWS.md:

```markdown
## Engineering Department

| Flow | Purpose | Chain |
|------|---------|-------|
| code-and-review/ | Implement features with quality checks | code → review → commit |
| bug-triage/ | Diagnose and fix bugs | analyze → code → review → commit |
```

Match: `"implement"` + `"feature"` → code-and-review/

### Step 3: Build chain
Orchestrator loads code-and-review/ instructions:

Action sequence: code → review → commit
[Builds chain table as you've seen]

### Step 4: Present for approval
[Shows chain to human]

---

## Customization

You can customize routing by editing ORGANIZATION.md:

### Add new triggers:
```markdown
| "secure X" | QA | security-audit/ |
| "deploy X" | Engineering | deploy-pipeline/ |
```

### Change department:
```markdown
| "review docs" | QA | docs-review/ |
```
(was Engineering, now QA)

### Add new department:
```markdown
## DevOps Department
- Owns: Deployment, infrastructure, monitoring
- Triggers: "deploy", "scale", "monitor"
```

---

## Quiz

**Question:** You want requests like "check dependencies" to route to a new flow called "dependency-audit/".

What would you add to ORGANIZATION.md?

A. `| "check dependencies" | Framework | dependency-audit/ |`
B. `| "check dependencies" | QA | dependency-audit/ |`
C. `| "check dependencies" | Engineering | dependency-audit/ |`
D. Any of the above, depending on who should own dependency audits

(Choose the best answer)

---

## Expected Answer

**Correct:** D

---

## Validation Responses

### If Correct
"Exactly! Department choice depends on your team's structure. QA owns auditing in most projects, but Engineering or a DevOps department could own it too. The routing table is YOUR configuration—structure it for your team."

### If Wrong
"Good thinking, but there's no single right answer. Department choice depends on your project's organization. QA typically owns audits, but Engineering or DevOps could too. The routing table is flexible—structure it for your team."

---

## Key Takeaway

Department routing is the framework's entry point:
1. Human intent → Routing trigger
2. Routing trigger → Department
3. Department → Flow (or dynamic action composition)

Customize it by editing ORGANIZATION.md. Changes take effect at next session-start (no framework restart needed).

---

## Transition

"Next: The review pipeline—how ActionFlows maintains quality."

Proceed to Module 7.
