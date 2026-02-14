# Standards Creation Flow

> Create canonical framework standards and templates that derive from CONTRACT.md

---

## When to Use

- Human wants to create a new template for orchestrator output formats
- A new CONTRACT.md format has been added and needs a corresponding template
- An existing template needs to be updated to reflect contract evolution
- Orchestrator identifies a missing template during format implementation

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| template-type | Category of template to create | `"orchestrator"`, `"agent"`, `"git"`, `"registry"` |
| requirements | Template purpose and what it should cover | `"Create orchestrator template for Format 6.1 - Chain Recompilation"` |
| contract-ref | CONTRACT.md format reference (if applicable) | `"Format 6.1"` or `"none"` |

---

## Action Sequence

### Step 1: Analyze Template Needs

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** opus

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

IMPORTANT: You are a spawned subagent executor.
Do NOT read .claude/actionflows/ORCHESTRATOR.md — it is not for you.
Do NOT delegate work or compile chains. Execute your agent.md directly.

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express 4.18 + TypeScript + ws 8.14.2 + ioredis 5.3 + Zod
- Frontend: React 18.2 + Vite 5 + Electron 28 + ReactFlow + Monaco + xterm
- Shared: Branded types, discriminated unions, ES modules
- Paths: backend=packages/backend/, frontend=packages/app/, shared=packages/shared/
- Ports: backend=3001, vite=5173

Input:
- scope: .claude/actionflows/CONTRACT.md (if contract-ref is provided), existing templates in .claude/actionflows/templates/
- task: Analyze what the new template needs to include based on the template-type and requirements
- depth: detailed
```

**Gate:** Analysis report delivered with template structure requirements, CONTRACT.md derivation notes (if applicable), and field specifications.

---

### Step 2: HUMAN GATE

Present the template structure analysis for approval. Human reviews the proposed template sections, fields, placeholders, and CONTRACT.md alignment (if applicable).

---

### Step 3: Create Template File

**Spawn after Human approves:**

**Action:** `.claude/actionflows/actions/code/framework/`
**Model:** sonnet

```
Read your definition in .claude/actionflows/actions/code/framework/agent.md

IMPORTANT: You are a spawned subagent executor.
Do NOT read .claude/actionflows/ORCHESTRATOR.md — it is not for you.
Do NOT delegate work or compile chains. Execute your agent.md directly.

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express 4.18 + TypeScript + ws 8.14.2 + ioredis 5.3 + Zod
- Frontend: React 18.2 + Vite 5 + Electron 28 + ReactFlow + Monaco + xterm
- Shared: Branded types, discriminated unions, ES modules
- Paths: backend=packages/backend/, frontend=packages/app/, shared=packages/shared/
- Ports: backend=3001, vite=5173

Input:
- task: Create template file at .claude/actionflows/templates/{template-category}/{filename}
- template-structure: Path to Step 1 analysis report (log folder output)
- contract-ref: {contract-ref from human input, or "none"}
- reference-templates: .claude/actionflows/templates/ (for structure consistency)
```

**Gate:** Template file created with:
- Placeholder syntax `{placeholder-name}` for all customizable values
- Required vs optional section markers
- Complete working examples
- CONTRACT.md cross-references (if contract-backed)
- Validation rules and constraints
- Template structure comments

---

### Step 4: Review Template for Contract Compliance

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet

**Spawn after Step 3:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

IMPORTANT: You are a spawned subagent executor.
Do NOT read .claude/actionflows/ORCHESTRATOR.md — it is not for you.
Do NOT delegate work or compile chains. Execute your agent.md directly.

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express 4.18 + TypeScript + ws 8.14.2 + ioredis 5.3 + Zod
- Frontend: React 18.2 + Vite 5 + Electron 28 + ReactFlow + Monaco + xterm
- Shared: Branded types, discriminated unions, ES modules
- Paths: backend=packages/backend/, frontend=packages/app/, shared=packages/shared/
- Ports: backend=3001, vite=5173

Input:
- scope: .claude/actionflows/templates/{template-file}
- type: template-review
- contract-ref: {contract-ref from human input, or "none"}
```

**Gate:** Template reviewed and APPROVED with validation that:
- If contract-backed: Derives correctly from CONTRACT.md format specification
- All required fields documented
- Placeholder syntax is consistent with existing templates
- Examples are complete and accurate
- Cross-references are correct
- Template follows existing template conventions

---

### Step 5: Second Opinion

**Action:** `.claude/actionflows/actions/review/second-opinion/`
**Model:** opus

