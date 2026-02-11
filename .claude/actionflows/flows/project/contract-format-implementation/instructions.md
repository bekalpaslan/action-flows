# Contract Format Implementation Flow

> Implement CONTRACT.md formats end-to-end following the Format Implementation Lifecycle.

---

## When to Use

- Implementing new formats for CONTRACT.md (parser, frontend component, integration)
- Building end-to-end contract features with full lifecycle verification
- Any request mentioning "Format X.Y", "contract parser", or "harmony parser" for contract work
- Enforcing 4-step implementation lifecycle (parser → component → integration → validation)

**Note:** Single-step code chains are prohibited for contract format work. This flow enforces the complete implementation lifecycle.

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| formatId | Format identifier from CONTRACT.md | "Format 5.1" or "Format 6.2" |
| contractSection | Reference section in CONTRACT.md | "§ Review Report Structure" or "§ Analysis Report" |
| scope | Implementation scope (optional, auto-detected) | "parser", "component", or "integration" |

---

## Action Sequence

### Step 1: Parse Contract and Verify Spec

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: contract-format-spec
- scope: .claude/actionflows/CONTRACT.md (section: {contractSection})
- context: Extract format specification for {formatId}. Identify: required fields, optional fields, enums/types, examples, validation rules. Verify no ambiguities that would require orchestrator clarification.
```

**Gate:** Format spec clearly extracted and validated. Proceed only if no clarification needed.

---

### Step 2: Implement Parser

**Action:** `.claude/actionflows/actions/code/backend/`
**Model:** haiku

**Spawn after Step 1:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Implement parser for {formatId} according to CONTRACT.md specification
- context: packages/shared/src/contract/parsers/, existing parser patterns (parseReviewReport, parseAnalysisReport, etc.)
- component: backend
- contractFormat: {formatId}
- specDetails: {extracted spec from Step 1}
```

**Gate:** Parser implemented, type-check passes, handles both required and optional fields.

---

### Step 3: Implement Frontend Component

**Action:** `.claude/actionflows/actions/code/frontend/`
**Model:** haiku

**Spawn after Step 2:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Create React component for rendering {formatId} according to CONTRACT.md specification
- context: packages/app/src/components/, existing contract format components
- component: frontend
- contractFormat: {formatId}
- specDetails: {extracted spec from Step 1}
```

**Gate:** Component created, renders all required fields, integrates with shared types.

---

### Step 4: Integrate Component with Consumer

**Action:** `.claude/actionflows/actions/code/frontend/`
**Model:** haiku

**Spawn after Step 3:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Wire {formatId} component into dashboard view. Import component, add to relevant viewer/panel (e.g., ConversationPanel, ReviewViewer, etc.). Verify data flows from parsed output to rendered component.
- context: packages/app/src/components/ (identify consumer component where {formatId} is displayed)
- component: frontend
- integration: true
```

**Gate:** Component integrated and rendering in dashboard context.

---

### Step 5: Validate with Harmony Check

**Note:** Run harmony validation manually after Step 4 completes.

**Validation command:**
```bash
pnpm run harmony:check
```

**What to verify:**
- Parser (packages/shared/src/contract/parsers/) has no validation errors
- Component (packages/app/src/components/) renders all required fields
- Integration wiring passes — no missing imports or broken data flows

**Gate:** Harmony validation passes. No parsing errors, no integration gaps. Proceed to Step 6.

---

### Step 6: Code Review

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet

**Spawn after Step 5:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: All files modified in Steps 2-4 (parser, component, integration)
- type: contract-format-review
- formatId: {formatId}
```

**Gate:** Verdict delivered.

---

### Step 7: Handle Verdict

- **APPROVED** → Proceed to post-completion
- **NEEDS_CHANGES** → Return to Step 2 with review feedback as additional context

---

## Dependencies

```
Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6 → Step 7 (verdict gate)
                                                           ↓
                                                  (if APPROVED)
                                              post-completion/
```

**Parallel groups:** None — all steps sequential. Format Implementation Lifecycle requires strict ordering (parser → component → integration → validation).

---

## Chains With

- ← Any request for "implement Format X.Y", "add contract format", "build parser for..."
- → `post-completion/` (when review APPROVED, if doing commit)
- → `harmony-audit-and-fix/` (if harmony validation reveals mismatches)

---

## Format Implementation Lifecycle Reference

From ORCHESTRATOR.md, the 7-step verification checklist for contract work:

1. **Spec Clarity** — Format specification has no ambiguities
2. **Parser Completeness** — All required fields parsed, optional fields graceful, validation tight
3. **Component Rendering** — All fields rendered, styling consistent with system
4. **Integration Wiring** — Component imported, data flows from parser to view
5. **Harmony Validation** — No parsing errors, no integration gaps
6. **Code Review** — Quality and patterns verified
7. **Learnings Documentation** — Any gaps or partial completeness surfaced

This flow enforces all 7 steps in sequence.
