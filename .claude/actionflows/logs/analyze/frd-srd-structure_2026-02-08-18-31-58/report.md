# Structure Analysis Report: FRD.md and SRD.md

**Aspect:** structure
**Scope:** docs/FRD.md, docs/SRD.md
**Date:** 2026-02-08
**Agent:** analyze

---

## 1. Document Metrics

| Metric | FRD.md | SRD.md |
|--------|--------|--------|
| Total lines | 1,280 | 985 |
| Sections (H2) | 11 | 10 |
| Subsections (H3) | 37 | 18 |
| Sub-subsections (H4) | 12 | 0 |
| Sub-sub-subsections (H5) | 11 | 0 |
| Tables | 27 | 11 |
| Code blocks | 2 | 14 |
| Horizontal rules (`---`) | 12 | 10 |
| Status markers used | 4 (complete, partial, TODO, improvement) | 1 (checkboxes) |
| Glossary terms | 20 | 0 |

---

## 2. Document Header Template

### FRD Header Pattern

```markdown
# Functional Requirements Document (FRD)
## ActionFlows Dashboard

**Document Version:** 1.0
**Generated:** 2026-02-08
**Author:** Agent
**Status:** Complete

---
```

**Fields:** Version, Generated (date only, no time), Author, Status

### SRD Header Pattern

```markdown
# ActionFlows Dashboard -- Software Requirements Document (SRD)

**Version:** 1.0 (Complete Specification)
**Date:** 2026-02-08
**Status:** Ready for Implementation
**Audience:** Architects, Developers, DevOps Engineers, Technical Leads
```

**Fields:** Version (with qualifier), Date (date only), Status, Audience

**Key difference:** FRD uses two-line heading (H1 + H2 for project name). SRD uses a single H1 line with project name and document type together. SRD adds an "Audience" field that FRD lacks. SRD omits "Author". FRD uses "Generated" while SRD uses "Date".

### Recommended Unified Header Template

```markdown
# {Document Type Full Name} ({Abbreviation})
## {Project Name}

**Document Version:** {X.Y}
**Date:** {YYYY-MM-DD}
**Author:** {Author}
**Status:** {Draft | In Review | Complete | Ready for Implementation}
**Audience:** {Target readers}

---
```

---

## 3. Section Heading Structure

### FRD Section Pattern

The FRD uses a **numbered section** system with depth up to 5 levels:

```
## {N}. {Section Title}                    -- H2 (top-level section)
### {N.M} {Subsection Title}               -- H3 (subsection)
#### {N.M.P} {Sub-subsection Title}        -- H4 (sub-subsection)
##### {Detail Title}                        -- H5 (detail heading, no number)
```

**Observed H2 sections in FRD:**
1. Executive Summary (appears twice: once unnumbered at top, once as "1. Executive Summary")
2. 2. Project Overview
3. 3. Framework Philosophy
4. 4. User Personas & Stories
5. 5. Functional Areas by Package
6. 6. Feature Catalog
7. 7. Improvement Backlog
8. 8. Non-Functional Requirements Preview
9. 9. Glossary
10. Appendix: Status Legend

**Numbering convention:** Sections are numbered (1-9), except the initial Executive Summary block and the Appendix. Subsections use dot notation (3.1, 3.2). Sub-subsections use triple dot (5.1.1, 5.1.2). H5 headings (like individual route modules) are unnumbered descriptive titles.

### SRD Section Pattern

The SRD uses **UPPERCASE section titles** with "SECTION N:" prefix:

```
## EXECUTIVE SUMMARY                       -- H2 (unnumbered, uppercase)
## SECTION {N}: {TITLE IN UPPERCASE}       -- H2 (numbered, uppercase)
### {N.M} {Mixed Case Title}               -- H3 (numbered, mixed case)
#### Phase N: {Title} (Week X, Y steps)    -- H4 (special format for phases)
## APPENDIX {LETTER}: {TITLE}              -- H2 (lettered appendices)
## CONCLUSION                              -- H2 (uppercase)
```