**Spawn after Step 4:**
```
Read your definition in .claude/actionflows/actions/review/second-opinion/agent.md

IMPORTANT: You are a spawned subagent executor.
Do NOT read .claude/actionflows/ORCHESTRATOR.md — it is not for you.
Do NOT delegate work or compile chains. Execute your agent.md directly.

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express 4.18 + TypeScript + ws 8.14.2 + ioredis 5.3 + Zod
- Frontend: React 18.2 + Vite 5 + Electron 28 + ReactFlow + Monaco + xterm
- Shared: Branded types, discriminated unions, ES modules
- Paths: backend=packages/backend/, frontend=packages/app/, shared=packages/shared/
- Ports: backend=3001, vite=5173

Input:
- scope: .claude/actionflows/templates/{template-file}
- context: Template review report from Step 4
- contract-ref: {contract-ref from human input, or "none"}
```

**Gate:** Second opinion delivered. If consensus APPROVED → proceed to commit. If NEEDS_CHANGES → loop back to code/ with feedback.

---

### Step 6: Commit Template

**Action:** `.claude/actionflows/actions/commit/`
**Model:** haiku

**Spawn after Step 5 approves:**
```
Read your definition in .claude/actionflows/actions/commit/agent.md

IMPORTANT: You are a spawned subagent executor.
Do NOT read .claude/actionflows/ORCHESTRATOR.md — it is not for you.
Do NOT delegate work or compile chains. Execute your agent.md directly.

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express 4.18 + TypeScript + ws 8.14.2 + ioredis 5.3 + Zod
- Frontend: React 18.2 + Vite 5 + Electron 28 + ReactFlow + Monaco + xterm
- Shared: Branded types, discriminated unions, ES modules
- Paths: backend=packages/backend/, frontend=packages/app/, shared=packages/shared/
- Ports: backend=3001, vite=5173

Input:
- scope: .claude/actionflows/templates/
- message-hint: "feat: add {template-name} template for {purpose}"
```

**Gate:** Template committed to repository with conventional commit message and co-author attribution.

---

## Dependencies

```
Step 1 → Step 2 (HUMAN GATE) → Step 3 → Step 4 → Step 5 → Step 6
                                           ↓
                                    If NEEDS_CHANGES
                                           ↓
                                    ← Step 3 (loop)
```

**Parallel groups:** None — fully sequential with conditional loop at review stage.

---

## Chains With

- ← `contract-format-implementation/` (after new CONTRACT.md format is added, create template)
- → `post-completion/` (after template is committed, update README.md if needed)

---

## Example

```
Human: "Create orchestrator template for Format 6.1 - Chain Recompilation"

Orchestrator Routes to: template-creation/

Step 1: analyze/ examines CONTRACT.md § Format 6.1
  Result: Template structure analysis with required fields: chainId, reason, newSteps[], timestamp

Step 2: HUMAN GATE
  Human reviews structure
  Human approves

Step 3: code/framework/ creates TEMPLATE.format-6.1-chain-recompilation.md
  Result: Template file with placeholders, examples, validation rules

Step 4: review/ validates template
  Result: APPROVED - template correctly derives from CONTRACT.md § 6.1, follows placeholder conventions

Step 5: second-opinion/ confirms review
  Result: Consensus APPROVED - ready to commit

Step 6: commit/ commits template
  Result: feat: add format-6.1-chain-recompilation template for mid-execution redesign

Output: New template available at .claude/actionflows/templates/orchestrator/TEMPLATE.format-6.1-chain-recompilation.md
```

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Template doesn't match CONTRACT.md fields | Loop back to code/ with CONTRACT.md cross-reference analysis |
| Placeholder syntax inconsistent with existing templates | Review existing templates and standardize on `{kebab-case-name}` format |
| Missing validation rules for contract-backed template | Add Zod schema references and parser cross-links |
| Template lacks complete working examples | Code agent must generate realistic example data for all fields |

---

## Notes

- **Derivation Principle:** Contract-backed templates (orchestrator/, some agent/) MUST derive structure, fields, and validation from CONTRACT.md. Templates are the canonical reference for implementing contract formats.
- **Template Categories:** Four categories exist: orchestrator/ (8 formats), agent/ (4 formats), git/ (2 formats), registry/ (3 formats). Each category has different derivation sources.
- **Non-Contract Templates:** Agent output templates (changes.md, test-report.md) and git templates derive from observed patterns and conventions, not CONTRACT.md.
- **README Update:** When adding new templates, update .claude/actionflows/templates/README.md to document the new file in the appropriate section.
- **Template of Templates:** TEMPLATE.agent.md and TEMPLATE.instructions.md are meta-templates that define how to create new actions and flows. Changes to these files affect framework extension patterns.
