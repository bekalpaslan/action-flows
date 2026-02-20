# ActionFlows Template Files

This directory contains canonical template files for creating new actions and flows in the ActionFlows Dashboard framework.

## Directory Structure

```
templates/
├── orchestrator/         # Orchestrator output format templates (14 formats)
│   ├── TEMPLATE.format-1.1-chain-compilation.md
│   ├── TEMPLATE.format-1.2-execution-start.md
│   ├── TEMPLATE.format-1.3-chain-status.md
│   ├── TEMPLATE.format-1.4-execution-complete.md
│   ├── TEMPLATE.format-2.1-step-completion.md
│   ├── TEMPLATE.format-2.2-dual-output.md
│   ├── TEMPLATE.format-2.3-second-opinion-skip.md
│   ├── TEMPLATE.format-3.1-human-gate.md
│   ├── TEMPLATE.format-3.3-session-start.md
│   ├── TEMPLATE.format-3.2-learning-surface.md
│   ├── TEMPLATE.format-4.1-registry-update.md
│   ├── TEMPLATE.format-4.2-index-entry.md
│   ├── TEMPLATE.format-4.3-learnings-entry.md
│   ├── TEMPLATE.format-6.1-error.md
│   └── TEMPLATE.format-6.2-routing.md
├── agent/                # Agent output templates (12 formats)
│   ├── TEMPLATE.report.md
│   ├── TEMPLATE.review-report.md
│   ├── TEMPLATE.changes.md
│   ├── TEMPLATE.test-report.md
│   ├── TEMPLATE.format-5.3-brainstorm-report.md
│   ├── TEMPLATE.plan-report.md
│   ├── TEMPLATE.format-5.4-diagnosis-report.md
│   ├── TEMPLATE.format-5.5-healing-verification-report.md
│   ├── TEMPLATE.format-5.6-quarantine-report.md
│   ├── TEMPLATE.second-opinion-report.md
│   └── TEMPLATE.notification.md
├── git/                  # Git convention templates (2 formats)
│   ├── TEMPLATE.commit-message.md
│   └── TEMPLATE.pr-description.md
├── registry/             # Registry entry templates (3 formats)
│   ├── TEMPLATE.action-entry.md
│   ├── TEMPLATE.flow-entry.md
│   └── TEMPLATE.context-entry.md
├── TEMPLATE.agent.md     # Action agent definition template
└── TEMPLATE.instructions.md  # Flow orchestration template
```

---

## Files

### Orchestrator Output Templates

**Templates in `orchestrator/` directory provide standard formats for orchestrator output consumed by the dashboard.**

Each template includes:
- Format ID and purpose from CONTRACT.md
- Required and optional fields with type annotations
- Validation rules and constraints
- Template structure with `{placeholder}` syntax
- Complete working examples
- Cross-references to parsers and TypeScript types

**Format Templates:**

1. **TEMPLATE.format-1.1-chain-compilation.md** — Chain compilation table for human approval
2. **TEMPLATE.format-1.2-execution-start.md** — Announce start of chain execution
3. **TEMPLATE.format-1.3-chain-status.md** — Mid-execution chain status update
4. **TEMPLATE.format-1.4-execution-complete.md** — Final chain completion summary
5. **TEMPLATE.format-2.1-step-completion.md** — Single step completion announcement
6. **TEMPLATE.format-2.2-dual-output.md** — Dual output (review + second-opinion)
7. **TEMPLATE.format-2.3-second-opinion-skip.md** — Skip second-opinion step announcement
8. **TEMPLATE.format-3.1-human-gate.md** — Human decision gate presentation
9. **TEMPLATE.format-3.2-learning-surface.md** — Surface agent learnings to orchestrator
10. **TEMPLATE.format-3.3-session-start.md** — Session initialization acknowledgment
11. **TEMPLATE.format-4.1-registry-update.md** — Registry file modification announcement
12. **TEMPLATE.format-4.2-index-entry.md** — INDEX.md execution record entry
13. **TEMPLATE.format-4.3-learnings-entry.md** — LEARNINGS.md discovery entry
14. **TEMPLATE.format-6.1-error.md** — Error announcement during execution
15. **TEMPLATE.format-6.2-routing.md** — Context routing decision announcement

**Source:** CONTRACT.md § Formats 1.x, 2.x, 3.x, 4.x

---

### Agent Output Templates

**Templates in `agent/` directory provide standard formats for agent output documentation.**