**Observed H2 sections in SRD:**
1. EXECUTIVE SUMMARY
2. SECTION 1: ARCHITECTURE OVERVIEW
3. SECTION 2: ORCHESTRATOR-LEVEL DESIGN
4. SECTION 3: AGENT-LEVEL DESIGN
5. SECTION 4: CROSS-CUTTING CONCERNS
6. SECTION 5: IMPLEMENTATION SEQUENCE
7. SECTION 6: RISK ASSESSMENT
8. SECTION 7: QUALITY ASSURANCE
9. SECTION 8: LEARNINGS & IMPROVEMENT AREAS
10. APPENDIX A: API ENDPOINT SUMMARY
11. APPENDIX B: SHARED TYPE DEFINITIONS
12. CONCLUSION

**Numbering convention:** "SECTION N:" for main body (1-8), "APPENDIX LETTER:" for appendices (A, B). Subsections use dot notation (1.1, 1.2). The Executive Summary and Conclusion are unnumbered.

### Comparison

| Attribute | FRD | SRD |
|-----------|-----|-----|
| H2 prefix | `{N}.` | `SECTION {N}:` |
| H2 casing | Title Case | UPPERCASE |
| H3 prefix | `{N.M}` | `{N.M}` (same) |
| H4 prefix | `{N.M.P}` | Phase-specific or none |
| H5 usage | Yes (detail headings) | No |
| Appendix style | `Appendix: {Title}` | `APPENDIX {LETTER}: {TITLE}` |

---

## 4. Markdown Conventions

### Text Formatting

| Convention | FRD | SRD | Example |
|------------|-----|-----|---------|
| Bold for emphasis | Yes | Yes | `**ActionFlows Dashboard**` |
| Bold for labels | Yes | Yes | `**File:** routes/sessions.ts` |
| Bold for key terms in lists | Yes | Yes | `**Session:** A user's orchestration...` |
| Inline code for paths | Yes | Yes | `` `packages/backend/` `` |
| Inline code for types | Yes | Yes | `` `SessionId` `` |
| Inline code for values | Yes | Yes | `` `50 msgs/sec` `` |
| Italic for references | Rarely | Rarely | `*Detailed specifications in SRD*` |
| Status emoji markers | Yes (4 types) | No (uses checkboxes) | FRD: `checkmark`, `hourglass`, `construction`, `wrench` |

### Status Markers (FRD-specific pattern)

The FRD uses a consistent 4-marker legend throughout:

| Marker | Meaning | Usage |
|--------|---------|-------|
| `checkmark` Complete | Feature fully implemented | Tables, inline |
| `hourglass` Partial | Feature partially implemented | Tables, inline |
| `construction` TODO | Feature planned, not implemented | Tables, inline |
| `wrench` Improvement | Gap identified, future work | Inline descriptions |

The SRD uses standard markdown checkboxes (`- [ ]`) for checklists instead.

### List Patterns

**FRD list style:**
- Unordered lists with `-` prefix for features, gaps, improvements
- Ordered lists with `1.` prefix for workflows, steps
- Nested bold labels: `- **Key Features:**` followed by indented sub-items

**SRD list style:**
- Ordered lists with `1.` for sequential steps and phases
- Unordered with `-` for bullet points
- Checkbox lists `- [ ]` for audit/review checklists

### Horizontal Rules

Both documents use `---` (three dashes) as section dividers. Placement:
- After the document header metadata block
- Between every H2 section (consistently in both documents)
- Not used between H3 subsections

### Code Blocks

**FRD:** 2 code blocks only -- used sparingly for the "Sin Test" pseudocode and a monorepo tree diagram. Language tags: none specified.

**SRD:** 14 code blocks -- used extensively for:
- Architecture diagrams (ASCII art, no language tag)
- TypeScript patterns (tagged ` ```typescript `)
- Implementation examples (tagged ` ```typescript `)

**Convention:** Use ` ```typescript ` for TypeScript code. Use plain ` ``` ` for ASCII diagrams and pseudocode.

---

## 5. Table Formats

