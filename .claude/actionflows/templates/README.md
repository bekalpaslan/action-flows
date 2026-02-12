# ActionFlows Template Files

This directory contains canonical template files for creating new actions and flows in the ActionFlows Dashboard framework.

## Files

### TEMPLATE.agent.md
**Use this template when creating a new action agent definition.**

**Location for new actions:**
```
.claude/actionflows/actions/{action-name}/agent.md
```

**Key sections:**
1. **Title & Introduction** — Identifies the agent and its mission
2. **Extends** — Lists inherited abstract standards (agent-standards, create-log-folder)
3. **Your Mission** — Detailed description of what this agent does
4. **Input Contract** — Table of inputs from orchestrator (name, type, required flag, description)
5. **Output Contract** — Primary deliverable, contract-defined outputs, free-form outputs
6. **Trace Contract** — Log folder pattern, log levels, log types, trace depth
7. **Steps to Complete** — Three-part structure: Create Log Folder, Execute Core Work, Generate Output
8. **Project Context** — Relevant technical details (stack, paths, ports)
9. **Constraints** — DO and DO NOT lists for this agent
10. **Learnings Output** — Template for completion message to orchestrator

**Template features:**
- Placeholder syntax: `{placeholder-name}` for all values to replace
- Inline comments explaining each section
- Links to abstract standards and configuration files
- Examples for table structures and code blocks

---

### TEMPLATE.instructions.md
**Use this template when creating a new flow orchestration file.**

**Location for new flows:**
```
.claude/actionflows/flows/{category}/{flow-name}/instructions.md
```

**Key sections:**
1. **Title & Purpose** — Flow name and one-line purpose in blockquote
2. **When to Use** — Bullet list of trigger conditions
3. **Prerequisites (optional)** — Environment/setup checks required before execution
4. **Required Inputs From Human** — Table with examples
5. **Action Sequence** — Step-by-step breakdown with spawn prompt templates
6. **Dependencies** — ASCII graph or prose description of step ordering
7. **Chains With (optional)** — Upstream/downstream flow references
8. **Example (optional)** — Concrete walkthrough of flow execution
9. **Common Issues & Fixes (optional)** — Troubleshooting table
10. **Notes (optional)** — Additional context

**Template features:**
- Placeholder syntax for all customizable values
- Complete spawn prompt template matching agent-standards expectations
- Step dependency notation with ASCII graphs
- Optional sections clearly marked `(optional)`
- Project context injected in each spawn prompt

---

## Usage Instructions

### Creating a New Action

1. **Copy the template:**
   ```bash
   cp .claude/actionflows/templates/TEMPLATE.agent.md \
      .claude/actionflows/actions/{your-action}/agent.md
   ```

2. **Replace placeholders:**
   - `{Action Name}` → Your action name (e.g., "Review")
   - `{action-name}` → Kebab-case version (e.g., "review")
   - `{input-name}` → Input parameter names
   - `{type}` → Input type (string, boolean, enum, etc.)
   - All other `{placeholders}` based on your agent's specific behavior

3. **Verify completeness:**
   - All 11 required sections present
   - All required inputs documented in Input Contract
   - Output Contract has primary deliverable and log type info
   - Trace Contract log folder path is correct pattern
   - Steps are numbered 1-3 with core work details

### Creating a New Flow

1. **Copy the template:**
   ```bash
   cp .claude/actionflows/templates/TEMPLATE.instructions.md \
      .claude/actionflows/flows/{category}/{flow-name}/instructions.md
   ```

2. **Replace placeholders:**
   - `{Flow Name}` → Your flow name (e.g., "Code and Review")
   - `{action-name}` → Action path reference (e.g., "code")
   - `{input-name}` → Human input names with examples
   - `{Step Name}` → Description of each step
   - `{opus|sonnet|haiku}` → Choose appropriate model

3. **Customize sections:**
   - Keep "Prerequisites (optional)" if environment checks needed, otherwise delete
   - Keep "Chains With (optional)" if upstream/downstream flows exist, otherwise delete
   - Keep "Example (optional)" for complex flows with walkthroughs, otherwise delete
   - Keep "Common Issues & Fixes (optional)" if troubleshooting guidance needed, otherwise delete
   - Keep "Notes (optional)" for additional context, otherwise delete

4. **Verify completeness:**
   - All 6 required sections present
   - Step dependencies correctly expressed in Dependencies section
   - All spawn prompts include Project Context
   - Gates clearly defined (deliverable or completion criteria)

---

## Template Conventions

### Placeholders
- **Format:** `{placeholder-name}` with descriptive text inside braces
- **When to replace:** Always — no placeholders should remain in finished files
- **Tip:** Search for `{` to find all remaining placeholders before committing

### Required vs Optional Sections

**agent.md:**
- **Required (11):** Title, Introduction, Extends, Your Mission, Input Contract, Output Contract, Trace Contract, Steps, Project Context, Constraints, Learnings Output
- **Optional (2):** Special consideration (in Mission), Logging Requirements table (usually included anyway)

**instructions.md:**
- **Required (6):** Title, When to Use, Required Inputs, Action Sequence, Dependencies, (implicit) Flow purpose
- **Optional (6):** Prerequisites, Chains With, Example, Common Issues & Fixes, Notes, (more documented above)

### Section Ordering

**agent.md order:**
1. Title + intro
2. Extends
3. Your Mission
4. Input Contract
5. Output Contract
6. Trace Contract (including Logging Requirements)
7. Steps to Complete
8. Project Context
9. Constraints (DO / DO NOT)
10. Learnings Output

**instructions.md order:**
1. Title + blockquote
2. When to Use
3. Prerequisites (if needed)
4. Required Inputs
5. Action Sequence (Step 1, Step 2, ..., HUMAN GATE if needed)
6. Dependencies
7. Chains With (if needed)
8. Example (if needed)
9. Common Issues & Fixes (if needed)
10. Notes (if needed)

---

## Template Validation

After creating a new file from the template:

```bash
# Verify all placeholders replaced
grep -n "{" .claude/actionflows/actions/{action}/agent.md
# Should return: (empty — no matches)

# Check TypeScript files reference your action correctly
grep -r "{action-name}" packages/

# Run type-check if modifying backend/frontend code
pnpm type-check
```

---

## Template History

**Created:** 2026-02-12
**Based on:** Template Structure Analysis report (11 agent.md + 26 instructions.md files analyzed)
**Consistency:** 100% structural compliance across analyzed files
**Future updates:** When template patterns change, update both TEMPLATE files simultaneously and document breaking changes

---

## Integration Points

These templates are consumed by:
1. **New action creation:** Follow `.claude/actionflows/flows/framework/action-creation/instructions.md`
2. **New flow creation:** Follow `.claude/actionflows/flows/framework/flow-creation/instructions.md`
3. **Validation:** Used by harmony-check and structural validation scripts
4. **Documentation:** Referenced in onboarding and framework documentation

---

## Related Files

- `.claude/actionflows/actions/_abstract/agent-standards/instructions.md` — Behavioral standards all agents inherit
- `.claude/actionflows/actions/_abstract/create-log-folder/instructions.md` — Log folder creation standard
- `.claude/actionflows/CONTRACT.md` — Format specifications for contract-defined outputs
- `.claude/actionflows/project.config.md` — Project configuration values
- `docs/architecture/CONTRACT_EVOLUTION.md` — Process for evolving contract formats
