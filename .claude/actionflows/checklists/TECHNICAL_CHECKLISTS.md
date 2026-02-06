# Technical Checklists

Quality gates and validation criteria for code review, audits, and CI/CD pipelines.

## Priority Tiers

| Priority | Severity | Files | Use Case |
|----------|----------|-------|----------|
| P0 | **CRITICAL** | p0-security.md | Security audit, pre-deployment review |
| P1 | **HIGH** | p1-api-consistency.md, p1-typescript-quality.md | Code quality gate, integration testing |
| P2 | **MEDIUM** | p2-test-quality.md, p2-performance.md | Test coverage validation, performance audit |
| P3 | **LOW** | p3-code-style.md | Style enforcement, linter baseline |

## Files

### P0 - Critical Security
- **p0-security.md** (10 items)
  - WebSocket auth/authz, input validation, XSS prevention
  - Injection prevention, CORS, rate limiting
  - Sensitive data exposure, Electron security, command injection
  - Session/Chain ID tampering prevention

### P1 - High Priority
- **p1-api-consistency.md** (10 items)
  - RESTful conventions, error response format
  - Type consistency with @afw/shared
  - Middleware ordering, WebSocket naming, versioning
  
- **p1-typescript-quality.md** (10 items)
  - No `any` types, branded ID types (SessionId, ChainId, StepId, UserId)
  - Discriminated unions, strict null checks
  - Shared type imports, explicit return types, generic constraints

### P2 - Medium Priority
- **p2-test-quality.md** (11 items)
  - Unit tests, integration tests with Supertest
  - WebSocket event tests, storage contract tests
  - Edge cases, test isolation, mock realism, coverage targets

- **p2-performance.md** (10 items)
  - React memoization, WebSocket payload efficiency, memory leak prevention
  - Bundle size, ReactFlow virtualization, Redis efficiency
  - Backend response times, async operations, database optimization

### P3 - Low Priority (Style)
- **p3-code-style.md** (10 items)
  - File naming (kebab-case/PascalCase)
  - Import ordering, CSS co-location
  - Functional components, hook naming, magic number extraction
  - Dead code removal, console.log cleanup

## Usage

**For review/ agents:**
- Use P0 for security-sensitive code paths
- Use P1 for all API/SDK changes
- Use P2 for performance-critical components
- Use P3 as baseline for all PRs

**For audit/ agents:**
- Run full set quarterly for compliance audit
- Run P0 monthly for security audit
- Run P2 periodically for performance regression detection

**For CI/CD gates:**
- P0 blocks deployment
- P1 blocks merge to main
- P2 generates warnings, tracked in metrics
- P3 automated via linter/formatter

---

**Created:** 2026-02-06
**Format:** Markdown tables with pass/fail criteria per item
**Total Items:** 61 validation checkpoints