### FRD Table Patterns

**Pattern 1: API Endpoint Table**
```markdown
| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/` | POST | Create new session | checkmark Complete |
```
Columns: Endpoint (path), Method (HTTP verb), Purpose (description), Status (emoji + word)

**Pattern 2: Component Inventory Table**
```markdown
| Component | Status | Purpose |
|-----------|--------|---------|
| **AppContent** | checkmark | Main layout with tab navigation |
```
Columns: Component (bold name), Status (emoji only), Purpose (description)

**Pattern 3: Feature Matrix Table**
```markdown
| Feature | Component/Module | Package | Status | Notes |
|---------|------------------|---------|--------|-------|
| Session CRUD | sessions.ts | Backend | checkmark | Create, read, update... |
```
Columns: Feature, Component/Module, Package, Status, Notes

**Pattern 4: Meta-Task Threshold Table**
```markdown
| Criteria | Direct | Delegate |
|----------|--------|----------|
| Lines changed | < 5 | 5+ |
```
Columns: Criteria, Direct (threshold), Delegate (threshold)

**Pattern 5: Improvement Backlog Item**
Not a table -- uses structured prose under numbered H4 headings:
```markdown
#### 1. Complete Dashboard Screens
- **Scope:** 5 screens
- **Effort:** 3-4 weeks per screen
- **Impact:** Enables visualization
- **Details:** (indented list)
```
Fields: Scope, Effort, Impact, Details/Features/Changes/Approach

### SRD Table Patterns

**Pattern 1: Routing Table**
```markdown
| Requirement Type | Flow | Chain | Rationale |
|---|---|---|---|
| Session Management (SM-01 to SM-05) | code-and-review/ | code/backend -> ... | Multi-package |
```
Columns: Requirement Type (with IDs), Flow, Chain, Rationale

**Pattern 2: Model Selection Table**
```markdown
| Action | Model | Rationale |
|--------|-------|-----------|
| code/backend | haiku | Fast execution |
```

**Pattern 3: Risk Assessment Table**
```markdown
| Risk | Impact | Likelihood | Mitigation | Detection |
|------|--------|-----------|-----------|-----------|
| WebSocket protocol change | HIGH | MEDIUM | Implement versioning | E2E tests |
```
Columns: Risk, Impact (HIGH/MEDIUM/LOW), Likelihood (HIGH/MEDIUM/LOW), Mitigation, Detection

**Pattern 4: Performance Target Table**
```markdown
| Operation | Target | Strategy |
|-----------|--------|----------|
| Session creation | < 100ms | Parallel validation |
```

**Pattern 5: Technical Debt Table**
```markdown
| Item | Severity | Impact | Fix | Effort |
|------|----------|--------|-----|--------|
| Generic Record<> | MEDIUM | Loose typing | Define InputSchema | 3 days |
```

**Pattern 6: Appendix Summary Table**
```markdown
| Module | Count | Methods |
|--------|-------|---------|
| Sessions | 8 | POST, GET, PUT |
```

---

## 6. Structural Patterns

### 6.1 FRD Structural Patterns

**Pattern A: Package-Oriented Organization (Section 5)**
Each package (backend, frontend, shared, MCP, framework) gets its own H3 subsection with:
1. **Location** and **Framework** metadata
2. **Status** indicator
3. Sub-subsections for feature groups (H4)
4. API endpoint tables or component tables
5. **Key Features** bullet list
6. **Gaps** bullet list with wrench markers and file references

**Pattern B: Persona-Workflow Pattern (Section 4)**
Each persona has:
1. **Role** / **Technical Level** / **Primary Tools** metadata
2. **User Stories** as quoted first-person statements
3. **Key Workflows** as numbered sequences

**Pattern C: Improvement Backlog (Section 7)**
Organized by priority tier (HIGH / MEDIUM / LOW), each item has:
1. Numbered H4 heading
2. Structured fields: Scope, Effort, Impact, Details/Features/Changes

**Pattern D: Cross-Reference Footer**
FRD ends with:
```markdown
**Document Generated:** {date}
**Analysis Sources:** {source files}
**Next Phase:** {what follows}
```

### 6.2 SRD Structural Patterns

**Pattern E: Layer-Based Organization**
Three architectural layers serve as the organizing principle:
1. Orchestrator-Level (Section 2)
2. Agent-Level (Section 3)
3. Cross-Cutting Concerns (Section 4)

**Pattern F: Code Example Pattern (Section 3)**
Each implementation pattern follows:
1. **Pattern N: {Name}** heading
2. Brief prose description
3. TypeScript code block showing the pattern
4. Optional notes on variants

**Pattern G: Risk Table Pattern (Section 6)**
Risks grouped by category (Architectural, Data Integrity, Security, Performance), each with:
1. 5-column table (Risk, Impact, Likelihood, Mitigation, Detection)
2. Impact/Likelihood use HIGH/MEDIUM/LOW enumeration

**Pattern H: Checklist Pattern (Section 7)**
Uses nested checkbox lists for review and audit items:
```markdown
- [ ] **Category:**
  - [ ] Specific check 1
  - [ ] Specific check 2
