# Security Checklist (P0 - Critical)

## Purpose

Validate critical security controls for the ActionFlows Dashboard. These items prevent authentication bypass, injection attacks, data exposure, and system compromise.

---

## Checklist

| # | Check | Pass Criteria | Severity |
|---|-------|---------------|----------|
| 1 | WebSocket Authentication | All WebSocket connections require valid JWT token in handshake. Token verified on every message. Unauthenticated connections rejected. | **CRITICAL** |
| 2 | WebSocket Authorization | WebSocket handlers verify user has permission for SessionId/ChainId before broadcasting events. Users can only access their own sessions. | **CRITICAL** |
| 3 | Input Validation on APIs | All POST/PUT endpoints validate request body against schema. Invalid input returns 400 with clear error. No unvalidated data reaches business logic. | **CRITICAL** |
| 4 | XSS Prevention in React | No use of `dangerouslySetInnerHTML` with user content. All user-rendered values escaped/sanitized. Component props validated for expected types. | **CRITICAL** |
| 5 | SQL/NoSQL Injection Prevention | No string interpolation in database queries. Parameterized queries/prepared statements used. No user input directly in query construction. | **CRITICAL** |
| 6 | CORS Configuration | CORS headers whitelist specific origins. `Access-Control-Allow-Credentials` not set to true unless intentional. Preflight requests handled correctly. | **CRITICAL** |
| 7 | Rate Limiting | API endpoints have rate limiting per IP/user. WebSocket event handlers limit message frequency. DoS attacks mitigated. | **CRITICAL** |
| 8 | Sensitive Data Exposure | No credentials/tokens logged in info/debug logs. Passwords not included in error responses. Sensitive fields excluded from API responses. Session IDs not exposed in URLs. | **CRITICAL** |
| 9 | Electron Security | `nodeIntegration` disabled. `contextIsolation` enabled. Preload scripts use secure APIs only. No `require()` of arbitrary modules in renderer. | **CRITICAL** |
| 10 | Command Injection Prevention | Step parameters not passed directly to shell/exec commands. User-supplied data validated as safe values or escaped. Shell metacharacters not interpreted. | **CRITICAL** |

---

## Notes

These are foundational security items. All must pass before deployment. Route security through code review and penetration testing.
