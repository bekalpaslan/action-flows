# Test Quality Checklist (P2 - Medium)

## Purpose

Validate test coverage, isolation, and effectiveness. Ensures tests exercise critical paths, edge cases, and integration points. Mocks are realistic and don't hide real behavior.

---

## Checklist

| # | Check | Pass Criteria | Severity |
|---|-------|---------------|----------|
| 1 | Unit Tests for Business Logic | Core logic (session creation, chain execution, step transitions) has unit tests. Tests use Vitest. Coverage targets: 80% line, 75% branch, 80% function. | **MEDIUM** |
| 2 | Integration Tests for Routes | Critical API routes tested with Supertest. Full request/response cycle validated. Database interactions tested against real/test storage. | **MEDIUM** |
| 3 | WebSocket Event Handlers Tested | Event handlers (chain:started, step:completed, etc.) tested. Subscription/unsubscription validated. Message broadcasting verified. | **MEDIUM** |
| 4 | Storage Interface Tested | Both MemoryStorage and Redis implementations tested identically. Common test suite verifies contract. Persistence and retrieval validated. | **MEDIUM** |
| 5 | Edge Cases Covered | Empty lists, null values, boundary conditions (0, -1, MAX_INT) tested. Concurrent operations stress-tested. Timeout scenarios covered. | **MEDIUM** |
| 6 | Tests Isolated/Independent | No shared state between tests. Setup/teardown runs per-test. Mock cleanup enforced. Tests run in any order without failure. | **MEDIUM** |
| 7 | Mocks Don't Mask Behavior | Mocks return realistic data structures. Spy on real implementations to ensure mocks match. No mocking that hides critical bugs. | **MEDIUM** |
| 8 | Test Descriptions Clear | Test names describe expected behavior clearly (e.g., "should return 400 when email invalid"). A non-engineer reads test and understands intent. | **MEDIUM** |
| 9 | Coverage Targets Met | Line coverage >80%, branch coverage >75%, function coverage >80%. Uncovered lines documented if intentional. Coverage CI gate configured. | **MEDIUM** |
| 10 | No Test Flakiness | Tests deterministic. No timing-dependent assertions. Async operations properly awaited. Random data seeded for reproducibility. | **MEDIUM** |
| 11 | Error Cases Tested | Negative tests for every success path. API errors, timeouts, malformed input validated. Error message assertions included. | **MEDIUM** |

---

## Notes

Tests are the first consumer of your code. If a test is hard to write, the code is probably hard to use.
