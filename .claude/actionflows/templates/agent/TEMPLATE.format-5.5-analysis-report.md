# Analysis Report Template (Format 5.5)

**Purpose:** Used by specialized analysis actions to produce detailed analysis reports
**Contract Reference:** CONTRACT.md § Format 5.5 (Analysis Report) — P3 Priority
**Note:** This is distinct from Format 5.2 (generic analysis) — use this for deep technical analysis
**Parser:** `parseAnalysisReport` in `packages/shared/src/contract/parsers/actionParser.ts`

---

## Required Sections

These sections should be present in detailed analysis reports:

1. **Title** (H1) — Analysis subject
2. **Metadata** — Aspect, scope, date, agent
3. **Executive Summary** — High-level findings
4. **Detailed Analysis** — Numbered sections with findings
5. **Conclusions** — Summary of analysis
6. **Recommendations** — Next actions

---

## Optional Sections

- **Methodology** — How the analysis was conducted
- **Appendix** — Raw data, code samples, references
- **Metrics** — Quantitative findings in tables
- **Learnings** — Process improvements discovered

---

## Template Structure

```markdown
# {Analysis Title}

**Aspect:** {aspect}
**Scope:** {scope description}
**Date:** {YYYY-MM-DD}
**Agent:** {agent-type}/

---

## Executive Summary

{High-level summary of findings}

**Key Findings:**
- ✅ {Finding 1}
- ⚠️ {Finding 2 with caveat}
- ❌ {Issue found}

---

## Methodology

{How this analysis was conducted}

**Tools Used:**
- {Tool 1} — Purpose
- {Tool 2} — Purpose

**Scope Limitations:**
- {Limitation 1}
- {Limitation 2}

---

## 1. {First Analysis Section}

### 1.1 {Subsection}

{Detailed findings with data/examples}

**Observations:**
- Observation 1
- Observation 2

**Evidence:**
- Source 1: {Finding}
- Source 2: {Finding}

### 1.2 {Subsection}

{More findings}

---

## 2. {Second Analysis Section}

{Structured findings with supporting evidence}

### Metrics Table

| Metric | Value | Status |
|--------|-------|--------|
| {Metric} | {Value} | {Status} |

---

## Conclusions

{Summary of what the analysis reveals}

**Primary Finding:**
{The most important discovery}

**Supporting Findings:**
- Finding 1
- Finding 2

---

## Recommendations

### P0 (Critical)

**Finding:** {What was discovered}

**Recommendation:** {What should be done}

**Rationale:** {Why this is important}

### P1 (High)

{Similar structure}

### P2 (Medium)

{Similar structure}

---

## Appendix: Detailed Data

### File Inventory

| File | Purpose | Observations |
|------|---------|--------------|
| {path} | {purpose} | {findings} |

### Code Samples

{Example code with annotations}

---

## Learnings

**Issue:** {Description}

**Root Cause:** {Analysis}

**Suggestion:** {How to prevent}

**[FRESH EYE]** {Any discoveries outside analysis scope}
```

---

## Field Descriptions

### Aspect

- **Type:** String (extensible)
- **Common Values:** drift, coverage, performance, security, compliance, scalability, maintainability
- **Purpose:** Categorize the type of analysis

### Methodology

- **Purpose:** Explain how findings were determined
- **Transparency:** Build trust in conclusions
- **Limitations:** Acknowledge what wasn't analyzed

### Detailed Analysis

- **Structure:** Use numbered sections with subsections
- **Evidence:** Every claim should have supporting data
- **Clarity:** Explain implications of findings
- **Objectivity:** Separate observations from interpretations

### Recommendations

- **Prioritization:** Use P0/P1/P2 framework
- **Actionability:** Each recommendation should be executable
- **Justification:** Explain why each action matters

---

## Example

