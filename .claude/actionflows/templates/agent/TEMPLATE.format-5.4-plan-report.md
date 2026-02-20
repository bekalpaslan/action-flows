# Plan Report Template

**Purpose:** Used by `plan/` action agents to produce structured planning reports
**Contract Reference:** CONTRACT.md § Format 5.4 (Plan Report) — P4 Priority
**Parser:** `parsePlanReport` in `packages/shared/src/contract/parsers/actionParser.ts`
**Producer:** See `.claude/actionflows/actions/plan/agent.md`

---

## Required Sections

These sections should be present in every planning report:

1. **Title** (H1) — Planning goal
2. **Metadata** — Aspect, scope, date, agent
3. **Goal Statement** — Clear objective
4. **Constraints** — Boundaries and limitations
5. **Steps** — Numbered implementation steps
6. **Timeline** — Estimated duration
7. **Success Criteria** — How to verify completion

---

## Optional Sections

- **Risks & Mitigation** — Potential issues and how to handle them
- **Dependencies** — What must be done first
- **Alternatives Considered** — Other approaches evaluated
- **Learnings** — Issue/Root Cause/Suggestion pattern

---

## Template Structure

```markdown
# {Planning Goal}

**Aspect:** {aspect}
**Scope:** {scope description}
**Date:** {YYYY-MM-DD}
**Agent:** plan/

---

## Goal Statement

{Clear, concise objective statement}

### Success Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

---

## Constraints & Assumptions

### Constraints

- **Time:** {Maximum time available}
- **Resources:** {Available team, tools}
- **Technical:** {Technology limitations}
- **Business:** {Product constraints}

### Assumptions

- Assumption 1
- Assumption 2

---

## Execution Steps

| # | Step | Owner | Effort | Duration | Depends On |
|---|------|-------|--------|----------|-----------|
| 1 | {Step description} | {agent/team} | {estimate} | {time} | -- |
| 2 | {Step description} | {agent/team} | {estimate} | {time} | #1 |

### Detailed Steps

#### Step 1: {Step Title}

{Description and context}

**Deliverables:**
- Item 1
- Item 2

**Validation:**
{How to verify this step is complete}

#### Step 2: {Step Title}

{Description}

[... more steps ...]

---

## Timeline

**Total Estimated Duration:** {Duration}

**Phase Timeline:**
- **Phase 1:** Steps 1-2 ({Duration})
- **Phase 2:** Steps 3-4 ({Duration})
- **Phase 3:** Step 5 ({Duration})

**Critical Path:**
Steps [list] are on the critical path and cannot be parallelized.

---

## Dependencies

### External Dependencies

- {Dependency 1} — Needed for Step X
- {Dependency 2} — Needed for Step Y

### Parallel Opportunities

- Steps {list} can run in parallel
- Steps {list} must run sequentially

---

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| {Risk} | High | {impact} | {Mitigation plan} |
| {Risk} | Medium | {impact} | {Mitigation plan} |

---

## Alternatives Considered

### Alternative 1: {Approach}

**Pros:** {advantages}
**Cons:** {disadvantages}
**Verdict:** Rejected because {reason}

### Alternative 2: {Approach}

**Pros:** {advantages}
**Cons:** {disadvantages}
**Verdict:** Rejected because {reason}

---

## Resource Requirements

### Team

- {Role}: {Time allocation}
- {Role}: {Time allocation}

### Tools & Services

- {Tool}: {Purpose}
- {Service}: {Purpose}

---

## Success Metrics

After completion, verify:

1. **Functional:** {Feature works as specified}
2. **Quality:** {Code quality standards met}
3. **Performance:** {Performance targets achieved}
4. **Testing:** {Test coverage threshold}
5. **Documentation:** {Docs are current}

---

## Learnings

**Issue:** {Description}

**Root Cause:** {Analysis}

**Suggestion:** {Fix or pattern for future}
```

---

## Field Descriptions

### Goal Statement

- **Length:** 1-3 sentences
- **Clarity:** Should be understandable by non-technical stakeholders
- **Measurability:** Success criteria should be derivable from goal

### Execution Steps

- **Granularity:** Each step should be completable in 1-4 hours
- **Clarity:** Step title should be action-oriented (verb + object)
- **Dependencies:** Document blocking relationships
- **Owner:** Specify who/which agent is responsible

### Timeline

- **Format:** Total duration + phased breakdown
- **Estimate:** Conservative, include buffer
- **Critical Path:** Highlight sequence-dependent steps

### Risks & Mitigation

- **Real risks:** Focus on actual threats to success
- **Mitigation:** Each risk should have a concrete mitigation plan
- **Probability:** Estimate as High/Medium/Low
- **Impact:** Document consequences if risk materializes