Each template includes:
- Agent type and purpose
- Contract reference (if applicable)
- Parser reference (if applicable)
- Required vs Optional section markers
- Template structure with `{placeholder}` syntax
- Complete working examples
- Cross-references to agent.md definitions

**Output Templates:**

1. **TEMPLATE.report.md** — Analysis/audit output (from analyze/ agents) — CONTRACT.md Format 5.2
2. **TEMPLATE.review-report.md** — Review output (from review/ agents) — CONTRACT.md Format 5.1
3. **TEMPLATE.changes.md** — Code implementation output (from code/ agents) — Free-form
4. **TEMPLATE.test-report.md** — Test execution output (from test/ agents) — Free-form
5. **TEMPLATE.format-5.3-brainstorm-report.md** — Brainstorm session transcript — CONTRACT.md Format 5.3
6. **TEMPLATE.plan-report.md** — Planning output (from plan/ agents) — Free-form (plan/ has no contract-defined format)
7. **TEMPLATE.format-5.4-diagnosis-report.md** — Root cause analysis (from diagnose/ agents) — CONTRACT.md Format 5.4
8. **TEMPLATE.format-5.5-healing-verification-report.md** — Healing verification (from verify-healing/ agents) — CONTRACT.md Format 5.5
9. **TEMPLATE.format-5.6-quarantine-report.md** — Quarantine operations (from isolate/ agents) — CONTRACT.md Format 5.6
10. **TEMPLATE.second-opinion-report.md** — Second-opinion critique output (from second-opinion/ agents) — Free-form (second-opinion/ has no contract-defined format)
11. **TEMPLATE.notification.md** — Notification announcements (from notify/ agents) — Free-form

**Contract Status:**
- `TEMPLATE.review-report.md` — CONTRACT.md Format 5.1 (Review Report Structure) — Parser: parseReviewReport
- `TEMPLATE.report.md` — CONTRACT.md Format 5.2 (Analysis Report Structure) — Parser: parseAnalysisReport
- `TEMPLATE.format-5.3-brainstorm-report.md` — CONTRACT.md Format 5.3 (Brainstorm Session Transcript) — Recommended but not strictly enforced
- `TEMPLATE.plan-report.md` — Free-form (plan/ has no contract-defined format)
- `TEMPLATE.format-5.4-diagnosis-report.md` — CONTRACT.md Format 5.4 (Diagnosis Report) — Parser: parseDiagnosisReport
- `TEMPLATE.format-5.5-healing-verification-report.md` — CONTRACT.md Format 5.5 (Healing Verification Report) — Parser: parseHealingVerification
- `TEMPLATE.format-5.6-quarantine-report.md` — CONTRACT.md Format 5.6 (Quarantine Operations Report) — Parser: parseQuarantineOperations
- `TEMPLATE.second-opinion-report.md` — Free-form (second-opinion/ has no contract-defined format)
- `TEMPLATE.changes.md` — Free-form (code/ has no contract-defined format)
- `TEMPLATE.test-report.md` — Free-form (test/ has no contract-defined format)
- `TEMPLATE.notification.md` — Free-form (notify/ has no contract-defined format)

**Source:** Analysis of agent outputs, CONTRACT.md § Format 5.x

---
### Git Convention Templates

**Templates in `git/` directory provide standard formats for git operations.**

1. **TEMPLATE.commit-message.md** — Conventional commit format with co-author attribution
2. **TEMPLATE.pr-description.md** — Pull request description with summary, test plan, and attribution

**Source:** CLAUDE.md, ORCHESTRATOR.md § Git Conventions

---

### Registry Entry Templates

**Templates in `registry/` directory provide standard formats for adding entries to ActionFlows registries.**

Each template covers:
- Multiple format variations for each registry file
- Field definitions and constraints
- Validation rules and cross-registry checks
- Examples from actual registry files

**Entry Templates:**

1. **TEMPLATE.action-entry.md** — 5 ACTIONS.md table formats (abstract, generic, stack-specific code/test, code-backed)
2. **TEMPLATE.flow-entry.md** — 2 FLOWS.md formats (table entry + detailed H3 spec) with chain syntax guide
3. **TEMPLATE.context-entry.md** — 3 CONTEXTS.md formats (routable, auto-target, manual-only)

**Source:** Analysis of ACTIONS.md, FLOWS.md, CONTEXTS.md registry structures

---

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

### Using Orchestrator Format Templates

**When implementing orchestrator output:**

