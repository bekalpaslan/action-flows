# Component Contract: RegistryBrowser

**File:** `packages/app/src/components/RegistryBrowser/RegistryBrowser.tsx`
**Type:** feature
**Parent Group:** Registry
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** RegistryBrowser
- **Introduced:** 2025-12-01
- **Description:** Browse, filter, and manage registry entries and behavior packs. Central UI for exploring installed buttons, patterns, workflows, and custom prompts.

---

## Render Location

**Mounts Under:**
- SettingsWorkbench (Settings tab)
- Standalone modal/dialog contexts

**Render Conditions:**
1. Component is imported and rendered by parent (`<RegistryBrowser />`)
2. No conditional rendering at mount level

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- SettingsWorkbench renders with active registry view
- User navigates to Settings tab

**Key Effects:**
1. **Dependencies:** `[projectId]`
   - **Side Effects:** HTTP GET `/api/registry/entries`, `/api/registry/packs` on mount and when projectId changes
   - **Cleanup:** None
   - **Condition:** Always runs on mount/projectId change

**Cleanup Actions:**
- None

**Unmount Triggers:**
- User navigates away from Settings tab
- Parent component unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| projectId | ProjectId | ❌ | undefined | Project ID for filtering project-scoped entries |
| onEntrySelect | (entry: RegistryEntry) => void | ❌ | undefined | Callback when user clicks an entry card |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onEntrySelect | `(entry: RegistryEntry) => void` | Called when user clicks a registry entry card |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onToggle | `(enabled: boolean) => void` | RegistryEntryCard | Toggles entry enabled state |
| onDelete | `(entryId: string) => void` | RegistryEntryCard | Deletes a custom prompt entry |
| onTogglePack | `(enabled: boolean) => void` | PackCard | Toggles pack enabled state |
| onUninstall | `() => void` | PackCard | Uninstalls a behavior pack |
| handleSend | `(message: string) => void` | DiscussDialog | Sends discuss message to chat |
| handleCreateCustomPrompt | `(label, prompt, icon?, contextPatterns?, alwaysShow?) => void` | CustomPromptDialog | Creates new custom prompt entry |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| entries | RegistryEntry[] | [] | fetchData, handleToggleEntry, handleDeleteEntry |
| packs | BehaviorPack[] | [] | fetchData, handleTogglePack |
| filter | RegistryFilter | {} | setFilter (user selection) |
| loading | boolean | true | fetchData |
| activeTab | 'entries' \| 'packs' | 'entries' | setActiveTab (user click) |
| searchQuery | string | '' | setSearchQuery (input change) |
| sourceFilter | SourceFilterType | 'all' | setSourceFilter (dropdown change) |
| enabledFilter | 'all' \| 'enabled' \| 'disabled' | 'all' | setEnabledFilter (dropdown change) |
| showCustomPromptDialog | boolean | false | setShowCustomPromptDialog (button click) |
| isCreatingPrompt | boolean | false | handleCreateCustomPrompt |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| ToastContext | showToast |
| DiscussContext | via useDiscussButton hook |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| filteredEntries | RegistryEntry[] | `[entries, filter, sourceFilter, enabledFilter, searchQuery]` | Filters entries by type, status, source, enabled state, and search query |
| categorizedEntries | Record<string, RegistryEntry[]> | `[filteredEntries]` | Groups filtered entries by type (button, pattern, workflow, etc.) |

### Custom Hooks
- `useToast()` — Toast notification context
- `useDiscussButton({ componentName, getContext })` — DiscussButton integration

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls `onEntrySelect(entry)` when user clicks an entry card
- **Example:** `onClick={() => onEntrySelect?.(entry)}`

### Child Communication
- **Child:** RegistryEntryCard
- **Mechanism:** props
- **Data Flow:** entry data, onToggle, onDelete callbacks

- **Child:** PackCard
- **Mechanism:** props
- **Data Flow:** pack data, onToggle, onUninstall callbacks

- **Child:** CustomPromptDialog
- **Mechanism:** props
- **Data Flow:** onSubmit, onCancel, isLoading

- **Child:** DiscussDialog
- **Mechanism:** props
- **Data Flow:** isOpen, componentName, componentContext, onSend, onClose

### Sibling Communication
- **Sibling:** None
- **Mechanism:** N/A
- **Description:** No direct sibling coordination

### Context Interaction
- **Context:** ToastContext
- **Role:** consumer
- **Operations:** showToast for success/error notifications