---

## Example

```markdown
# API Contract Versioning Implementation

**Aspect:** architecture
**Scope:** packages/shared/src/contract/
**Date:** 2026-02-21
**Agent:** plan/

---

## Goal Statement

Implement contract versioning system that allows API format evolution without breaking deployed clients, enabling safe addition of new formats and deprecation of old ones.

### Success Criteria

- [ ] CONTRACT_VERSION variable defined and incremented
- [ ] Parser compatibility layer supports N-1 version
- [ ] Migration path documented for each deprecated format
- [ ] All 30 format parsers support version-aware parsing
- [ ] Backward compatibility tests pass for 2 previous versions

---

## Constraints & Assumptions

### Constraints

- **Time:** 2 days maximum
- **Breaking Changes:** Must support active deployments (no breaking changes)
- **Compatibility:** Must work with 6-month-old client version

### Assumptions

- Clients will update within 3 months of deprecation notice
- Version header can be added to all outputs
- Zod schemas can handle conditional fields

---

## Execution Steps

| # | Step | Owner | Effort | Duration | Depends On |
|---|------|-------|--------|----------|-----------|
| 1 | Add CONTRACT_VERSION to CONTRACT.md | plan/ | 0.5h | 30m | -- |
| 2 | Create version-aware parser wrapper | code/shared/ | 3h | 2h | #1 |
| 3 | Update all 30 format parsers for versioning | code/shared/ | 6h | 4h | #2 |
| 4 | Add backward compatibility tests (N-1 version) | test/vitest/ | 4h | 3h | #3 |
| 5 | Document versioning policy in HARMONY.md | code/ | 2h | 1h | #4 |

---

## Timeline

**Total Estimated Duration:** 2 days (10 hours work, 1 day calendar)

**Day 1:**
- Morning: Plan review (30m) + Add CONTRACT_VERSION (30m) = 1h
- Afternoon: Create parser wrapper (2h) + Update 15 parsers (2h) = 4h
- Evening: Update remaining 15 parsers (2h) = 2h
- **Daily Total: 7 hours**

**Day 2:**
- Morning: Backward compatibility tests (3h) = 3h
- Afternoon: Documentation (1h) + Review & testing (1h) = 2h
- **Daily Total: 5 hours**

**Critical Path:**
#1 → #2 → #3 → #4 → #5 (all steps sequential, no parallelization)

---

## Dependencies

### External Dependencies

- Existing Zod schema definitions (already available)
- Git history for testing old format samples

### Parallel Opportunities

- None: Parser updates must follow wrapper creation

---

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Parser update is incomplete for some format | Medium | High | Comprehensive test suite for all 30 formats before deployment |
| Backward compatibility breaks existing clients | Low | Critical | Test with 1-version-old parser before deployment |
| Performance regression from version checking | Low | Medium | Benchmark parser speed before/after |

---

## Alternatives Considered

### Alternative 1: No versioning (break at CONTRACT 2.0)

**Pros:** Simpler implementation, cleaner design
**Cons:** Deployed clients break, painful migration, no gradual rollout
**Verdict:** Rejected — breaks production deployments

### Alternative 2: Unlimited backward compatibility

**Pros:** Never break anything, infinite compatibility
**Cons:** Parser becomes increasingly complex, maintenance burden
**Verdict:** Rejected — N-1 versioning provides good balance

---

## Resource Requirements

### Team

- **code/shared/ agent**: 6 hours (primary work)
- **test/vitest/ agent**: 3 hours (testing)
- **code/ agent**: 1 hour (documentation)

### Tools

- Vitest — Testing framework (already available)
- Zod — Validation (already available)
- Git — Version control (already available)

---

## Success Metrics

After completion, verify:

1. **Functional:** Contract version is tracked and incremented
2. **Quality:** All 30 parsers pass version-aware tests
3. **Performance:** Parser overhead < 5% for version checking
4. **Testing:** 100% parser test coverage for both current and N-1 versions
5. **Documentation:** Versioning policy is clear in HARMONY.md

---

## Learnings

**Issue:** None — execution proceeded as expected.

**Root Cause:** N/A

**Suggestion:** N/A
```

---

## Cross-References

- **Contract Specification:** `.claude/actionflows/CONTRACT.md` § Format 5.4 (Diagnosis Report)
- **Parser Implementation:** `packages/shared/src/contract/parsers/actionParser.ts`
- **Agent Definition:** `.claude/actionflows/actions/plan/agent.md`
- **Related Templates:** `TEMPLATE.report.md` (Analysis Report)
