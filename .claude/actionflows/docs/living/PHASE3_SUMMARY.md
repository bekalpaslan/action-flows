# Phase 3: Evidence Validation — Summary

**Full Design:** See `PHASE3_EVIDENCE_VALIDATION_DESIGN.md`

---

## Quick Overview

Phase 3 adds **evidence verification** to the immune system's Healing Layer, preventing "paper closures" where learnings are marked resolved without actual fixes.

**Approach:** Bidirectional Hook + Service (Option B)
**Effort:** 7-10 hours across 3 sub-phases
**Status:** Design complete, ready for implementation

---

## Architecture (3 Components)

### 1. EvidenceVerifier Service (NEW)
**File:** `packages/backend/src/services/evidenceVerifier.ts`

**Validates 5 evidence types:**
- ✅ Commit hash → `git rev-parse --verify {hash}`
- ✅ File reference → `fs.existsSync(path.resolve(...))`
- ✅ Documented reason → Text pattern matching (>10 chars)
- ✅ Escalated status → Always valid (architectural gaps)
- ✅ Dissolution → Same as commit hash

**Features:**
- 1-minute caching layer (prevents repeated git calls)
- Graceful degradation (git unavailable → warning, not error)
- Cross-platform path handling (Windows/Linux/macOS)
- 5-second timeout on git operations

### 2. Enhanced Gate 13 Validator
**File:** `packages/backend/src/services/checkpoints/gate13-learning-surface.ts`

**Additions:**
- Extract evidence strings from closure lines
- Call EvidenceVerifier for each closed learning
- Record validation results in trace metadata
- Calculate harmony score with evidence penalties

**Harmony Score Formula:**
```
Base: 100
Valid evidence: +0 (neutral)
Invalid evidence: -20 per learning
Unverified (git unavailable): -10 per learning
Malformed (wrong format): -25 per learning
Final: max(0, base - penalties)
```

### 3. Orchestrator Integration
**Files:** `ORCHESTRATOR.md`, `healthScoreCalculator.ts`

**Changes:**
- Add validation trigger (after chain completes with LEARNINGS.md update)
- Define warning output format (non-blocking)
- Integrate Gate 13 harmony score into health calculation

---

## Implementation Sequence

### Phase 3A: Evidence Verifier Service (3-4 hours)
1. Create `evidenceVerifier.ts` with 5 validators
2. Add caching layer (1-minute TTL)
3. Write unit tests (>95% coverage)
4. Test with real commit hashes from project

### Phase 3B: Gate 13 Enhancement (2-3 hours)
1. Import EvidenceVerifier into gate13-learning-surface.ts
2. Add evidence extraction helpers
3. Update harmony score calculation
4. Enhance trace metadata with validation results
5. Test with existing LEARNINGS.md (24 closed entries)

### Phase 3C: Orchestrator Integration (2-3 hours)
1. Update ORCHESTRATOR.md with validation trigger
2. Define warning output format
3. Integrate into health score calculator
4. Test end-to-end flow

---

## Success Criteria

After Phase 3 implementation:
- ✅ All closed learnings have validated evidence
- ✅ Git commit hashes verified via `git rev-parse`
- ✅ File references checked against filesystem
- ✅ Gate 13 harmony score reflects evidence validity
- ✅ Orchestrator surfaces clear warnings for invalid evidence
- ✅ No false positives (valid evidence not marked invalid)
- ✅ Graceful degradation if git unavailable
- ✅ Performance: <100ms for 5 validations (with cache)

---

## Evidence Type Examples

### 1. Commit Hash
```markdown
**Status:** Closed (dissolved) — Evidence: commit c8a059b
```
**Validation:** `git rev-parse --verify c8a059b` → exists?

### 2. File Reference
```markdown
**Status:** Closed — Evidence: file docs/living/IMMUNE_SYSTEM.md
```
**Validation:** `fs.existsSync('docs/living/IMMUNE_SYSTEM.md')` → exists?

### 3. Documented Reason
```markdown
**Status:** Closed (dissolved) — Generic pattern documented in MEMORY.md
```
**Validation:** Text length >10 chars → always valid if formatted

### 4. Escalated Status
```markdown
**Status:** Escalated (architectural implementation) — Requires separate chain
```
**Validation:** Always valid (architectural gaps are legitimate closures)

### 5. Dissolution
```markdown
**Status:** Closed (dissolved) — Evidence: commit abc123def
```
**Validation:** Same as commit hash (extracted from status line)

---

## Warning Output Example

