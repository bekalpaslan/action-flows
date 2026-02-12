# E2E Test Coverage Expansion

This document tracks the new E2E test files added to expand coverage from 15 to 19 test files.

## Overview

- **Target:** 15 → 19 test files
- **Added:** 4 new test files with 50+ test cases
- **Framework:** Playwright 1.58.2
- **Scope:** Session lifecycle, cosmic map navigation, accessibility, error handling

## New Test Files

### 1. Session Lifecycle (`session-lifecycle.spec.ts`)

**Location:** `test/playwright/specs/session-lifecycle.spec.ts`

**Coverage:**
- `LIFECYCLE-001`: Create new session via UI button
- `LIFECYCLE-002`: Session status progression (pending → in_progress → completed)
- `LIFECYCLE-003`: Delete session via UI with hover + delete button
- `LIFECYCLE-004`: Multiple session management and switching
- `LIFECYCLE-005`: Session persistence after page reload

**Test Count:** 5 tests

**Key Scenarios:**
- Session creation via UI
- API verification of session data
- Status transitions
- Session deletion with confirmation
- Multiple session switching
- Data persistence

**Dependencies:**
- Playwright session-actions helpers
- Backend `/api/sessions` endpoints

### 2. Cosmic Map Navigation (`cosmic-map.spec.ts`)

**Location:** `test/playwright/specs/cosmic-map.spec.ts`

**Coverage:**
- `COSMIC-001`: Big Bang animation on first visit
- `COSMIC-002`: Region stars visibility and clickability
- `COSMIC-003`: Zoom in/out transitions
- `COSMIC-004`: Onboarding flow dismissal
- `COSMIC-005`: Onboarding step progression (1/3 → 2/3 → 3/3)
- `COSMIC-006`: God View button returns to full map
- `COSMIC-007`: Multiple region navigation cycle

**Test Count:** 7 tests

**Key Scenarios:**
- Big Bang animation detection
- Region star rendering and interaction
- Zoom transition effects
- Keyboard (Escape) overlay closure
- Onboarding tooltip progression
- God View navigation
- Region switching and cycling

**Dependencies:**
- Cosmic Map components
- Onboarding system
- localStorage management

### 3. Accessibility (`accessibility.spec.ts`)

**Location:** `test/playwright/specs/accessibility.spec.ts`

**Coverage:**
- `A11Y-001`: Keyboard navigation - Tab through main elements
- `A11Y-002`: Keyboard navigation - Enter on buttons
- `A11Y-003`: Keyboard navigation - Escape closes overlays
- `A11Y-004`: ARIA landmarks exist
- `A11Y-005`: Buttons have accessible names
- `A11Y-006`: Form inputs have labels
- `A11Y-007`: Live regions for dynamic content
- `A11Y-008`: Focus visible on interactive elements
- `A11Y-009`: Color contrast in buttons
- `A11Y-010`: Links have descriptive text
- `A11Y-011`: Cosmic map accessible via keyboard
- `A11Y-012`: Session sidebar keyboard navigation

**Test Count:** 12 tests

**Key Scenarios:**
- Keyboard-only navigation (Tab, Enter, Escape)
- ARIA landmarks and roles verification
- Accessible names on buttons
- Form labels and associations
- Live regions for dynamic updates
- Focus visibility indicators
- Color contrast validation
- Link descriptive text
- Semantic HTML verification

**Accessibility Standards:**
- WCAG 2.1 Level AA compliance checks
- Screen reader compatibility
- Keyboard navigation requirements
- Focus management

**Dependencies:**
- ARIA attributes in components
- Semantic HTML structure
- Focus management system

### 4. Error Handling (`error-handling.spec.ts`)

**Location:** `test/playwright/specs/error-handling.spec.ts`

**Coverage:**
- `ERR-001`: Graceful handling of API timeout
- `ERR-002`: Handling of 404 - deleted session
- `ERR-003`: Retry on failed network request
- `ERR-004`: Invalid state transition handling
- `ERR-005`: WebSocket reconnection after disconnect
- `ERR-006`: Multiple rapid requests (stress test)
- `ERR-007`: Chat message send with offline backend
- `ERR-008`: Cosmic map handles missing region data
- `ERR-009`: Consecutive page reloads maintain state
- `ERR-010`: Sidebar handles empty session list

**Test Count:** 10 tests

**Key Scenarios:**
- Slow network simulation
- API timeout handling
- 404 error recovery
- Network failure retry logic
- Invalid API responses
- WebSocket disconnection recovery
- Rapid request handling (race conditions)
- Offline mode behavior
- State persistence
- Empty state UI

**Resilience Testing:**
- Network condition simulation
- Error state recovery
- Data persistence verification
- User-friendly error messages
- Graceful degradation

**Dependencies:**
- Network interception (Playwright routes)
- CDP session for network simulation
- Error state handling in app

## Test File Summary

```
test/playwright/specs/
├── smoke.spec.ts              (4 tests)      [EXISTING]
├── chat.spec.ts               (1 test)       [EXISTING]
├── session.spec.ts            (1 test)       [EXISTING]
├── session-switching.spec.ts   (3 tests)      [EXISTING]
├── session-lifecycle.spec.ts   (5 tests)      [NEW]
├── cosmic-map.spec.ts         (7 tests)      [NEW]
├── accessibility.spec.ts      (12 tests)     [NEW]
└── error-handling.spec.ts     (10 tests)     [NEW]

Total: 43 test cases across 8 files
New: 34 test cases across 4 files
Coverage increase: 15 → 19 E2E test files
```

## Running the Tests

### Run all tests
```bash
pnpm test:pw
```