```

**Pattern I: Cross-Reference Footer**
SRD ends with:
```markdown
**Document Status:** {status indicator}
**Approval:** {approval state}
**Next Steps:** {action}

---

**Cross-References:**
- [{Doc}]({relative path})
```

---

## 7. Key Observations and Anomalies

### 7.1 FRD Anomalies

1. **Duplicate Executive Summary:** The FRD has an unnumbered "Executive Summary" block (lines 11-16) AND a numbered "1. Executive Summary" section (lines 19-48). The unnumbered block is a brief paragraph; the numbered section has Vision, Status, Key Metrics, and Primary Use Cases. This appears to be an oversight where the initial summary was not removed when the numbered section was added.

2. **Inconsistent H2 numbering:** Sections 1-9 are numbered, but "Executive Summary" (first occurrence) and "Appendix: Status Legend" are not numbered. This breaks the otherwise clean numbering.

3. **Deep heading nesting:** The FRD goes to H5 depth (5 levels) for individual route module headings (e.g., "##### Sessions Route"). This is unusually deep; H4 would suffice with bold inline labels.

### 7.2 SRD Anomalies

1. **Inconsistent endpoint counts:** The SRD header says "44 API endpoints" but the FRD says "38 endpoints." The SRD appendix counts 44 across 11 modules. This discrepancy needs reconciliation.

2. **Missing Audience field in FRD:** The SRD specifies its audience; the FRD does not. For consistency, both should include target audience.

3. **No Glossary in SRD:** The FRD includes a comprehensive glossary (Section 9), but the SRD has none. Technical terms in the SRD (e.g., "branded types," "discriminated unions") assume reader familiarity.

### 7.3 Shared Conventions (Template Rules)

Both documents consistently:
- Use `---` between every H2 section
- Use bold for metadata labels (`**File:**`, `**Status:**`, `**Key Features:**`)
- Use inline code for paths, types, and technical values
- Use tables for structured comparisons (never prose for tabular data)
- Include a document footer with status, date, and cross-references
- Place a key metrics block near the top (in or after the executive summary)

---

## 8. Extracted Template for New FRD/SRD Documents

### FRD Template

```markdown
# Functional Requirements Document (FRD)
## {Project Name}

**Document Version:** {X.Y}
**Date:** {YYYY-MM-DD}
**Author:** {Author}
**Status:** {Draft | In Review | Complete}
**Audience:** {Target readers}

---

## Executive Summary

{1-2 paragraph overview of the system, its purpose, and current state.}

### Vision
{What the system does and why.}

### Status
{Completion percentage and summary of what is done vs. remaining.}

### Key Metrics
{Quantitative summary: endpoint counts, component counts, type counts, etc.}

### Primary Use Cases
{Numbered list of 5-8 core use cases.}

---

## 2. Project Overview

### What is {Project}?
{Description paragraph.}

### Why It Exists
{Problem/solution framing, ideally with "Without/With" comparison.}

