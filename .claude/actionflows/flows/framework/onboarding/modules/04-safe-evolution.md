# Module 4: Safe Evolution

**Level:** Beginner
**Duration:** ~10 min
**Prerequisites:** Modules 1-3

---

## Presentation

Now the good news: MOST things are safe to evolve!

Here's what you can freely change without breaking anything:

---

## Examples

### 1. Adding New Flows

**Example:** You want a "security-audit/" flow

**Steps:**
1. Create directory: `.claude/actionflows/flows/review/security-audit/`
2. Write `instructions.md` defining the action sequence
3. Add entry to FLOWS.md:

```markdown
## review Context

| Flow | Purpose | Chain |
|------|---------|-------|
| security-audit/ | Comprehensive security review | audit → analyze → report |
```

Done! Orchestrator reads FLOWS.md at session-start and your flow is available immediately.

### 2. Adding New Actions

**Example:** You want a "deploy/" action

**Steps:**
1. Create directory: `.claude/actionflows/actions/deploy/`
2. Write `agent.md` (agent instructions)
3. Write `instructions.md` (when to use, inputs, dependencies)
4. Add entry to ACTIONS.md

Done! Action can be used in flows or composed into dynamic chains.

### 3. Modifying Agent Instructions

You can edit any `agent.md` file to improve instructions.

**Guardrails:**
- ✅ Add new steps
- ✅ Refine project context
- ✅ Improve error handling
- ✅ Update examples
- ❌ Don't remove "Extends" section (agent-standards)
- ❌ Don't remove "Learnings" output format
- ❌ Don't remove required inputs

Changes take effect on next agent spawn—no framework update needed.

### 4. Customizing Routing

Edit CONTEXTS.md to change how requests route:

```markdown
| Human Says | Context | Flow/Action |
|------------|---------|-------------|
| "secure X" | review  | security-audit/ |
```

Add triggers, change contexts, redirect flows—all safe.

---

## Complete Safe List

Safe to Evolve (8 categories):
1. Adding/editing flows
2. Adding/editing actions
3. Adding/editing contexts
4. Modifying agent instructions (within standards)
5. Editing ORCHESTRATOR.md philosophy sections
6. Customizing project.config.md values
7. Adding custom checklists
8. Extending abstract actions

---

## Quiz

**Question:** You want to add a "test-coverage/" flow. What do you do?

A. Edit CONTRACT.md first to define the flow format
B. Create flow directory, write instructions.md, update FLOWS.md
C. Ask Claude to spawn an agent to create the flow
D. Edit ORCHESTRATOR.md to recognize the new flow

(Choose the best answer)

---

## Expected Answer

**Correct:** B

---

## Validation Responses

### If Correct
"Exactly! Flows are safe to create directly. No contract changes needed, no orchestrator update required. Just create the files and update the registry."

### If Wrong
"Not quite. Flows are SAFE evolution—no contract changes needed. You just create the flow directory with instructions.md, then add an entry to FLOWS.md. The orchestrator reads FLOWS.md at session-start, so your flow is available immediately."

---

## Key Takeaway

The framework is designed for easy evolution. Most customization is in the SAFE zone:
- Add flows for your project's workflows
- Add actions for project-specific tasks
- Customize routing for your team's language
- Refine agent instructions based on learnings

The SACRED formats stay stable while everything else evolves freely.

---

## Transition

"Next up: The most important rule—The Sin Test."

Proceed to Module 5.
