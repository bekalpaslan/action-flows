# Component Contract: SettingsStar

**File:** `packages/app/src/components/Stars/SettingsStar.tsx`
**Type:** page
**Parent Group:** Stars
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** SettingsStar
- **Introduced:** 2026-01-25
- **Description:** Configuration UI for ActionFlows Dashboard settings. Organized into sections: General, Appearance, Keyboard, Advanced. Auto-saves to localStorage.

---

## Render Location

**Mounts Under:**
- WorkbenchLayout (when `activeWorkbench === 'settings'`)

**Render Conditions:**
1. User selects "Settings" tab in TopBar

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- User navigates to Settings workbench

**Key Effects:**
1. **Dependencies:** `[settings, hasChanges]`
   - **Side Effects:** Auto-saves settings to localStorage when changes occur
   - **Cleanup:** Clears save message timer
   - **Condition:** Runs when settings change and hasChanges is true

**Cleanup Actions:**
- Clears save message timeout

**Unmount Triggers:**
- User switches workbenches

---

## Props Contract

### Inputs
None - Settings loaded from localStorage

### Callbacks Up (to parent)
None

### Callbacks Down (to children)
None (uses primitive form elements)

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| activeSection | `'general' \| 'appearance' \| 'keyboard' \| 'advanced'` | `'general'` | setActiveSection |
| settings | `SettingsState` | Loaded from localStorage | updateSetting |
| hasChanges | `boolean` | `false` | setHasChanges |
| saveMessage | `string \| null` | `null` | setSaveMessage |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| ThemeContext | `theme`, `setTheme`, `resolvedTheme` |
| VimNavigationContext | `isEnabled`, `setIsEnabled` |
| DiscussContext | `prefillChatInput()` |

### Derived State
N/A

### Custom Hooks
- `useTheme()` — Accesses theme state
- `useVimContext()` — Accesses vim mode state
- `useDiscussButton()` — Manages DiscussButton dialog

---

## Interactions

### Parent Communication
N/A

### Child Communication
N/A

### Sibling Communication
N/A

### Context Interaction
- **Context:** ThemeContext
- **Role:** consumer
- **Operations:** Reads and updates theme setting
- **Context:** VimNavigationContext
- **Role:** consumer
- **Operations:** Reads and updates Vim mode enabled state

---

## Side Effects

### API Calls
N/A

### WebSocket Events
N/A

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| timeout | 2000ms | Clear save message | ✅ |

### LocalStorage Operations
| Key | Operation | Trigger | Value |
|-----|-----------|---------|-------|
| `actionflows:settings` | write | Settings change | JSON stringified SettingsState |
| `actionflows:settings` | read | Component mount | SettingsState |
| `afw-debug` | write | Debug toggle | `'true' \| 'false'` |
| `afw-debug` | read | Debug checkbox render | boolean |

### DOM Manipulation
N/A

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
- `.settings-workbench`
- `.settings-nav`
- `.settings-nav__item`
- `.settings-nav__item--active`
- `.settings-section`
- `.settings-item`
- `.settings-input`
- `.settings-toggle`
- `.settings-select`
- `.settings-theme-buttons`
- `.settings-shortcuts`

**Data Test IDs:**
N/A

**ARIA Labels:**
N/A

**Visual Landmarks:**
1. Sidebar navigation (`.settings-nav`) — 4 sections (General, Appearance, Keyboard, Advanced)
2. Settings sections (`.settings-section`) — Form groups for each section
3. Save message (`.settings-workbench__save-message`) — Shows "Settings saved" after changes

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-SW-001: Settings Load from localStorage
- **Type:** initialization
- **Target:** localStorage `actionflows:settings`
- **Condition:** Settings loaded on mount
- **Failure Mode:** Defaults used instead of saved settings
- **Automation Script:**
```javascript
localStorage.setItem('actionflows:settings', JSON.stringify({ fontSize: 16 }));
// Reload component
const fontSizeEl = document.querySelector('.settings-number-value');
return fontSizeEl?.textContent === '16px';
```

#### HC-SW-002: Settings Save to localStorage
- **Type:** state-persistence
- **Target:** localStorage `actionflows:settings`
- **Condition:** Changes auto-save within 2s
- **Failure Mode:** Settings lost on refresh
- **Automation Script:**
```javascript
const input = document.querySelector('.settings-input');
input.value = 'http://localhost:4000';
input.dispatchEvent(new Event('change', { bubbles: true }));
await new Promise(resolve => setTimeout(resolve, 2100));
const saved = JSON.parse(localStorage.getItem('actionflows:settings'));
return saved.backendUrl === 'http://localhost:4000';
```

#### HC-SW-003: Theme Toggle Works
- **Type:** context-integration
- **Target:** Theme buttons
- **Condition:** Clicking theme button updates theme
- **Failure Mode:** Can't change theme
- **Automation Script:**
```javascript
const darkBtn = Array.from(document.querySelectorAll('.settings-theme-btn'))
  .find(btn => btn.textContent.includes('Dark'));
darkBtn.click();
await new Promise(resolve => setTimeout(resolve, 100));
const theme = document.documentElement.getAttribute('data-theme');
return theme === 'dark';
```

#### HC-SW-004: Section Navigation Works
- **Type:** user-action
- **Target:** Sidebar navigation buttons
- **Condition:** Clicking section shows corresponding content
- **Failure Mode:** Can't navigate settings
- **Automation Script:**
```javascript
const appearanceBtn = Array.from(document.querySelectorAll('.settings-nav__item'))
  .find(btn => btn.textContent.includes('Appearance'));
appearanceBtn.click();
await new Promise(resolve => setTimeout(resolve, 100));
const section = document.querySelector('.settings-section h2');
return section?.textContent === 'Appearance';
```

### Warning Checks (Should Pass)

#### HC-SW-005: Reset to Defaults Works
- **Type:** user-action
- **Target:** Reset button in Advanced section
- **Condition:** Button resets all settings to defaults
- **Failure Mode:** Can't reset settings

#### HC-SW-006: Keyboard Shortcuts Display
- **Type:** render
- **Target:** Keyboard section
- **Condition:** Shortcuts grouped by category and displayed
- **Failure Mode:** No shortcut reference

---

## Dependencies

**Required Contexts:**
- ThemeContext (for theme management)
- VimNavigationContext (for Vim mode)
- DiscussContext (for DiscussButton)

**Required Hooks:**
- useTheme
- useVimContext
- useDiscussButton

**Child Components:**
- DiscussButton
- DiscussDialog

**Required Props:**
None

---

## Notes

- Settings persist to localStorage key: `actionflows:settings`
- Auto-save delay: 2s after last change
- Default settings defined in `DEFAULT_SETTINGS` constant
- Theme integration: Changes sync to ThemeContext
- Vim mode integration: Changes sync to VimNavigationContext
- Keyboard shortcuts are read-only (cannot be customized)
- Advanced section includes: Reset, Clear localStorage, Version display, Debug mode toggle

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