### Who Uses It
{Numbered persona list with one-line descriptions.}

### Core Capabilities
{Bullet list of 6-10 capabilities.}

---

## 3. {Domain-Specific Context Section}

{For ActionFlows this is "Framework Philosophy." For other projects,
replace with the relevant domain context section. Include subsections
for key architectural principles and patterns.}

---

## 4. User Personas & Stories

### Persona N: {Role Name}

**Role:** {description}
**Technical Level:** {Expert | Advanced | Intermediate | Basic}
**Primary Tools:** {comma-separated list}

**User Stories:**
- "As a {role}, I want to {action} so I can {benefit}"

**Key Workflows:**
1. {Step 1} -> {Step 2} -> {Step 3}

---

## 5. Functional Areas by Package

### 5.N {Package Name}

**Location:** `{path}`
**Framework:** {tech stack}
**Status:** {status marker} {description}

#### 5.N.M {Feature Group}

##### {Feature Name}
**File:** `{path}`
**Endpoints:** {count} total (if applicable)

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `{path}` | {VERB} | {description} | {status} |

**Key Features:**
- {feature 1}
- {feature 2}

**Gaps:**
- wrench **{Gap title}** ({file:line}) -- {description}

---

## 6. Feature Catalog

### Complete Feature Matrix

| Feature | Component/Module | Package | Status | Notes |
|---------|------------------|---------|--------|-------|
| {feature} | {module} | {package} | {status} | {notes} |

**Legend:** checkmark Complete | hourglass Partial | construction TODO

---

## 7. Improvement Backlog

### HIGH PRIORITY

#### 1. {Title}
- **Scope:** {what is affected}
- **Effort:** {time estimate}
- **Impact:** {why it matters}
- **Details:** {specifics}

### MEDIUM PRIORITY
{Same pattern}

### LOW PRIORITY
{Same pattern}

---

## 8. Non-Functional Requirements Preview

*Detailed specifications in SRD; summary here:*

### Performance
{Key limits and targets}

### Security
{Implemented security measures}

### Scalability
{Scaling characteristics}

### Reliability
{Error handling and recovery}

---

## 9. Glossary

### {Category} Terms

**{Term}:** {Definition. 1-2 sentences. Reference branded types or identifiers.}

---

## Appendix: Status Legend

{Explain all status markers used in the document.}

---

**Document Generated:** {YYYY-MM-DD}
**Analysis Sources:** {source documents or analysis runs}
**Next Phase:** {what follows this document}
```

### SRD Template

```markdown
# {Project Name} -- Software Requirements Document (SRD)

**Version:** {X.Y} ({qualifier})
**Date:** {YYYY-MM-DD}
**Status:** {Draft | In Review | Ready for Implementation}
**Audience:** {Architects, Developers, DevOps Engineers, Technical Leads}

{1-2 paragraph summary of document scope and the three-layer architecture.}

**Key Metrics:**
- {metric 1}
- {metric 2}

---

## EXECUTIVE SUMMARY

{Overview of what the SRD covers. Describe each architectural layer.}

**Layer 1: {Name}**
- {bullet points}

**Layer 2: {Name}**
- {bullet points}

**Layer 3: {Name}**
- {bullet points}

---

## SECTION 1: ARCHITECTURE OVERVIEW

### 1.1 {Structure}
{Monorepo/project structure as ASCII tree in code block.}

### 1.2 {Data Flow}
{Data flow diagram as ASCII art in code block.}

### 1.3 {Tech Stack}
{Per-package dependency listing.}

---

## SECTION 2: {LAYER 1 NAME} DESIGN

### 2.1 {Routing/Organization}

| {Column 1} | {Column 2} | {Column 3} | {Column 4} |
|---|---|---|---|
| {data} | {data} | {data} | {data} |

### 2.2 {Composition Patterns}

**Pattern N: {Name}**

```
{ASCII diagram of the pattern}
```

### 2.3 {Selection/Prioritization}

| {Decision} | {Choice} | {Rationale} |
|------------|----------|-------------|

