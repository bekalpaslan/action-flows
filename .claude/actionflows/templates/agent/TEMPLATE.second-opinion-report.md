# Second Opinion Report Template

**Purpose:** Used by `second-opinion/` action agents to critique other agent outputs
**Contract Reference:** Free-form — second-opinion/ has no CONTRACT-defined format
**Parser:** None — templates are free-form guidance for agents
**Producer:** See `.claude/actionflows/actions/second-opinion/agent.md`

---

## Required Sections

These sections should be present in every second opinion report:

1. **Title** (H1) — What's being critiqued
2. **Metadata** — Original action, date, reviewing agent
3. **Original Assessment** — Summary of original agent's findings
4. **Critique & Analysis** — Detailed review with findings
5. **Missed Issues** — What the original agent missed
6. **Disagreements** — Points of departure
7. **Notable Findings** — Significant new discoveries
8. **Verdict Summary** — Overall quality assessment

---

## Optional Sections

- **Confidence Assessment** — How confident in this critique
- **Recommendations** — How to improve original assessment
- **Learnings** — Process improvements discovered

---

## Template Structure

```markdown
# Second Opinion: {Original Report Title}

**Original Action:** {action}/
**Original Agent:** {model}
**Date:** {YYYY-MM-DD}
**Reviewing Agent:** second-opinion/ (via {model})

---

## Original Assessment Summary

{Summary of original agent's findings}

**Original Verdict:** {APPROVED | NEEDS_CHANGES}
**Original Score:** {0-100}%

**Key Findings from Original:**
- Finding 1
- Finding 2
- Finding 3

---

## Critique: Overall Quality

{General assessment of the original work}

**Strengths:**
- Strength 1: {Why this was well done}
- Strength 2: {Why this was well done}

**Weaknesses:**
- Weakness 1: {What could be better}
- Weakness 2: {What could be better}

---

## 1. Detailed Issue Review

### {Original Issue 1}

**Original Assessment:** {What original agent said}

**Second Opinion:** {Critique of this assessment}

**Verdict:** ✅ Agree | ⚠️ Partially agree | ❌ Disagree

{Explanation}

### {Original Issue 2}

{Same structure}

---

## 2. Missed Issues

**Count:** {N} issues not caught by original assessment

### Issue 1: {Title}

**Severity:** {critical | high | medium | low}

**Description:**
{Detailed description of what was missed}

**Why It Was Missed:**
{Analysis of original assessment process}

**Impact:**
{Consequences of missing this issue}

**Fix:**
{How to address this issue}

### Issue 2: {Title}

{Same structure}

---

## 3. Disagreements

**Count:** {N} points where second opinion disagrees with original

### Disagreement 1: {Topic}

**Original Assessment:** {What original agent concluded}

**Second Opinion:** {Alternative assessment}

**Evidence Supporting Second Opinion:**
- Evidence 1
- Evidence 2

**Why the Disagreement Matters:**
{Impact on overall quality assessment}

---

## 4. Notable Findings

**Discoveries beyond original scope:**

- 🔍 Finding 1: {Significant discovery}
- 🔍 Finding 2: {Significant discovery}
- 🔍 Finding 3: {Significant discovery}

---

## 5. Confidence Assessment

**Confidence in This Critique:** {High | Medium | Low}

**Basis for Confidence:**
- Source 1: {Evidence}
- Source 2: {Evidence}

**Limitations of Review:**
- Limitation 1
- Limitation 2

---

## 6. Verdict Summary

**Overall Quality:** {Assessment}

**Key Metrics:**
- **Original Score:** {X}%
- **Estimated Revised Score:** {Y}% (if revisions made)
- **Quality Delta:** {+/- percentage points}

**Recommendation:**
{Should original work be approved, needs revision, or needs complete rework?}

**Reasoning:**
{Why this recommendation}

---

## Recommendations for Improvement

### If Original Is to Be Revised

**Priority 1 (Critical):**
- {Fix 1} — {Why critical}
- {Fix 2} — {Why critical}

**Priority 2 (High):**
- {Fix 1} — {Why important}

---

## Learnings

**Issue:** {Description}

**Root Cause:** {Analysis}

**Suggestion:** {How to prevent}

**[FRESH EYE]** {Any insights about the review process itself}
```