1. **Read the format template** for the format you're implementing
2. **Use the template structure** as the canonical reference for required/optional fields
3. **Follow validation rules** to ensure contract compliance
4. **Test against examples** provided in the template
5. **Run harmony check:** `pnpm run harmony:check` to validate output

**Cross-reference:**
- Templates → CONTRACT.md (format specification)
- Templates → `packages/shared/src/contract/parsers.ts` (parser implementation)
- Templates → Dashboard components (UI rendering)

---

### Using Git Convention Templates

**When creating commits or PRs:**

1. **Commit messages:** Follow `git/TEMPLATE.commit-message.md`
   - Use conventional commit types (feat, fix, docs, etc.)
   - Always include co-author line
   - Keep description concise (<72 chars)

2. **Pull requests:** Follow `git/TEMPLATE.pr-description.md`
   - Write 2-5 bullet summary
   - Provide actionable test plan checklist
   - Include attribution footer

---

### Using Agent Output Templates

**When implementing agent output:**

1. **Identify output type:**
   - Analysis/audit → Use `agent/TEMPLATE.report.md` (Format 5.2)
   - Review → Use `agent/TEMPLATE.review-report.md` (Format 5.1)
   - Brainstorm session → Use `agent/TEMPLATE.format-5.3-brainstorm-report.md` (Format 5.3)
   - Planning → Use `agent/TEMPLATE.plan-report.md` (free-form)
   - Root cause diagnosis → Use `agent/TEMPLATE.format-5.4-diagnosis-report.md` (Format 5.4)
   - Healing verification → Use `agent/TEMPLATE.format-5.5-healing-verification-report.md` (Format 5.5)
   - Quarantine operations → Use `agent/TEMPLATE.format-5.6-quarantine-report.md` (Format 5.6)
   - Second opinion/critique → Use `agent/TEMPLATE.second-opinion-report.md` (free-form)
   - Code implementation → Use `agent/TEMPLATE.changes.md` (free-form)
   - Test execution → Use `agent/TEMPLATE.test-report.md` (free-form)
   - Notifications → Use `agent/TEMPLATE.notification.md` (free-form)

2. **Follow template structure:**
   - Replace all `{placeholder}` values
   - Include all required sections
   - Omit optional sections if not applicable
   - Follow validation rules (for contract-defined formats)

3. **Contract compliance (contract-defined formats only):**
   - **Review reports (Format 5.1):** Verdict must be exact enum: APPROVED | NEEDS_CHANGES (no REJECTED), Score 0-100 with `%`, Findings table 6 columns, Severity lowercase
   - **Analysis reports (Format 5.2):** Title, Aspect, Scope, Date, Agent, numbered analysis sections, Recommendations
   - **Brainstorm (Format 5.3):** Recommended but not enforced; free-form Q&A transcript with Key Insights
   - **Diagnosis reports (Format 5.4):** Gate, Pattern, Severity, Confidence, Evidence, Root Cause Classification, Healing Recommendation, Prevention Suggestion
   - **Healing Verification (Format 5.5):** Health Score Comparison table, Target Gate Analysis, Verdict (SUCCESS | PARTIAL | FAILED | ESCALATE), Recommendations
   - **Quarantine Operations (Format 5.6):** Subcommand (quarantine | release | list), Target Type, Target ID, Redis Record, WebSocket Event, Impact sections

4. **Save to log folder:**
   - Analysis: `.claude/actionflows/logs/analyze/{description}_{datetime}/report.md`
   - Review: `.claude/actionflows/logs/review/{description}_{datetime}/review-report.md`
   - Brainstorm: `.claude/actionflows/logs/brainstorm/{description}_{datetime}/transcript.md`
   - Plan: `.claude/actionflows/logs/plan/{description}_{datetime}/plan-report.md`
   - Diagnosis: `.claude/actionflows/logs/diagnose/{description}_{datetime}/diagnosis-report.md`
   - Healing Verification: `.claude/actionflows/logs/verify-healing/{description}_{datetime}/verification-report.md`
   - Quarantine: `.claude/actionflows/logs/isolate/{description}_{datetime}/quarantine-report.md`
   - Second Opinion: `.claude/actionflows/logs/second-opinion/{description}_{datetime}/second-opinion-report.md`
   - Code: `.claude/actionflows/logs/code/{description}_{datetime}/changes.md`
   - Test: `.claude/actionflows/logs/test/{description}_{datetime}/test-results.md`

**Cross-reference:**
- Templates → agent.md (agent definition)
- Templates → CONTRACT.md (format specification)
- Templates → Dashboard (UI rendering)

---

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
