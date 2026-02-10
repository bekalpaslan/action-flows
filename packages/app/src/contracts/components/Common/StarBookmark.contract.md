# Component Contract: StarBookmark

**File:** `packages/app/src/components/StarBookmark/StarBookmark.tsx`
**Type:** widget
**Parent Group:** Common
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** StarBookmark
- **Introduced:** 2025-11-01
- **Description:** Star icon button for bookmarking Claude responses with dialog for categorization and explanation

---

## Render Location

**Mounts Under:**
- ChatPanel message items
- Response content sections

**Render Conditions:**
1. Always renders

**Positioning:** inline-block
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Parent message component renders

**Key Effects:**
None — API calls triggered by user actions

**Cleanup Actions:**
None

**Unmount Triggers:**
- Message component unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| sessionId | SessionId | ✅ | N/A | Session containing this message |
| messageIndex | number | ✅ | N/A | Index of message in conversation |
| messageContent | string | ✅ | N/A | Message content to bookmark |
| messageTimestamp | Timestamp | ✅ | N/A | Message timestamp |
| isBookmarked | boolean | ❌ | false | Whether message is already bookmarked |
| onBookmark | (bookmarkId: string) => void | ❌ | undefined | Callback when bookmark created |
| onUnbookmark | () => void | ❌ | undefined | Callback when bookmark removed |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onBookmark | `(bookmarkId: string) => void` | Called when bookmark created successfully |
| onUnbookmark | `() => void` | Called when bookmark removed successfully |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| handleBookmarkCreate | `(category, explanation, tags) => void` | StarBookmarkDialog | Creates bookmark with metadata |
| onCancel | `() => void` | StarBookmarkDialog | Closes dialog without creating bookmark |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| isDialogOpen | boolean | false | handleClick, handleBookmarkCreate |
| starred | boolean | isBookmarked prop | handleBookmarkCreate, handleUnbookmark |
| isLoading | boolean | false | API call start/end |
| bookmarkId | string \| null | null | handleBookmarkCreate response |

### Context Consumption
N/A

### Derived State
N/A

### Custom Hooks
None

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls onBookmark(id) when bookmark created, onUnbookmark() when removed
- **Example:** `onBookmark?.(data.id)` after successful API POST

### Child Communication
- **Child:** StarBookmarkDialog
- **Mechanism:** props
- **Data Flow:** Passes messageContent, onSubmit, onCancel, isLoading

### Sibling Communication
N/A

### Context Interaction
N/A

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| `/api/bookmarks` | POST | handleBookmarkCreate | Sets bookmarkId, starred=true, closes dialog |
| `/api/bookmarks/:id` | DELETE | handleUnbookmark | Sets starred=false, bookmarkId=null |

### WebSocket Events
N/A

### Timers
N/A

### LocalStorage Operations
N/A

### DOM Manipulation
N/A

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
- `.star-bookmark`
- `.starred` (applied when bookmarked)
- `.loading` (applied during API call)

**Data Test IDs:**
N/A

**ARIA Labels:**
- `aria-label="Bookmark this response"` when not starred
- `aria-label="Remove bookmark"` when starred
- `title="Bookmark this response"` or `title="Remove bookmark"`

**Visual Landmarks:**
1. Star icon — ☆ (empty) when not bookmarked, ★ (filled) when bookmarked
2. Loading state — applies `.loading` class during API calls

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-SB-01: Button Renders
- **Type:** render
- **Target:** Star button
- **Condition:** `.star-bookmark` exists
- **Failure Mode:** Button not visible
- **Automation Script:**
```javascript
// Chrome MCP script
const button = await page.$('.star-bookmark');
console.assert(button !== null, 'Star bookmark button not rendered');
const icon = await button.evaluate(el => el.textContent);
console.assert(icon === '☆' || icon === '★', 'Invalid star icon');
```

#### HC-SB-02: Click Opens Dialog
- **Type:** interaction
- **Target:** Button click → dialog open
- **Condition:** Clicking unstarred button opens StarBookmarkDialog
- **Failure Mode:** Dialog does not appear
- **Automation Script:**
```javascript
// Chrome MCP script
const button = await page.$('.star-bookmark');
const isStarred = await button.$eval('.starred', () => true).catch(() => false);
if (!isStarred) {
  await button.click();
  const dialog = await page.waitForSelector('.star-bookmark-dialog', { timeout: 500 });
  console.assert(dialog !== null, 'Bookmark dialog did not open');
}
```

#### HC-SB-03: Unbookmark Flow
- **Type:** workflow
- **Target:** Click starred button → API DELETE → update state
- **Condition:** Bookmark removed successfully
- **Failure Mode:** Bookmark persists after click

### Warning Checks (Should Pass)

#### HC-SB-04: Loading State Disables Button
- **Type:** interaction
- **Target:** Button disabled during API call
- **Condition:** Button has `disabled` attribute when isLoading=true
- **Failure Mode:** Multiple API calls triggered

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| api-response-time | 500 | ms | Time for bookmark API calls |
| dialog-open-time | 100 | ms | Time to render dialog |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
None

**Child Components:**
- StarBookmarkDialog

**Required Props:**
- `sessionId`
- `messageIndex`
- `messageContent`
- `messageTimestamp`

---

## Notes

- Two-state button: unstarred (☆) and starred (★)
- Clicking unstarred button opens dialog for categorization
- Clicking starred button immediately calls DELETE API (no confirmation)
- BookmarkId tracked locally after creation for deletion
- isLoading state disables button during API calls
- Dialog requires category, explanation, and tags inputs
- API endpoints use BACKEND_URL environment variable
- Error handling logs to console (no user-facing error messages)
- onBookmark/onUnbookmark callbacks optional (parent can ignore)

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