---

## Field Descriptions

### Original Assessment Summary

- **Purpose:** Establish what the original agent concluded
- **Length:** 3-5 bullet points of key findings
- **Accuracy:** Should be fair representation of original work

### Critique Quality

- **Balance:** Acknowledge strengths AND weaknesses
- **Specificity:** Point to specific examples
- **Fairness:** Evaluate based on reasonable standards

### Missed Issues

- **Severity:** Rate each missed issue
- **Impact:** Explain why missing this matters
- **Count:** Report total missed issues

### Disagreements

- **Documentation:** Be explicit about where views differ
- **Evidence:** Support alternative assessment
- **Respect:** Acknowledge valid reasoning in original assessment while disagreeing

### Confidence

- **Self-awareness:** Assess own review limitations
- **Transparency:** Explain basis for confidence level
- **Humility:** Note what could be wrong about this critique

---

## Example

```markdown
# Second Opinion: Auth Middleware Review

**Original Action:** review/
**Original Agent:** Sonnet 3.7
**Date:** 2026-02-21
**Reviewing Agent:** second-opinion/ (via Haiku 3.5)

---

## Original Assessment Summary

Review of authentication middleware implementation found 3 critical security issues and 2 high-priority improvements needed.

**Original Verdict:** NEEDS_CHANGES
**Original Score:** 65%

**Key Findings from Original:**
- Missing input validation for Authorization header
- JWT expiration not checked
- Error messages expose stack traces (info leak)

---

## Critique: Overall Quality

The original review correctly identified the most obvious issues (input validation, JWT expiration) but missed deeper authentication concerns. The review is thorough but could be more architectural in scope.

**Strengths:**
- Correctly identified critical input validation gap
- Proper severity assessment for each issue
- Code examples included for fixes
- Actionable recommendations

**Weaknesses:**
- Didn't consider token refresh strategy
- Missed rate limiting concerns (brute force vulnerability)
- Surface-level analysis of error handling
- No discussion of session management security

---

## 1. Detailed Issue Review

### Issue 1: Missing Input Validation

**Original Assessment:** Input validation missing for Authorization header. Critical severity.

**Second Opinion:** ✅ Agree

This is correctly identified as critical. The middleware should validate the header format before parsing. The fix is straightforward and the severity is accurate.

### Issue 2: JWT Expiration Not Checked

**Original Assessment:** JWT verification doesn't check token expiration. High severity.

**Second Opinion:** ✅ Agree

Correct. The code uses `jwt.verify()` but without the expiration check. This is high priority. However, original didn't discuss token refresh strategy, which is related.

### Issue 3: Error Message Information Leak

**Original Assessment:** Error messages expose stack traces. Medium severity.

**Second Opinion:** ⚠️ Partially Agree

The stack trace exposure is real and should be fixed. However, severity might be higher than medium in production (could aid attackers). Original assessment missed that even generic "Unauthorized" message should be rate-limited.

---

## 2. Missed Issues

**Count:** 3 issues not caught by original assessment

### Issue 1: No Rate Limiting on Auth Attempts

**Severity:** High

**Description:**
The authentication endpoint has no rate limiting, allowing attackers to brute force credentials. An attacker can make unlimited login attempts without penalty.

**Why It Was Missed:**
Original review focused on cryptographic/JWT concerns, not access control concerns. Rate limiting is often missed by code reviewers.

**Impact:**
Enables credential brute force attacks. Even with strong passwords, unlimited attempts increase compromise risk.

**Fix:**
Add rate limiting: max 5 failed attempts per IP per 5 minutes. Return 429 Too Many Requests after threshold.

### Issue 2: Token Refresh Strategy Undefined

**Severity:** High (architectural)

**Description:**
The implementation verifies JWT expiration but doesn't define how clients refresh expired tokens. This will cause logout on every token expiration, poor UX.

**Why It Was Missed:**
Original review was code-focused, not architecture-focused. Refresh token pattern is a design decision, not code review issue.

**Impact:**
Users experience unexpected logouts. No mechanism for graceful token refresh.

**Fix:**
Define refresh token strategy:
- Option A: Refresh tokens (separate long-lived token)
- Option B: Auto-refresh on expiration (requires secure cookie storage)
- Option C: Silent refresh with background poll

### Issue 3: Session Fixation Attack Possible

**Severity:** Medium-High

**Description:**
The implementation doesn't rotate session identifiers after authentication. An attacker could:
1. Create a session in the application
2. Trick user into using that session ID
3. User authenticates with attacker's session ID
4. Attacker gains access to authenticated session

**Why It Was Missed:**
Session fixation is subtle. Not obvious from code review unless specifically looking for it.

**Impact:**
Session hijacking vulnerability under specific attack conditions.

**Fix:**
After successful JWT validation, regenerate session ID in the client (if using sessions).

---

## 3. Disagreements

**Count:** 1 point of disagreement

### Disagreement 1: Severity of Error Exposure

**Original Assessment:** Stack trace exposure = Medium severity

**Second Opinion:** Should be High severity

**Evidence Supporting Second Opinion:**
- Stack traces can reveal application structure to attackers
- Information helps attackers craft more targeted exploits
- In production, any information leak is a security concern
- Security best practice: treat all info leaks as high severity

**Why the Disagreement Matters:**
Original prioritized this as medium, but it compounds other auth issues. In security review, info leaks are usually high priority. This disagreement affects remediation urgency.

---

## 4. Notable Findings

**Discoveries beyond original scope:**

- 🔍 **Positive Finding:** Proper TypeScript types for JWT payload reduce injection risk
- 🔍 **Positive Finding:** Middleware correctly validates JWT signature
- 🔍 **Concern:** No audit logging of auth failures (security monitoring gap)

---

## 5. Confidence Assessment

**Confidence in This Critique:** High

**Basis for Confidence:**
- Security domain expertise in authentication
- Comparison against OWASP auth guidelines
- Real-world attack pattern knowledge
- Code is straightforward (high confidence in analysis)

**Limitations of Review:**
- Didn't see actual secrets/keys (could have key rotation issues)
- Didn't test against real JWT libraries (assuming correct behavior)
- Limited context on deployment environment

---

## 6. Verdict Summary

**Overall Quality:** Good foundation, but critical gaps in security completeness

**Key Metrics:**
- **Original Score:** 65%
- **Estimated Revised Score:** 50% (if no fixes applied)
- **Quality Delta:** Would improve to 85-90% if high-priority issues fixed

**Recommendation:**
NEEDS_REVISIONS before approval. Original review was solid but incomplete. The 3 missed issues (rate limiting, refresh strategy, session fixation) are substantial enough to warrant revision before production deployment.

**Reasoning:**
Authentication is a high-security area where "good but incomplete" is insufficient. The auth middleware will be used for all protected endpoints. Missing rate limiting and session fixation protection opens significant attack surface.

---

## Recommendations for Improvement

### If Original Review Is Revised

**Priority 1 (Critical):**
- Add rate limiting to prevent brute force (mitigates most acute attack risk)
- Implement session ID rotation after auth (mitigates session fixation)

**Priority 2 (High):**
- Define token refresh strategy (architectural decision needed before code)
- Add audit logging for all auth failures (security monitoring)

**Priority 3 (Medium):**
- Improve error messages to be generic (already noted by original)

---

## Learnings

**Issue:** Security reviews sometimes overlook architectural concerns (rate limiting, session management) when focused on code-level cryptographic correctness.

**Root Cause:** Code review and architecture review have different lenses. A security-focused review needs both.

**Suggestion:** For authentication code, create a checklist: cryptography (original covered), rate limiting (missed), session management (missed), audit logging (missed). This prevents pattern-based oversights.

**[FRESH EYE]** The original agent did excellent work on the cryptographic aspects. The gaps are architectural, not technical. This suggests auth review should be split: code review + architecture review as separate specialties.
```

---

## Cross-References

- **Agent Definition:** `.claude/actionflows/actions/second-opinion/agent.md`
- **Contract Specification:** `.claude/actionflows/CONTRACT.md` (for reference on contract-defined formats)
- **Related Templates:** `TEMPLATE.review-report.md` (Review Report Format 5.1), `TEMPLATE.report.md` (Analysis Report Format 5.2)