```markdown
## Evidence Validation Summary

**Learnings Validated:** 5 closed
**Evidence Status:**
- ✅ Valid: 3 learnings
- ⚠️ Invalid: 1 learning
- 🔍 Unverified: 1 learning (git unavailable)

**Warnings:**
- L012: File evidence invalid — docs/old-file.md not found (may have been moved)

**Harmony Impact:** -20 points (1 invalid evidence)
```

---

## Risks & Mitigation

### Risk 1: Git Calls Slow Down Validation
**Mitigation:** 1-minute cache, async validation, 5-second timeout
**Expected:** <100ms for 5 validations (cache hit rate >80%)

### Risk 2: False Positives
**Mitigation:** Strict patterns (7-40 hex), accept short+long hashes, unit tests
**Expected:** Zero false positives for valid Git commits

### Risk 3: Cross-Platform Path Issues
**Mitigation:** Use `path.resolve()` + `path.normalize()`, test on Windows
**Expected:** Works on Windows (MINGW64), Linux, macOS

### Risk 4: Warning Spam
**Mitigation:** Batch warnings, only warn if >1 invalid, non-blocking
**Expected:** 1 warning section per chain (not per learning)

---

## Testing Strategy

### Unit Tests (Vitest)
**File:** `packages/backend/src/services/__tests__/evidenceVerifier.test.ts`

**Coverage:**
- ✅ All 5 evidence types (commit, file, reason, escalated, dissolution)
- ✅ Caching behavior (cache hit/miss)
- ✅ Error handling (malformed hash, file not found, git unavailable)
- ✅ Cross-platform paths

**Target:** >95% code coverage

### Integration Tests
**Scenarios:**
1. Valid evidence (all passing) → harmonyScore = 100
2. Invalid commit hash → harmonyScore = 75 (-25 malformed)
3. Missing file → harmonyScore = 80 (-20 not found)
4. Git unavailable → harmonyScore = 90 (-10 unverified)

### E2E Test
**File:** `test/e2e/evidence-validation.spec.ts`
- Start session with learning-dissolution flow
- Wait for chain completion
- Check Gate 13 trace for evidence validation
- Verify harmony score and warnings

---

## Performance Benchmarks

### Target Metrics
- **Validation Time:** <100ms for 5 learnings (with cache)
- **Cache Hit Rate:** >80% in production
- **Git Call Overhead:** <50ms per unique commit hash
- **File Check Overhead:** <10ms per file reference
- **Memory Footprint:** <5MB cache overhead

### Monitoring
Log metrics every 100 validations:
- Total validations
- Cache hits/misses
- Avg git call time
- Avg file check time
- Validation errors

---

## Deployment Checklist

### Pre-Deployment
- [ ] Run unit tests: `pnpm test evidenceVerifier`
- [ ] Verify git available in environment
- [ ] Review LEARNINGS.md (24 closed entries as test cases)

### Deployment (3 Commits)
1. **Commit 1:** `feat: add evidence verifier service (Phase 3A)`
2. **Commit 2:** `feat: enhance Gate 13 with evidence validation (Phase 3B)`
3. **Commit 3:** `feat: integrate evidence validation into orchestrator (Phase 3C)`

### Post-Deployment
- [ ] Check Gate 13 traces in dashboard
- [ ] Verify warnings surface for invalid evidence
- [ ] Monitor performance (<100ms validation time)
- [ ] Check cache hit rate (>80%)

### Rollback Plan
- **Soft:** Set `EVIDENCE_VALIDATION_DISABLED=true` in env
- **Hard:** Revert Phase 3B/3C commits (keep 3A service)

---

## Future Enhancements

### Phase 3D: Learning Re-opening (Optional)
**Trigger:** Evidence becomes invalid after closure (commit rebased, file deleted)
**Action:** Auto-re-open learning with new entry
**Implementation:** Daily cron job re-validates all closed learnings

### Phase 4: Health Protocol Integration
**Trigger:** Staleness detection (learnings >30 days old)
**Action:** Auto-trigger `learning-dissolution/` flow
**Dashboard:** Learning backlog health widget

---

## Key Files

### Created
- `packages/backend/src/services/evidenceVerifier.ts` (NEW)
- `packages/backend/src/services/__tests__/evidenceVerifier.test.ts` (NEW)
- `.claude/actionflows/docs/living/PHASE3_EVIDENCE_VALIDATION_DESIGN.md` (NEW)

### Modified
- `packages/backend/src/services/checkpoints/gate13-learning-surface.ts`
- `packages/backend/src/services/healthScoreCalculator.ts`
- `.claude/actionflows/ORCHESTRATOR.md`

---

**Next Step:** Implement Phase 3A (Evidence Verifier Service) via code/ action

**Estimated Total:** 7-10 hours (3A: 3-4h, 3B: 2-3h, 3C: 2-3h)
