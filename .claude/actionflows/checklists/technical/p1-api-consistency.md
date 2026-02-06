# API Consistency Checklist (P1 - High)

## Purpose

Ensure RESTful API follows consistent patterns, error handling, naming conventions, and type contracts. Validates that request/response shapes match shared types and are predictable for clients.

---

## Checklist

| # | Check | Pass Criteria | Severity |
|---|-------|---------------|----------|
| 1 | RESTful Endpoint Naming | Resources named as nouns (e.g., `/sessions`, `/chains`, `/steps`). CRUD verbs via HTTP method (GET, POST, PUT, DELETE). Hierarchical paths reflect relationships. | **HIGH** |
| 2 | Consistent Error Response Format | All errors return `{ error: string, code?: string, details?: unknown }` structure. Status codes consistent (400 for client error, 500 for server). Error messages actionable. | **HIGH** |
| 3 | Request/Response Types Match Shared | Request/response types imported from `@afw/shared`. No duplicate type definitions in backend. Types enforced via Express middleware/validators. | **HIGH** |
| 4 | Typed Request/Response Interfaces | All routes have explicit `Request<Params, ResBody, ReqBody, Query>` generics. Response bodies typed. Handler return types declared. | **HIGH** |
| 5 | Middleware Ordering | Auth middleware runs before business logic routes. Error handling middleware last. CORS/JSON parsing early. Consistent across all routes. | **HIGH** |
| 6 | WebSocket Event Naming | Event names follow pattern `action:resource` or `resource:event` (e.g., `chain:step-completed`). Consistent across all handlers. Documented in code. | **HIGH** |
| 7 | API Versioning Strategy | Clear versioning approach documented (URL prefix, header, or body). Version bumping policy defined. Backwards compatibility considered. | **HIGH** |
| 8 | Content-Type Headers | Requests/responses correctly set `Content-Type: application/json`. Negotiation handled for multiple formats if supported. No mismatched headers. | **HIGH** |
| 9 | Status Code Consistency | 200/201 for success, 204 for no-content, 400 for bad request, 401 for auth failure, 403 for forbidden, 404 for not-found, 500 for server error. | **HIGH** |
| 10 | Express Error Middleware Order | Error-handling middleware registered last in Express middleware chain, uses 4-param signature (err, req, res, next). Error handler catches all errors from routes and other middleware. | **HIGH** |
| 11 | pnpm Workspace Patterns | Cross-package imports use workspace protocol (workspace:*), no hardcoded versions for internal packages. Build order respected: shared → backend → app. | **HIGH** |
| 12 | API Documentation | Endpoints documented (JSDoc, OpenAPI, or inline comments). Error cases documented. Request/response examples provided. | **MEDIUM** |

---

## Notes

Consistency makes integration predictable. Treat these as contracts between backend and clients.