```markdown
# Database Query Performance Analysis

**Aspect:** performance
**Scope:** packages/backend/src/routes/
**Date:** 2026-02-20
**Agent:** analyze/

---

## Executive Summary

Analysis of database queries in 5 core routes reveals N+1 query patterns in 3 routes, causing 40% performance degradation in list endpoints under load. Sequential queries can be eliminated with JOIN optimization.

**Key Findings:**
- ✅ Session queries use proper connection pooling
- ⚠️ User list endpoint executes 101 queries for 100 results (N+1 problem)
- ❌ Chain detail endpoint missing database indexes, causing full table scans
- ✅ Pagination properly implemented in 4 of 5 endpoints

---

## Methodology

Analysis was conducted by:
1. Instrumenting Express middleware to log database queries
2. Running load tests with 100 concurrent requests
3. Analyzing query logs for patterns and bottlenecks
4. Measuring query execution time and count

**Tools Used:**
- PostgreSQL EXPLAIN ANALYZE — Query plan analysis
- Custom query instrumentation — Real-time query logging
- k6 load testing — Concurrent request simulation
- Datadog APM — Production performance correlation

**Scope Limitations:**
- Analysis limited to 5 core routes (out of 12 total)
- Load test cannot fully replicate production concurrency (max 100 vs production 1000+)
- Caching behavior not analyzed (separate analysis needed)

---

## 1. Query Pattern Analysis

### 1.1 User List Endpoint (/users)

The endpoint is making 101 database queries:
- 1 query to fetch 100 users
- 100 queries to fetch profile details for each user (N+1 pattern)

```sql
-- Current implementation (N+1)
SELECT * FROM users LIMIT 100;  -- 1 query
SELECT * FROM profiles WHERE user_id = ?;  -- 100 queries
```

**Observations:**
- Each user fetch triggers a separate profile lookup
- Queries execute sequentially (no parallelization)
- Total response time: 2500ms (avg 25ms per user)

**Recommended Fix:**
```sql
SELECT u.*, p.* FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
LIMIT 100;  -- 1 query instead of 101
```

**Impact:** ~98% response time reduction (2500ms → 50ms)

### 1.2 Session Detail Endpoint (/sessions/{id})

This endpoint queries ALL sessions to check permissions instead of direct ID lookup.

**Current Query:**
```sql
SELECT * FROM sessions;  -- Full table scan!
WHERE chain_id = ?;
```

**Observations:**
- Full table scan without index
- With 10k sessions: avg 5 seconds per request
- Should use indexed lookup instead

**Recommended Fix:**
```sql
-- Add index
CREATE INDEX idx_sessions_chain_id ON sessions(chain_id);

-- Update query (database can use index)
SELECT * FROM sessions WHERE chain_id = ? LIMIT 1;
```

**Impact:** 50x faster (5000ms → 100ms)

---

## 2. Connection Pool Analysis

### Current Configuration

```javascript
pool: {
  min: 5,
  max: 20,
  connectionTimeoutMillis: 2000,
  idleTimeoutMillis: 30000
}
```

**Analysis:**
Pool configuration is reasonable for current load (100-200 concurrent). However:

| Metric | Current | Recommended | Reason |
|--------|---------|-------------|--------|
| Min connections | 5 | 5 | Good |
| Max connections | 20 | 30 | Production can reach 200+ concurrent |
| Timeout | 2000ms | 5000ms | Under load, acquire time can spike to 3s+ |

---

## Conclusions

The database layer has significant optimization opportunities:

**Primary Finding:**
N+1 query patterns in user/profile endpoints are responsible for 70% of observed performance degradation. Fixing these two routes would improve average response time by 2 seconds.

**Supporting Findings:**
- Missing indexes on frequently-queried columns causes full table scans
- Connection pool configuration needs tuning for production load
- Query batching could reduce total query count by 30-40%

---

## Recommendations

### P0 (Critical)

**Finding:** User list endpoint executes 101 queries instead of 1 (N+1 problem)

**Recommendation:** Implement JOIN to fetch users + profiles in single query

**Rationale:** This one change would improve list endpoint from 2500ms to 50ms response time. High ROI, medium effort.

**Implementation:**
1. Update user query to use LEFT JOIN with profiles
2. Update TypeScript types to include nested profile
3. Test with load test (verify 50x speedup)

### P1 (High)

**Finding:** Session detail endpoint does full table scan, causing 5-second latency with 10k sessions

**Recommendation:** Create database index on `sessions.chain_id`

**Rationale:** Simple fix (one CREATE INDEX), massive impact (50x speedup)

**Implementation:**
1. Write migration to create index
2. Deploy migration to production
3. Monitor query times (verify improvement)

### P2 (Medium)

**Finding:** Connection pool max is 20, production can need 30+ connections

**Recommendation:** Increase max pool size to 30-40

**Rationale:** Prevents connection exhaustion under peak load. Low risk change.

---

## Appendix: Query Logs Sample

```
timestamp | query | duration_ms | rows
2026-02-20T14:30:45Z | SELECT * FROM users LIMIT 100 | 8 | 100
2026-02-20T14:30:45Z | SELECT * FROM profiles WHERE user_id = 1 | 2 | 1
2026-02-20T14:30:45Z | SELECT * FROM profiles WHERE user_id = 2 | 2 | 1
... (repeated 98 more times)
```

---

## Learnings

**Issue:** None — execution proceeded as expected.

**Root Cause:** N/A

**Suggestion:** N/A

**[FRESH EYE]** Consider implementing query caching layer (Redis) for profiles since they're fetched repeatedly and change infrequently.
```

---

## Cross-References

- **Contract Specification:** `.claude/actionflows/CONTRACT.md` § Format 5.2 (Analysis)
- **Parser Implementation:** `packages/shared/src/contract/parsers/actionParser.ts`
- **Related Templates:** `TEMPLATE.report.md` (Generic analysis template)