- **Context:** DiscussContext
- **Role:** consumer (via hook)
- **Operations:** Opens discuss dialog, sends formatted messages

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| `/api/registry/entries` | GET | mount, projectId change | Sets entries state |
| `/api/registry/entries?projectId=X` | GET | mount with projectId | Sets entries state (filtered) |
| `/api/registry/packs` | GET | mount, projectId change | Sets packs state |
| `/api/registry/entries` | POST | handleCreateCustomPrompt | Adds new custom prompt entry |
| `/api/registry/entries/:id` | PATCH | handleToggleEntry | Updates entry enabled state |
| `/api/registry/entries/:id` | DELETE | handleDeleteEntry | Removes entry from state |
| `/api/registry/packs/:id/enable` | POST | handleTogglePack (enable) | Updates pack enabled state |
| `/api/registry/packs/:id/disable` | POST | handleTogglePack (disable) | Updates pack enabled state |
| `/api/registry/packs/:id` | DELETE | handleUninstallPack | Removes pack from state |

### WebSocket Events
N/A — No WebSocket subscriptions

### Timers
N/A — No timers

### LocalStorage Operations
N/A — No localStorage usage

### DOM Manipulation
N/A — React-managed DOM only

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
- `.registry-browser`
- `.registry-header`
- `.registry-tabs`
- `.registry-toolbar`
- `.registry-filters`
- `.entries-content`
- `.entries-grid`
- `.entries-categorized`
- `.packs-grid`
- `.add-custom-prompt-button`
- `.search-input`

**Data Test IDs:**
N/A — No data-testid attributes

**ARIA Labels:**
- `aria-label="Delete entry"` on delete button in RegistryEntryCard

**Visual Landmarks:**
1. Tab bar with "Entries (N)" and "Packs (N)" (`.registry-tabs`) — Unique indicator for tab selection
2. "+ Custom Prompt" button (`.add-custom-prompt-button`) — Green button at top
3. Search input field (`.search-input`) — Left side of filters bar
4. Category badges (`.category-badge`) — Colored badges for button/pattern/workflow types

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-RB-01: API Endpoints Reachable
- **Type:** connection
- **Target:** Backend API /api/registry/*
- **Condition:** HTTP 200 response within 2s
- **Failure Mode:** Component shows "Loading registry..." indefinitely or error state
- **Automation Script:**
```javascript
// Chrome MCP script
const response = await fetch('http://localhost:3001/api/registry/entries');
const data = await response.json();
console.assert(response.ok, 'Registry API unreachable');
console.assert(Array.isArray(data), 'Registry API returned non-array');
```

#### HC-RB-02: Entries Render
- **Type:** render
- **Target:** Entry cards in grid
- **Condition:** At least one `.entry-card` visible when entries exist
- **Failure Mode:** Empty state shown when entries exist
- **Automation Script:**
```javascript
// Chrome MCP script
// Navigate to page first
await page.goto('http://localhost:5173');
await page.waitForSelector('.registry-browser');
const cards = await page.$$('.entry-card');
console.assert(cards.length > 0, 'No entry cards rendered');
```

#### HC-RB-03: Filter Functionality
- **Type:** interaction
- **Target:** Filter dropdowns and search input
- **Condition:** Filtering updates visible entries
- **Failure Mode:** Filter changes do not update displayed entries
- **Automation Script:**
```javascript
// Chrome MCP script
const initialCount = (await page.$$('.entry-card')).length;
await page.type('.search-input', 'test');
await page.waitForTimeout(300);
const filteredCount = (await page.$$('.entry-card')).length;
console.assert(filteredCount <= initialCount, 'Search filter not working');
```

### Warning Checks (Should Pass)

#### HC-RB-04: Custom Prompt Creation
- **Type:** workflow
- **Target:** Custom prompt dialog flow
- **Condition:** Dialog opens, accepts input, creates entry
- **Failure Mode:** Dialog does not open or submission fails
- **Automation Script:**
```javascript
// Chrome MCP script
await page.click('.add-custom-prompt-button');
await page.waitForSelector('.custom-prompt-dialog');
await page.type('#label', 'Test Prompt');
await page.type('#prompt', 'Test prompt content');
// Submit would require full E2E test
```

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| initial-load-time | 2000 | ms | Time from mount to entries rendered |
| filter-update-time | 300 | ms | Time to re-render after filter change |
| search-debounce | 0 | ms | No debounce implemented (instant filtering) |
| entry-card-count | 100 | count | Recommended max entries before pagination |

---

## Dependencies

**Required Contexts:**
- ToastContext

**Required Hooks:**
- `useToast()`
- `useDiscussButton()`

**Child Components:**
- RegistryEntryCard
- PackCard
- CustomPromptDialog
- DiscussButton
- DiscussDialog

**Required Props:**
N/A — All props are optional

---

## Notes

- Component manages its own data fetching (no parent-provided data)
- Supports two-tab view: Entries and Packs
- Custom prompts are stored as registry entries with type 'custom-prompt'
- Delete functionality only available for custom-prompt entries (source=project)
- Filter state is ephemeral (not persisted across sessions)
- Categorized view only shown when "All Types" filter is selected
- Uses BACKEND_URL environment variable for API calls
- Discuss integration provides context about current filters and visible entries

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
