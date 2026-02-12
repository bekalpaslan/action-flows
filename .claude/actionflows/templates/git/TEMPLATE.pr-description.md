<!-- Format G.2: Pull Request Description -->
<!-- Purpose: Standard PR description format for GitHub -->
<!-- Source: ORCHESTRATOR.md § Pull Request Format -->

---

## Required Fields

- `## Summary` heading with 2-5 bullet points describing the changes
- `## Test plan` heading with actionable checklist
- Footer with Claude Code attribution (literal)

---

## Optional Fields

- Additional sections (Breaking Changes, Screenshots, Migration Notes, etc.)

---

## Validation Rules

- Must have both Summary and Test plan sections
- Summary should be 2-5 bullet points (focused and specific)
- Test plan should be actionable checklist items
- Footer must include exact attribution text

---

## Template Structure

```markdown
## Summary
- {change_1}
- {change_2}
- {change_3}
- {change_4}
- {change_5}

## Test plan
- [ ] {test_step_1}
- [ ] {test_step_2}
- [ ] {test_step_3}
- [ ] {test_step_4}

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## Examples

**Feature PR:**
```markdown
## Summary
- Implemented JWT-based authentication system
- Added auth middleware with token validation
- Created login/logout endpoints in backend
- Added auth context provider in frontend

## Test plan
- [ ] Start backend server and verify /api/auth/login endpoint exists
- [ ] Test login with valid credentials → receives JWT token
- [ ] Test protected route with token → access granted
- [ ] Test protected route without token → 401 Unauthorized
- [ ] Test logout → token invalidated
- [ ] Run integration tests: `pnpm test:auth`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

**Bug Fix PR:**
```markdown
## Summary
- Fixed race condition in session creation
- Added session existence check before creating new sessions
- Updated WebSocket connection handler to prevent duplicates

## Test plan
- [ ] Start backend and frontend
- [ ] Open multiple browser tabs simultaneously
- [ ] Verify only one session created per user
- [ ] Check WebSocket connections don't duplicate
- [ ] Run session tests: `pnpm test:session`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

**Refactoring PR:**
```markdown
## Summary
- Extracted shared validation logic into utility functions
- Moved auth validation from routes to middleware
- Updated all routes to use new middleware pattern
- Added unit tests for validation utilities

## Test plan
- [ ] Run full test suite: `pnpm test`
- [ ] Verify all existing routes still work
- [ ] Test validation error handling
- [ ] Run type check: `pnpm type-check`
- [ ] Confirm no behavior changes (regression test)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

**PR with Breaking Changes:**
```markdown
## Summary
- Changed session ID format from UUID to custom branded type
- Updated all session-related APIs to use SessionId type
- Migrated existing session storage to new format
- Added backward compatibility layer for old session IDs

## Breaking Changes
- Session IDs are now branded types (`SessionId`) instead of plain strings
- API consumers must update type imports from `@afw/shared`

## Test plan
- [ ] Run migration script on test database
- [ ] Verify old sessions still work during transition
- [ ] Test new session creation with branded types
- [ ] Run full test suite: `pnpm test`
- [ ] Run type check across all packages: `pnpm type-check`
- [ ] Test backward compatibility with old session format

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## Cross-References

- **ORCHESTRATOR.md:** Pull Request Format section
- **GitHub:** Pull request creation workflow
