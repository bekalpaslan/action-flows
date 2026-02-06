# Checklist Index

> Available validation checklists for reviews and audits.

## Available Checklists

| Priority | Name | Category | Purpose |
|----------|------|----------|---------|
| p0 | p0-security | technical | Auth, injection, XSS, data integrity, Electron security |
| p1 | p1-api-consistency | technical | Endpoint patterns, error handling, typed responses |
| p1 | p1-typescript-quality | technical | Type safety, branded types, no `any`, discriminated unions |
| p1 | p1-session-management-review | functional | Session CRUD, state transitions, commands |
| p1 | p1-websocket-flow-review | functional | Connection lifecycle, reconnection, event broadcasting |
| p2 | p2-test-quality | technical | Coverage, edge cases, mocking, Vitest/Supertest patterns |
| p2 | p2-performance | technical | Re-renders, WebSocket efficiency, memory leaks |
| p2 | p2-ui-component-review | functional | Accessibility, dark theme, responsive, ReactFlow |
| p3 | p3-code-style | technical | Naming, imports, file organization, CSS co-location |

## Categories

- **technical/** — Security, API consistency, test quality, performance
- **functional/** — Feature flows, business logic validation

## Priority Levels

- **p0:** Critical (security, auth, data integrity)
- **p1:** High (core features, API contracts)
- **p2:** Medium (test quality, UI patterns)
- **p3:** Low (code style, documentation)