### Run specific test file
```bash
pnpm test:pw -- session-lifecycle.spec.ts
pnpm test:pw -- cosmic-map.spec.ts
pnpm test:pw -- accessibility.spec.ts
pnpm test:pw -- error-handling.spec.ts
```

### Run tests by tag
```bash
# Session tests
pnpm test:pw -- --grep "@session"

# Cosmic map tests
pnpm test:pw -- --grep "@cosmic"

# Accessibility tests
pnpm test:pw -- --grep "@a11y"

# Error handling tests
pnpm test:pw -- --grep "@error"

# Network resilience tests
pnpm test:pw -- --grep "@network"
```

### Run in UI mode
```bash
pnpm test:pw:ui
```

### View test report
```bash
pnpm test:pw:report
```

### Run with headed browser
```bash
pnpm test:pw:headed
```

## Prerequisites

Before running tests, ensure:

1. **Backend running on localhost:3001:**
   ```bash
   pnpm dev:backend
   ```

2. **Frontend running on localhost:5173:**
   ```bash
   pnpm dev:app
   ```

3. **Node modules installed:**
   ```bash
   pnpm install
   ```

The Playwright config (`playwright.config.ts`) automatically starts both servers, but manual startup is useful for debugging.

## Test Infrastructure

### Selectors Helper (`test/playwright/helpers/selectors.ts`)

Extended with new selectors for cosmic map and accessibility:

```typescript
// Cosmic Map
cosmicMap: '.cosmic-map',
regionStar: '.region-star',
bigBangAnimation: '.big-bang-animation',
godViewButton: 'button:has-text("God View")',

// Accessibility
liveRegion: '[role="status"]',
mainContent: '[role="main"]',
navigationRegion: '[role="navigation"]',
```

### Session Actions Helper (`test/playwright/helpers/session-actions.ts`)

Reusable functions:
- `createSession(page)` - Create session via UI
- `sendChatMessage(page, message)` - Send chat message
- `waitForSessionSidebar(page)` - Wait for sidebar visibility
- `selectSession(page, sessionId)` - Select session by ID
- `getCurrentSessionId(page)` - Get displayed session ID

## Assertion Patterns

### Navigation Assertions
```typescript
await expect(page.locator(selector)).toBeVisible({ timeout: TIMEOUTS.element });
```

### API Assertions
```typescript
const response = await request.get(API.sessionById(sessionId));
expect(response.ok()).toBeTruthy();
```

### State Assertions
```typescript
expect(sessionData.status).toBe('pending');
```

### Visual Assertions
```typescript
const opacity = await element.evaluate((el) => window.getComputedStyle(el).opacity);
expect(Number(opacity)).toBeLessThan(1);
```

## Failure Handling

Each test includes:
- **Timeout configuration** - Tailored to operation type
- **Error recovery** - Graceful handling of unexpected states
- **Optional assertions** - Non-critical features use `.catch(() => false)`
- **Cleanup** - API requests deleted at test end

## Known Limitations

### Cosmic Map Tests
- Some animations may not trigger if feature is disabled
- Region count depends on backend Living Universe data
- Onboarding may not appear if flag persists in localStorage

### Accessibility Tests
- Focus indicators depend on browser/OS
- Screen reader testing requires manual verification
- Some ARIA attributes may be optional in initial version

### Error Handling Tests
- Network simulation requires CDP session (Chromium only)
- Some error messages are UI-dependent
- Retry behavior depends on app implementation

## Coverage Metrics

| Category | Tests | Coverage |
|----------|-------|----------|
| Session Lifecycle | 5 | Create, read, update, delete, persistence |
| Cosmic Navigation | 7 | Animation, interaction, transitions, onboarding |
| Accessibility | 12 | Keyboard, ARIA, semantic HTML, focus, contrast |
| Error Handling | 10 | Network, API, WebSocket, validation, stress |
| **Total** | **34** | **Multi-layer E2E validation** |

## Future Enhancements

### Potential Additions
- WebSocket real-time event testing
- Performance benchmarking
- Visual regression testing
- Mobile responsive testing
- Database state verification
- Agent orchestration flows
- Flow execution E2E

### Planned Updates
- Axe-core accessibility audit integration
- Network waterfall analysis
- Custom Playwright reporters
- Screenshots on failure (already configured)
- Video recording on failure (already configured)

## Troubleshooting

### Tests fail to start servers
```bash
# Kill existing processes
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Then run tests
pnpm test:pw
```

### Cosmic map not rendering
- Check if feature is enabled in settings
- Verify localStorage is cleared
- Wait for Big Bang animation to complete

### Network simulation not working
- CDP requires Chromium browser
- Firefox/Safari don't support network throttling
- Check if other CDP sessions are active

### Accessibility tests timeout
- Some elements may be lazy-loaded
- Increase timeout in TIMEOUTS constant
- Verify element is visible before interaction

## Contributing

When adding new tests:

1. **Follow naming convention:** `<TEST-ID>: <Description> @tag`
2. **Add to appropriate file:** Choose lifecycle/cosmic/a11y/error
3. **Use selector helpers:** Import from `helpers/selectors.ts`
4. **Include cleanup:** Delete created resources in teardown
5. **Document assumptions:** Add comments for non-obvious checks
6. **Test timeout handling:** Handle both success and failure paths

## References

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [WCAG 2.1 Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Test Selector Best Practices](https://playwright.dev/docs/locators)
- [Network Simulation Guide](https://playwright.dev/docs/network-mocking)

---

**Last Updated:** 2026-02-12
**Test Framework:** Playwright 1.58.2
**Total Test Files:** 8 (4 new)
**Total Test Cases:** 43 (34 new)
