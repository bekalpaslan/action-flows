# Intel Analysis Flow

> Create comprehensive living dossiers of code domains, systems, and services.

---

## When to Use

- Create an initial intelligence dossier for a domain (e.g., "auth system", "WebSocket layer", "frontend routing")
- Monitor code health and architecture changes in a specific service
- Track dependencies, risks, and evolution opportunities in a module
- Gather deep intelligence before major refactoring or feature work
- Build living documentation for complex subsystems

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| domain | What to analyze | "auth system", "WebSocket handlers", "session management", "API routes" |
| scope | Depth of analysis (optional) | "surface" (key files only), "detailed" (default), "comprehensive" (with tests + related) |
| focus | Specific aspect (optional) | "security", "performance", "dependencies", "code health" |

---

## Action Sequence

### Step 1: Deep Domain Analysis

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: domain-intel
- scope: {scope from human or "detailed"}
- context: Create intelligence dossier for domain: {domain from human}. Focus: {focus if provided}. Analyze: architecture, dependencies, key components, code health indicators, risks, evolution opportunities, integration points. Output should be structured for dossier creation.
```

**Gate:** Domain analysis complete with actionable intelligence.

---

### Step 2: Plan Dossier Structure

**Action:** `.claude/actionflows/actions/plan/`
**Model:** sonnet

**Spawn after Step 1:**
```
Read your definition in .claude/actionflows/actions/plan/agent.md

Input:
- task: Create dossier structure and outline for domain: {domain from human}
- context: {Analysis output from Step 1}. Structure should include: Overview, Architecture, Dependencies, Health Indicators, Risks, Evolution Opportunities, Integration Points. Output should be a detailed outline ready for documentation writing.
```

**Gate:** Dossier structure and outline delivered.

---

### Step 3: Human Gate — Approve Scope

**Review the outline.** Ask:
- Is the scope right?
- Any sections to add or remove?
- Priority focus areas?

**Options:**
- **Approve** → Proceed to Step 4
- **Adjust** → Go back to Step 2 with feedback

---

### Step 4: Write Dossier Document

**Action:** `.claude/actionflows/actions/code/`
**Model:** haiku

**Spawn after approval:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Write comprehensive intelligence dossier for {domain from human}
- context: {Dossier outline from Step 2}. Create a living document in docs/ directory following the structure. Use markdown with sections: Overview, Architecture (with diagrams or descriptions), Dependencies (internal + external), Health Indicators (with metrics), Risks (known issues, technical debt), Evolution Opportunities (suggested improvements), Integration Points (how this domain connects to others). Document should be detailed, actionable, and maintainable.
- target: docs/intel/{domain-kebab-case}.md
```

**Gate:** Dossier document created and committed to docs.

---

### Step 5: Review Dossier

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet

**Spawn after Step 4:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: docs/intel/{domain-kebab-case}.md
- type: documentation-review
- context: Intel dossier for {domain}. Check: completeness of sections, accuracy of architecture description, clarity for future readers, actionable recommendations.
```

**Gate:** Dossier reviewed and APPROVED.

---

### Step 6: Commit to Registry

**Final action:** Update `.claude/actionflows/docs/DOSSIERS.md` registry to list the new dossier.

**Gate:** Dossier registered and live.

---

## Dependencies

```
Step 1 (analyze) → Step 2 (plan) → Step 3 (human gate)
                                      ↓
                                   Step 4 (code)
                                      ↓
                                   Step 5 (review)
                                      ↓
                                   Step 6 (registry)
```

**Parallel groups:** None — sequential with human gate.

---

## Chains With

- → `post-completion/` (after dossier approved and registered)
- ← Triggered from `intel` context with domain keywords
- ← Can feed into `code-and-review/` when insights surface refactoring opportunities

---

## Output

**Primary deliverable:** `docs/intel/{domain-kebab-case}.md`

**Registry update:** `docs/DOSSIERS.md` entry added

**Example dossier sections:**
```
# Intel: Auth System

## Overview
[Brief description of the domain and why it matters]

## Architecture
[Key components, data flows, class/function diagrams if helpful]

## Dependencies
- Internal: [which modules depend on this]
- External: [npm packages, third-party services]

## Health Indicators
- Test Coverage: [percentage + gaps]
- TypeScript: [any unsafe areas]
- Performance: [bottlenecks if any]

## Risks
- [Known issues, technical debt, security concerns]

## Evolution Opportunities
- [Suggested improvements and refactoring]

## Integration Points
- [How this domain connects to other parts of the system]
```

---

## Notes

- Dossiers are **living documents** — they should be updated as the domain evolves
- Use `intel-analysis/` flow again to update an existing dossier
- Dossiers support project learning and onboarding
- Archive old dossiers in `docs/intel/archive/` when they become stale
