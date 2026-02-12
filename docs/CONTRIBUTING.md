# Contributing — ActionFlows Dashboard

> Guidelines for contributing code, documentation, and improvements to ActionFlows Dashboard.

## Table of Contents

- [Philosophy](#philosophy)
- [Getting Started](#getting-started)
- [Git Workflow](#git-workflow)
- [Code Style](#code-style)
- [Making Changes](#making-changes)
- [Testing Requirements](#testing-requirements)
- [Documentation Standards](#documentation-standards)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)
- [Code Review Checklist](#code-review-checklist)

---

## Philosophy

**ActionFlows is open source software** built on a radical premise: **the product is the idea, not the codebase.**

### Contribution Philosophy

- **Fork freely** — The codebase isn't sacred. Evolve it.
- **No asterisks** — You have full sovereignty over all five layers (platform, orchestration, physics, etc.)
- **Mutation is strength** — The more this idea spreads and mutates, the stronger it becomes.
- **Learn from the template** — This repo is a proven starting point with real-world defaults.

This means:
- Contributions are welcome
- You can challenge any design decision
- Large refactors are OK if justified
- Document why you're changing things

---

## Getting Started

### 1. Fork & Clone

```bash
# Fork on GitHub
# Clone your fork
git clone https://github.com/YOUR-USERNAME/ActionFlowsDashboard.git
cd ActionFlowsDashboard

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL-REPO/ActionFlowsDashboard.git
```

### 2. Create a Branch

```bash
# Update from upstream
git fetch upstream
git checkout master
git merge upstream/master

# Create feature branch
git checkout -b feat/my-feature
# or
git checkout -b fix/my-bug
```

### 3. Install & Verify

```bash
pnpm install
pnpm type-check
pnpm lint
pnpm test
```

All should pass. If not, see [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md#troubleshooting).

---

## Git Workflow

### Branch Naming

Use **conventional commit** prefixes:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New feature | `feat/add-session-delete` |
| `fix/` | Bug fix | `fix/websocket-timeout` |
| `refactor/` | Code restructure | `refactor/storage-abstraction` |
| `docs/` | Documentation | `docs/api-reference` |
| `test/` | Tests | `test/e2e-sessions` |
| `perf/` | Performance | `perf/cache-optimization` |
| `chore/` | Maintenance | `chore/update-deps` |

### Commit Messages

Use **conventional commits**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Examples:

```
feat(backend): add session deletion API

Add DELETE /api/sessions/:id endpoint with cascade cleanup.
Fixes #123

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

```
fix(frontend): prevent WebSocket reconnect loop

Connection was reconnecting immediately after close.
Now waits 3s before retrying.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

```
docs: update installation instructions

Clarify Node.js version requirement (18+).
Add Redis optional setup guide.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### Commit Rules

- **One logical change per commit** (don't mix features + refactoring)
- **Descriptive messages** (not "fix stuff")
- **Reference issues** (`Fixes #123` or `Related to #456`)
- **Include co-author** (`Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`)
- **Test passes** before committing

```bash
# Verify before committing
pnpm type-check
pnpm lint
pnpm test

# Commit with message
git commit -m "feat: add user preferences endpoint

Add POST /api/preferences endpoint to save user settings.
Implements pref storage in Redis with 30-day TTL.

Fixes #234

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Code Style

### TypeScript

```typescript
// ✅ Use strict types
interface Session {
  id: SessionId;
  userId: UserId;
  createdAt: Date;
}

// ❌ Avoid any
const session: any = {};

// ✅ Use branded types for domain concepts
export type SessionId = string & { readonly __brand: 'SessionId' };

// ✅ Use discriminated unions
type Event =
  | { type: 'session:created'; sessionId: SessionId }
  | { type: 'chain:started'; chainId: ChainId };

// ❌ Avoid loose unions
type Event = { type: string; data: any };
```

### React Components

```typescript
// ✅ Use function components with hooks
export const Button: React.FC<ButtonProps> = ({ onClick, children }) => {
  return <button onClick={onClick}>{children}</button>;
};

// ❌ Don't use class components
class Button extends React.Component { /* ... */ }

// ✅ Extract custom hooks for logic
const useSessionData = (sessionId: SessionId) => {
  const [session, setSession] = useState(null);
  useEffect(() => { /* fetch */ }, [sessionId]);
  return session;
};

// ✅ Use CSS modules for component styles
import styles from './Button.module.css';
<button className={styles.primary}>Click</button>

// ❌ Avoid inline styles
<button style={{ background: 'blue' }}>Click</button>
```

### Backend Routes

```typescript
// ✅ Use typed request/response
router.get('/:id', (req: Request<{ id: SessionId }>, res: Response) => {
  const { id } = req.params;
  const session = storage.getSession(id);
  res.json(session);
});

// ✅ Handle errors with try-catch
router.post('/', async (req, res) => {
  try {
    const session = await storage.saveSession(req.body);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// ❌ Don't mix async/callback style
router.get('/', (req, res, next) => { /* ... */ });

// ✅ Use route-level error handlers
router.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: error.message });
});
```

### Naming Conventions

```typescript
// ✅ Descriptive names
const getUserSession = async (userId: UserId) => { /* ... */ };
const isSessionActive = (session: Session) => { /* ... */ };
const handleCreateSession = () => { /* ... */ };

// ❌ Abbreviated/unclear names
const getUS = (uid: any) => { /* ... */ };
const isSActive = (s: any) => { /* ... */ };
const handleCreate = () => { /* ... */ };

// ✅ Boolean prefixes: is*, has*, should*, can*
const isLoading = true;
const hasError = false;
const shouldRetry = true;
const canDelete = false;

// ✅ Handler prefixes: handle*, on*
const handleClick = () => { /* ... */ };
const onSessionChange = () => { /* ... */ };

// ✅ Getter prefixes: get*
const getSession = async (id: SessionId) => { /* ... */ };
```

### Formatting

The project uses **Prettier** for formatting:

```bash
# Format all files
pnpm lint --fix

# Check formatting
pnpm lint
```

Don't manually format — let Prettier handle it.

**Prettier Config** (auto-applied):
- 2 spaces indentation
- Single quotes for strings
- Trailing commas
- 80 character line length (soft)

---

## Making Changes

### Adding a Feature

**Example: Add a "Mark as Read" button to sessions list**

#### 1. Plan the Work

- Frontend: Add button to session item
- Backend: Add PUT endpoint to mark session as read
- Shared: Update Session type to include `isRead` field

#### 2. Update Types First

Edit `packages/shared/src/types.ts`:

```typescript
export interface Session {
  id: SessionId;
  userId: UserId;
  isRead: boolean;  // NEW
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3. Backend Implementation

Create/update `packages/backend/src/routes/sessions.ts`:

```typescript
// Mark session as read
router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const session = await storage.getSession(id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.isRead = true;
    session.updatedAt = new Date();

    await storage.saveSession(session);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update session' });
  }
});
```

Write tests in `packages/backend/src/__tests__/routes/sessions.test.ts`:

```typescript
describe('PUT /sessions/:id/read', () => {
  it('should mark session as read', async () => {
    const session = { id: 'session-123', userId: 'user-456', isRead: false };
    await storage.saveSession(session);

    const response = await request(app)
      .put('/api/sessions/session-123/read');

    expect(response.status).toBe(200);
    expect(response.body.isRead).toBe(true);
  });

  it('should return 404 for non-existent session', async () => {
    const response = await request(app)
      .put('/api/sessions/non-existent/read');

    expect(response.status).toBe(404);
  });
});
```

#### 4. Frontend Implementation

Create `packages/app/src/components/SessionItem.tsx`:

```typescript
interface SessionItemProps {
  session: Session;
  onMarkRead: (id: SessionId) => Promise<void>;
}

export const SessionItem: React.FC<SessionItemProps> = ({ session, onMarkRead }) => {
  const [isMarking, setIsMarking] = useState(false);

  const handleMarkRead = async () => {
    setIsMarking(true);
    try {
      await onMarkRead(session.id);
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <div className={styles.item}>
      <span className={session.isRead ? styles.read : styles.unread}>
        {session.name}
      </span>
      {!session.isRead && (
        <button
          onClick={handleMarkRead}
          disabled={isMarking}
          className={styles.button}
        >
          {isMarking ? 'Marking...' : 'Mark as Read'}
        </button>
      )}
    </div>
  );
};
```

Write tests in `packages/app/src/__tests__/components/SessionItem.test.tsx`:

```typescript
describe('SessionItem', () => {
  it('should show mark as read button when unread', () => {
    const session = { ...mockSession, isRead: false };
    const onMarkRead = vi.fn();

    render(<SessionItem session={session} onMarkRead={onMarkRead} />);

    expect(screen.getByText('Mark as Read')).toBeInTheDocument();
  });

  it('should hide button when already read', () => {
    const session = { ...mockSession, isRead: true };
    const onMarkRead = vi.fn();

    render(<SessionItem session={session} onMarkRead={onMarkRead} />);

    expect(screen.queryByText('Mark as Read')).not.toBeInTheDocument();
  });

  it('should call onMarkRead when button clicked', async () => {
    const session = { ...mockSession, isRead: false };
    const onMarkRead = vi.fn();

    render(<SessionItem session={session} onMarkRead={onMarkRead} />);

    await userEvent.click(screen.getByText('Mark as Read'));
    expect(onMarkRead).toHaveBeenCalledWith(session.id);
  });
});
```

#### 5. Verify Everything

```bash
# Type check
pnpm type-check

# Lint
pnpm lint --fix

# Test
pnpm test

# E2E (optional)
pnpm test:pw
```

#### 6. Update Documentation

Update relevant docs:
- [API_REFERENCE.md](./api/API_REFERENCE.md) — Add new endpoint
- [FRONTEND_IMPLEMENTATION_STATUS.md](./status/FRONTEND_IMPLEMENTATION_STATUS.md) — Mark feature as done
- [IMPLEMENTATION_STATUS.md](./status/IMPLEMENTATION_STATUS.md) — Mark API as done

#### 7. Commit

```bash
git add .
git commit -m "feat(sessions): add mark-as-read functionality

Add isRead field to Session type.
Add PUT /api/sessions/:id/read backend endpoint.
Add SessionItem mark-as-read button with loading state.

Includes full test coverage for backend and frontend.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

git push origin feat/session-mark-read
```

---

## Testing Requirements

**All contributions must include tests.**

### Unit Tests Required

- New functions → Unit tests
- New components → Component tests
- New hooks → Hook tests
- Bug fixes → Regression test

### Coverage Minimums

| Change Type | Min Coverage |
|-------------|--------------|
| New feature | 80% |
| Bug fix | 100% |
| Refactor | 90% |
| Docs | N/A |

### Running Tests Before PR

```bash
# Unit tests
pnpm test

# Type check
pnpm type-check

# Lint
pnpm lint

# E2E tests (if UI changes)
pnpm test:pw

# Coverage report
pnpm test -- --coverage
```

All must pass before opening PR.

---

## Documentation Standards

### Code Comments

Document the "why" not the "what":

```typescript
// ✅ Good: Explains intent and edge case
// Retry with exponential backoff to avoid overwhelming server
// Stop after 5 attempts to prevent infinite loops
const MAX_RETRIES = 5;
let retries = 0;
let delay = 1000; // Start at 1 second

// ❌ Bad: Obvious from code
// Set retries to 0
let retries = 0;
```

### README Files

Each package should have a `README.md`:

```markdown
# Package Name

One-line description.

## Purpose

What this package does and why it exists.

## Installation

pnpm install @afw/package-name

## Usage

Quick example of how to use.

## API

Brief overview of main exports.

## Testing

How to test this package.

## Contributing

Any special guidelines for this package.
```

### API Documentation

Document all public endpoints:

```typescript
/**
 * Create a new session
 *
 * POST /api/sessions
 *
 * @param {string} userId - ID of the user creating the session
 * @param {string} name - Display name for the session
 * @returns {Session} Created session object
 * @throws {400} If userId or name is missing
 * @throws {409} If session with same name exists
 *
 * @example
 * POST /api/sessions
 * { "userId": "user-123", "name": "My Session" }
 *
 * 201 Created
 * { "id": "session-456", "userId": "user-123", "name": "My Session" }
 */
router.post('/', async (req, res) => {
  // ...
});
```

### Changelog

Update `CHANGELOG.md` for each release:

```markdown
## [1.2.0] - 2026-02-12

### Added
- New mark-as-read feature for sessions
- Session activity timestamps

### Fixed
- WebSocket connection timeout on slow networks
- Memory leak in session cleanup

### Changed
- Improved session list performance
```

---

## Pull Request Process

### 1. Open PR

```bash
git push origin feat/my-feature
```

Go to GitHub and create PR.

### 2. PR Title & Description

**Title Format:**
```
<type>: <description>
```

Examples:
- `feat: add session mark-as-read`
- `fix: prevent websocket reconnect loop`
- `docs: update installation guide`

**Description Template:**

```markdown
## Description
Brief description of what this PR does.

## Type
- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentation
- [ ] Performance

## Changes
- Change 1
- Change 2
- Change 3

## Testing
Explain how to test this change:
1. Run `pnpm test`
2. Check X feature works in UI
3. Verify WebSocket connection

## Checklist
- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] New tests added
- [ ] Documentation updated
- [ ] No breaking changes (or noted)

## Related Issues
Fixes #123
Related to #456
```

### 3. PR Review

Maintainers will:
- Check code style
- Verify tests pass
- Review logic and design
- Suggest improvements

Address feedback by:
1. Making requested changes
2. Committing with clear messages
3. Replying to comments
4. Pushing updates (auto-updates PR)

### 4. Approval & Merge

Once approved:
1. PR is merged to master
2. CI/CD pipeline runs full tests
3. Deployment happens automatically (if configured)

---

## Release Process

### Versioning

Use **Semantic Versioning**: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (v1.0.0 → v2.0.0)
- **MINOR**: New features, backward compatible (v1.0.0 → v1.1.0)
- **PATCH**: Bug fixes, backward compatible (v1.0.0 → v1.0.1)

### Release Steps

1. **Update version**

```bash
# In root package.json and packages/*/package.json
{
  "version": "1.2.0"
}
```

2. **Update CHANGELOG.md**

List all changes since last release.

3. **Commit & Tag**

```bash
git add .
git commit -m "chore: bump version to 1.2.0"

git tag -a v1.2.0 -m "Version 1.2.0

## Features
- Add session mark-as-read

## Fixes
- Fix WebSocket timeout

## Documentation
- Update installation guide"

git push origin master
git push origin v1.2.0
```

4. **Create Release on GitHub**

1. Go to Releases → Create New Release
2. Select tag `v1.2.0`
3. Add release notes (copy from CHANGELOG)
4. Publish

5. **Optional: Publish to npm**

```bash
# If packages are public on npm
npm publish
```

---

## Code Review Checklist

When reviewing PRs, check:

### Functionality
- [ ] Feature works as described
- [ ] No regressions in existing features
- [ ] Edge cases handled
- [ ] Error handling present

### Code Quality
- [ ] Follows style guide
- [ ] No duplication
- [ ] Clear variable/function names
- [ ] Complex logic documented

### Testing
- [ ] All tests pass
- [ ] New tests added
- [ ] Coverage is adequate
- [ ] Tests are clear and maintainable

### Performance
- [ ] No obvious performance issues
- [ ] No memory leaks
- [ ] Database queries optimized

### Security
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] No SQL injection risks
- [ ] Authentication/authorization correct

### Documentation
- [ ] Code is documented (complex logic)
- [ ] API docs updated
- [ ] README updated (if relevant)
- [ ] CHANGELOG updated

### Git
- [ ] Commits have clear messages
- [ ] Commits are logical chunks
- [ ] No merge commits (rebase instead)
- [ ] Branch is up to date with master

---

## Summary

Contributing to ActionFlows Dashboard:

1. **Fork** the repo
2. **Create branch** with conventional name (`feat/`, `fix/`, etc.)
3. **Make changes** following code style
4. **Write tests** for all changes
5. **Update docs** (API, README, CHANGELOG)
6. **Commit** with clear, conventional messages
7. **Open PR** with template
8. **Address feedback** from review
9. **Merge** once approved

**Key principles:**
- Type-safe TypeScript everywhere
- Test coverage required
- Clear commit messages
- Document your changes
- Assume readers are learning the codebase

For more help:
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) — Setup & dev workflows
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) — Testing patterns
- [API_REFERENCE.md](./api/API_REFERENCE.md) — API docs
- Issues/Discussions — Ask questions

Happy contributing!
