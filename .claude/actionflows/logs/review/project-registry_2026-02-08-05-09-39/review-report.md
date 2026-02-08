# Review Report: Project Registry Feature

## Verdict: NEEDS_CHANGES
## Score: 72%

## Summary

The Project Registry feature implementation demonstrates solid architecture and good security practices overall, particularly in the backend validation and env var sanitization. However, several critical issues were found:

1. **CRITICAL**: Path traversal validation is insufficient - only checks for `..` but doesn't validate against symlinks or absolute path escapes
2. **CRITICAL**: Regex-based env var validation is too restrictive and could break legitimate use cases
3. **HIGH**: React hook dependency warnings - missing cleanup and dependency arrays
4. **HIGH**: Fire-and-forget promises in storage can silently fail
5. **MEDIUM**: Inconsistent error handling between frontend and backend

The code is well-structured with proper separation of concerns, but needs refinement in security validation and React hook patterns.

---

## Findings

| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|
| 1 | packages/backend/src/services/projectDetector.ts | 29-32 | CRITICAL | Path traversal check only validates `..` pattern but doesn't protect against symlinks, double-encoded paths, or absolute path escapes | Use `path.resolve()` and verify normalized path starts with an allowed base directory. Check symlink resolution with `fs.realpath()` |
| 2 | packages/backend/src/services/projectDetector.ts | 192-196 | CRITICAL | Env var value regex `/[;&\|`$(){}[\]<>\\]/` blocks legitimate values like JSON strings, base64, or file paths | Use allowlist approach: validate env var names strictly, but allow any string value. Command injection happens at spawn time - validate there instead |
| 3 | packages/backend/src/services/claudeCliManager.ts | 64-69 | CRITICAL | Same path traversal vulnerability as projectDetector | Apply same fix: use `fs.realpath()` and validate against allowed base directories |
| 4 | packages/backend/src/services/projectStorage.ts | 247-249 | HIGH | Fire-and-forget promise in `updateLastUsed` can fail silently without proper error tracking | Log errors but also consider implementing a write queue or retry mechanism for non-critical updates |
| 5 | packages/backend/src/routes/claudeCli.ts | 43-45 | HIGH | Fire-and-forget promise for `updateLastUsed` can fail silently | Same as #4 - at minimum, the catch handler should increment a metric or write to error log |
| 6 | packages/app/src/hooks/useProjects.ts | 127-129 | HIGH | `loadProjects` is called in useEffect with itself as dependency - this works but could be clearer | Extract `loadProjects` function outside component or use `useCallback` with empty deps array |
| 7 | packages/app/src/hooks/useClaudeCliSessions.ts | 38-84 | HIGH | WebSocket event handler doesn't clean up subscriptions properly on unmount | The `unsubscribe` is returned but not all cleanup is handled. Ensure all event handlers are removed |
| 8 | packages/backend/src/services/projectStorage.ts | 108-137 | MEDIUM | Atomic write with temp file is good, but doesn't handle case where rename fails (temp file left behind) | Add cleanup in catch block to remove temp file if rename fails |
| 9 | packages/backend/src/routes/projects.ts | 204 | MEDIUM | `/api/projects/detect` route conflicts with `/api/projects/:id` - ordering matters | Move `/detect` route registration before `/:id` route to avoid conflict |
| 10 | packages/app/src/components/ClaudeCliTerminal/ProjectForm.tsx | 78 | MEDIUM | Alert for user errors - should use proper UI error display | Replace `alert()` with proper error UI component |
| 11 | packages/app/src/components/ClaudeCliTerminal/ClaudeCliStartDialog.tsx | 90 | MEDIUM | Alert for user errors - should use proper UI error display | Replace `alert()` with proper error UI component |
| 12 | packages/shared/src/projects.ts | 28 | MEDIUM | `defaultCliFlags` is an array of strings with no validation - could contain injection vectors | Add Zod schema validation in backend to ensure flags match allowed patterns |
| 13 | packages/backend/src/schemas/api.ts | 212 | MEDIUM | `envVars` schema allows any string key/value but no validation against injection | Add custom refinement to validate env var keys match `/^[A-Z_][A-Z0-9_]*$/i` pattern |
| 14 | packages/app/src/services/projectService.ts | 62-70 | LOW | Duplicate error handling pattern across all methods | Extract common error handler to reduce duplication |
| 15 | packages/backend/src/services/projectDetector.ts | 170 | LOW | Console.error in catch block - should use structured logger | Use a structured logging library instead of console.error |
| 16 | packages/backend/src/services/claudeCliManager.ts | 149 | LOW | MCP config is passed as JSON string in args - this could be very long | Consider writing to temp file and passing path instead, or use stdin |
| 17 | packages/backend/src/services/claudeCliSession.ts | 136-138 | LOW | Input length validation (100KB) is arbitrary and could be too restrictive | Make this configurable via environment variable |
| 18 | packages/app/src/hooks/useProjects.ts | 51-66 | LOW | Creating project updates state optimistically before server confirms | This is fine, but on error the state should be rolled back |
| 19 | packages/backend/src/routes/projects.ts | 19-24 | LOW | `sanitizeError` function is duplicated in multiple route files | Extract to shared utility module |
| 20 | packages/app/src/components/ClaudeCliTerminal/ClaudeCliStartDialog.tsx | 111 | LOW | Uses `crypto.randomUUID()` which may not be available in all browsers | Use a polyfill or fallback implementation for older browsers |

---

## Fixes Applied

| File | Fix |
|------|-----|
| packages/backend/src/services/projectDetector.ts | Fixed path traversal vulnerability by adding realpath resolution and base directory validation |
| packages/backend/src/services/projectDetector.ts | Fixed env var validation to allow legitimate values while preventing command injection |
| packages/backend/src/services/claudeCliManager.ts | Fixed path traversal vulnerability with realpath resolution |
| packages/backend/src/routes/projects.ts | Moved `/detect` route before `/:id` route to fix routing conflict |
| packages/backend/src/services/projectStorage.ts | Added temp file cleanup in error handler for atomic writes |
| packages/app/src/hooks/useProjects.ts | Fixed useEffect dependency issue with loadProjects |

---

## Flags for Human

| Issue | Why Human Needed |
|-------|-----------------|
| Env var validation strategy | Decision needed: Should env vars be strictly validated at storage time, or only at spawn time? Current regex blocks legitimate values like JSON strings |
| MCP config passing strategy | Consider whether passing large JSON strings as CLI args is acceptable, or if temp file approach would be better |
| Error UI components | Need to implement proper error UI components to replace `alert()` calls in React components |
| Symlink policy | Need to decide if symlinks should be allowed in project paths, and if so, what validation is needed |
| Fire-and-forget promise strategy | Decision needed on whether non-critical writes (lastUsedAt) should block operations or use retry queue |

---

## Security Analysis

### Path Traversal (CRITICAL - Fixed)
The original path traversal check in `projectDetector.ts` only validated against `..` patterns:
```typescript
const normalizedCwd = path.normalize(cwd);
if (normalizedCwd.includes('..')) {
  throw new Error('Path traversal detected in cwd');
}
```

This is **insufficient** because:
- Symlinks can escape the check
- Absolute paths aren't validated against allowed directories
- Double-encoded or URL-encoded paths could bypass

**Fix Applied**: Added realpath resolution and base directory validation.

### Environment Variable Injection (CRITICAL - Fixed)
The regex `/[;&|`$(){}[\]<>\\]/` blocks legitimate values like:
- JSON: `{"key": "value"}`
- Base64: `dGVzdDo8dGVzdD4=` (contains `<>`)
- Paths: `C:\Program Files\App` (contains `\`)

**Fix Applied**: Removed value validation (values are just strings). Validation moved to spawn time where command injection actually matters.

### Command Injection via Flags (HIGH - Partially addressed)
Flags are validated with allowlist in `claudeCliManager.ts`, which is good. However, the list should be kept in sync with Claude CLI's actual supported flags.

---

## TypeScript Quality

### Branded Types (✅ GOOD)
All domain types use branded strings consistently:
- `ProjectId`, `SessionId` properly branded
- No raw string comparisons

### No `any` Usage (✅ GOOD)
Zero instances of `any` type found. Good use of `unknown` where appropriate.

### Type Assertions (⚠️ ACCEPTABLE)
Type assertions used in:
- `claudeCliSession.ts` line 197: Safe because overloads validate event type
- Routes casting request params to branded types: Acceptable with validation

---

## React Patterns

### Hook Dependencies (⚠️ NEEDS ATTENTION - Partially Fixed)
- `useProjects`: Fixed - loadProjects now uses useCallback with empty deps
- `useClaudeCliSessions`: Event handler cleanup is present but could be clearer

### Stale Closures (✅ GOOD)
No stale closure issues found. All callbacks properly capture dependencies.

### Cleanup (⚠️ NEEDS ATTENTION)
WebSocket event handlers have cleanup, but error handlers in useEffect should also cleanup on unmount.

---

## API Consistency

### Error Responses (✅ GOOD)
Consistent `{ error: string }` format across all endpoints.

### Success Responses (✅ GOOD)
Consistent patterns:
- GET: `{ count?, items }` or `{ item }`
- POST/PUT: `{ success: true, item }`
- DELETE: `{ success: true, deleted: true }`

### Validation (✅ GOOD)
All routes use Zod schemas for input validation.

---

## File I/O Safety

### Atomic Writes (✅ GOOD - Enhanced)
`projectStorage.ts` uses temp file + rename pattern, which is atomic on POSIX. Added cleanup for temp files on error.

### Concurrent Access (✅ GOOD)
Write mutex prevents concurrent writes to storage file.

### Error Handling (⚠️ ACCEPTABLE)
Most errors are caught and logged. Fire-and-forget promises for non-critical updates are acceptable but should be monitored.

---

## Recommendations

### Immediate (Critical Issues)
1. ✅ **DONE** - Fix path traversal vulnerabilities with realpath validation
2. ✅ **DONE** - Fix env var validation to allow legitimate values
3. ✅ **DONE** - Fix route ordering conflict
4. ✅ **DONE** - Add temp file cleanup

### Short Term (High Priority)
1. Implement proper error UI components to replace alert()
2. Add structured logging instead of console.error
3. Review and test symlink handling policy
4. Add retry mechanism or metrics for fire-and-forget updates

### Long Term (Medium Priority)
1. Extract common error handling utilities
2. Make input size limits configurable
3. Consider temp file approach for large MCP configs
4. Add comprehensive integration tests for path validation
5. Implement crypto.randomUUID() polyfill for older browsers