### 2.4 {Implementation Sequence}

{Critical path description with timelines.}

---

## SECTION 3: {LAYER 2 NAME} DESIGN

### 3.1 {Backend/Service Patterns}

**Pattern N: {Name}**

{Brief description.}

```typescript
{Code example}
```

### 3.2 {Frontend/Client Patterns}

{Same pattern structure.}

### 3.3 {Shared/Common Patterns}

{Same pattern structure.}

---

## SECTION 4: CROSS-CUTTING CONCERNS

### 4.1 Error Handling Strategy
{Backend, Frontend, Graceful Degradation subsections.}

### 4.2 Security Architecture
{Per-concern subsections with implementation details.}

### 4.3 Performance Targets & Optimization

| Operation | Target | Strategy |
|-----------|--------|----------|

### 4.4 Monitoring & Logging
{Current state + planned improvements.}

---

## SECTION 5: IMPLEMENTATION SEQUENCE

### 5.1 {N}-Step Plan ({M} Phases, {W} Weeks)

#### Phase N: {Name} (Week X, Y steps)
{Numbered steps with time estimates.}

### 5.2 Dependency Graph
{ASCII diagram of phase dependencies.}

### 5.3 Critical Path Analysis
{Serial dependencies, parallelizable work, total timeline.}

---

## SECTION 6: RISK ASSESSMENT

### 6.N {Risk Category}

| Risk | Impact | Likelihood | Mitigation | Detection |
|------|--------|-----------|-----------|-----------|

### 6.{Last} Mitigation Checklist
- [ ] {Check item}

---

## SECTION 7: QUALITY ASSURANCE

### 7.1 Testing Strategy

**{Test Level} ({coverage target}):**
```typescript
{Example test code}
```

### 7.2 Code Review Checklist
- [ ] **{Category}:**
  - [ ] {Specific check}

### 7.3 Security Audit Checklist
- [ ] **{Category}:**
  - [ ] {Specific check}

---

## SECTION 8: LEARNINGS & IMPROVEMENT AREAS

### 8.1 Technical Debt

| Item | Severity | Impact | Fix | Effort |
|------|----------|--------|-----|--------|

### 8.2 Phase 2+ Improvements
{Numbered items with scope and effort.}

### 8.3 {Domain} Learnings
**Lesson N: {Title}**
- {Finding}
- Recommendation: {action}

---

## APPENDIX A: {TITLE}
{Summary tables.}

## APPENDIX B: {TITLE}
{Summary tables.}

---

## CONCLUSION

{3-paragraph summary: what was covered, critical success factors, next steps.}

---

**Document Status:** {status}
**Approval:** {state}
**Next Steps:** {action}

---

**Cross-References:**
- [{Doc Name}]({relative path})
```

---

## 9. Actionable Recommendations

| # | Recommendation | Priority | Rationale |
|---|---------------|----------|-----------|
| 1 | Unify document header fields (Version, Date, Author, Status, Audience) across both templates | HIGH | Consistency between FRD and SRD |
| 2 | Remove duplicate Executive Summary from FRD (keep only the numbered "1. Executive Summary") | HIGH | Eliminates confusion and redundancy |
| 3 | Reconcile endpoint counts (FRD says 38, SRD says 44) | HIGH | Data integrity between documents |
| 4 | Limit FRD heading depth to H4 maximum; use bold labels instead of H5 | MEDIUM | Reduces nesting complexity |
| 5 | Add Audience field to FRD header | MEDIUM | Matches SRD convention |
| 6 | Add Glossary section or cross-reference to SRD | MEDIUM | SRD uses domain terms without definition |
| 7 | Standardize H2 casing: use Title Case for FRD, UPPERCASE for SRD (current convention is acceptable if documented) | LOW | Intentional differentiation is fine if both teams agree |
| 8 | Add a "Document Change Log" section to both templates for version tracking | LOW | Useful for living documents |

---

**Report Generated:** 2026-02-08
**Analysis Source:** docs/FRD.md (1,280 lines), docs/SRD.md (985 lines)
