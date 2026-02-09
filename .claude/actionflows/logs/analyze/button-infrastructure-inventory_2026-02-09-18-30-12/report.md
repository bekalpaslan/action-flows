# Button Infrastructure Inventory

**Aspect:** inventory
**Scope:** packages/app/src/components/, packages/shared/src/
**Date:** 2026-02-09
**Agent:** analyze/

---

## 1. Executive Summary

The ActionFlows Dashboard has a **comprehensive button infrastructure** built across Phases 1-4 of the Self-Evolving UI system. The infrastructure supports dynamic button registration, context-aware display, pattern detection, and usage tracking. The system is **fully typed** with branded identifiers and **ready to be extended** with a Custom Prompt Button feature.

**Key Finding:** QuickActionDefinition already exists and is similar to what we need for custom prompts. The Custom Prompt Button can be implemented as a new registry entry type that wraps or extends this existing infrastructure.

---

## 2. Type System (packages/shared/src/)

### 2.1 Core Button Types (buttonTypes.ts)

| Type | Purpose | Fields |
|------|---------|--------|
| `ButtonId` | Branded string identifier | `string & { readonly __brand: 'ButtonId' }` |
| `ButtonActionType` | Action trigger types | `'command'`, `'api-call'`, `'quick-action'`, `'clipboard'`, `'navigate'`, `'custom'` |
| `ButtonAction` | Action payload | `type`, `commandType?`, `endpoint?`, `method?`, `target?`, `payload?` |
| `ButtonContext` | Response classification | `'code-change'`, `'error-message'`, `'analysis-report'`, `'question-prompt'`, `'file-modification'`, `'general'` |
| `ButtonDefinition` | Full button spec | `id`, `label`, `icon?`, `action`, `contexts[]`, `shortcut?`, `source`, `priority`, `enabled` |
| `ButtonState` | Execution state | `'idle'`, `'loading'`, `'success'`, `'error'` |
| `ToolbarSlot` | Toolbar position | `buttonId`, `pinned`, `position`, `usageCount`, `lastUsed` |
| `ToolbarConfig` | Toolbar settings | `maxSlots`, `slots[]`, `autoLearn`, `showUsageCount` |

**File:** `D:/ActionFlowsDashboard/packages/shared/src/buttonTypes.ts` (140 lines)

### 2.2 Registry Types (registryTypes.ts)

| Type | Purpose | Fields |
|------|---------|--------|
| `RegistryEntryId` | Branded entry ID | `string & { readonly __brand: 'RegistryEntryId' }` |
| `RegistryEntryType` | Entry categories | `'button'`, `'pattern'`, `'workflow'`, `'shortcut'`, `'modifier'`, `'pack'` |
| `RegistryEntry` | Registry record | `id`, `name`, `description`, `type`, `source`, `version`, `status`, `enabled`, `data` (discriminated union), `createdAt`, `updatedAt`, `metadata?` |
| `WorkflowDefinition` | Multi-step workflow | `name`, `steps[]` (with `actionRef`, `delayMs?`, `continueOnError?`), `trigger?` |
| `ShortcutDefinition` | Keyboard binding | `key`, `actionRef`, `contexts?`, `overridable` |
| `ModifierDefinition` | Self-modification | `description`, `targetTier`, `fileChangeTemplates[]`, `validation` |
| `BehaviorPack` | Pack bundle | `id`, `name`, `description`, `author`, `version`, `tags[]`, `compatibility`, `entries[]`, `dependencies?`, `installedAt?`, `enabled` |
| `ResolvedBehavior` | Layer resolution | `entryId`, `entry`, `effectiveSource`, `layers[]`, `conflicts[]` |

**File:** `D:/ActionFlowsDashboard/packages/shared/src/registryTypes.ts` (235 lines)

### 2.3 Pattern Types (patternTypes.ts)

| Type | Purpose | Fields |
|------|---------|--------|
| `PatternId` | Branded pattern ID | `string & { readonly __brand: 'PatternId' }` |
| `PatternType` | Pattern categories | `'frequency'`, `'sequence'`, `'temporal'`, `'error-recovery'`, `'preference'` |
| `DetectedPattern` | Pattern record | `id`, `projectId`, `patternType`, `confidence`, `description`, `actionType?`, `sequence?`, `relatedBookmarkIds[]`, `detectedAt`, `lastSeen` |
| `PatternAction` | Pattern trigger | `patternId`, `name`, `patternType`, `trigger` (minConfidence, actionSequence?, minFrequency?), `suggestedAction`, `autoTrigger` |
| `FrequencyRecord` | Usage tracking | `actionType`, `projectId?`, `userId?`, `count`, `firstSeen`, `lastSeen`, `dailyCounts` |

**File:** `D:/ActionFlowsDashboard/packages/shared/src/patternTypes.ts` (151 lines)

### 2.4 Self-Evolving Types (selfEvolvingTypes.ts)

| Type | Purpose | Fields |
|------|---------|--------|
| `BehaviorPackId` | Branded pack ID | `string & { readonly __brand: 'BehaviorPackId' }` |
| `LayerSource` | Resolution layer | `{ type: 'core' }` \| `{ type: 'pack'; packId }` \| `{ type: 'project'; projectId }` |

**File:** `D:/ActionFlowsDashboard/packages/shared/src/selfEvolvingTypes.ts` (21 lines)

### 2.5 Quick Action Types (sessionWindows.ts)

| Type | Purpose | Fields |
|------|---------|--------|
| `QuickActionDefinition` | Quick action button | `id`, `label`, `icon`, `value`, `contextPatterns?`, `alwaysShow?` |
| `QuickActionPreset` | Preset collection | `id`, `name`, `description`, `actions[]` |

**File:** `D:/ActionFlowsDashboard/packages/shared/src/sessionWindows.ts` (lines 68-103)

**Key Insight:** `QuickActionDefinition` is essentially a lightweight custom prompt button (label + value). The Custom Prompt Button feature can reuse or extend this structure.

---

## 3. Frontend Components (packages/app/src/components/)

### 3.1 InlineButtons System

| Component | Purpose | Props | File |
|-----------|---------|-------|------|
| `InlineButtons` | Button row renderer | `messageContent`, `sessionId`, `buttons[]`, `overrideContext?`, `onAction?` | `InlineButtons/InlineButtons.tsx` (76 lines) |
| `InlineButtonItem` | Individual button | `button`, `sessionId`, `projectId?`, `onAction?` | `InlineButtons/InlineButtonItem.tsx` (176 lines) |

**Features:**
- Auto-detects context from message content
- Filters buttons by matching `ButtonContext`
- Sorts by priority (lower = higher)
- State management (idle, loading, success, error)
- Icon rendering (emoji or SVG)
- Usage tracking via `useButtonActions` hook

**Files:**
- `D:/ActionFlowsDashboard/packages/app/src/components/InlineButtons/InlineButtons.tsx`
- `D:/ActionFlowsDashboard/packages/app/src/components/InlineButtons/InlineButtonItem.tsx`
- `D:/ActionFlowsDashboard/packages/app/src/components/InlineButtons/InlineButtons.css`

### 3.2 QuickActionBar System

| Component | Purpose | Props | File |
|-----------|---------|-------|------|
| `QuickActionBar` | Bottom action bar | `sessionId`, `lifecycleState`, `quickActions[]`, `onActionClick`, `onManualInput`, `lastOutput?`, `disabled?` | `QuickActionBar/QuickActionBar.tsx` (140 lines) |
| `QuickActionButton` | Quick action button | `label`, `icon`, `value`, `onClick`, `disabled?` | `QuickActionBar/QuickActionButton.tsx` (116 lines) |

**Features:**
- Context-aware filtering via regex patterns
- Manual input field
- Pulse animation on waiting-for-input state
- Pre-compiled regex patterns (performance optimization)

**Files:**
- `D:/ActionFlowsDashboard/packages/app/src/components/QuickActionBar/QuickActionBar.tsx`
- `D:/ActionFlowsDashboard/packages/app/src/components/QuickActionBar/QuickActionButton.tsx`
- `D:/ActionFlowsDashboard/packages/app/src/components/QuickActionBar/QuickActionBar.css`

### 3.3 RegistryBrowser

| Component | Purpose | Props | File |
|-----------|---------|-------|------|
| `RegistryBrowser` | Browse/manage registry | `projectId?`, `onEntrySelect?` | `RegistryBrowser/RegistryBrowser.tsx` (384 lines) |
| `RegistryEntryCard` | Entry display card | `entry`, `onClick?`, `onToggle?` | `RegistryBrowser/RegistryEntryCard.tsx` |
| `PackCard` | Pack display card | `pack`, `onToggle?`, `onUninstall?` | `RegistryBrowser/PackCard.tsx` |

**Features:**
- Tabs: Entries / Packs
- Filters: Type, Source (core/pack/project), Enabled/Disabled, Search
- Categorized view (when "All Types" selected)
- Enable/disable entries and packs
- Install/uninstall packs

**Files:**
- `D:/ActionFlowsDashboard/packages/app/src/components/RegistryBrowser/RegistryBrowser.tsx`
- `D:/ActionFlowsDashboard/packages/app/src/components/RegistryBrowser/RegistryEntryCard.tsx`
- `D:/ActionFlowsDashboard/packages/app/src/components/RegistryBrowser/PackCard.tsx`
- `D:/ActionFlowsDashboard/packages/app/src/components/RegistryBrowser/index.ts`
- `D:/ActionFlowsDashboard/packages/app/src/components/RegistryBrowser/RegistryBrowser.css`

### 3.4 Other Button Components

| Component | Purpose | File |
|-----------|---------|------|
| `ControlButtons` | Session control buttons | `ControlButtons/ControlButtons.tsx` |
| `PersistentToolbarButton` | Toolbar button | `PersistentToolbar/PersistentToolbarButton.tsx` |

---

## 4. Frontend Utilities & Hooks

### 4.1 buttonContextDetector.ts

**Purpose:** Classifies Claude response messages to determine which buttons to show.

**Detection Rules (priority order):**

| Priority | Rule | Context | Confidence |
|----------|------|---------|------------|
| 1 | Code fence + file path | `'code-change'` | 0.9 |
| 2 | Error keywords (error, failed, exception) | `'error-message'` | 0.85 |
| 3 | File path + modification verbs (created, modified) | `'file-modification'` | 0.8 |
| 4 | Question indicators (?, "should I", "do you want") | `'question-prompt'` | 0.75 |
| 5 | Analysis keywords (analysis, summary, recommendation) | `'analysis-report'` | 0.7 |
| 6 | Fallback | `'general'` | 0.5 |

**Functions:**
- `detectContext(messageContent)` → Returns highest-confidence context
- `detectAllContexts(messageContent)` → Returns all matching contexts (sorted)

**File:** `D:/ActionFlowsDashboard/packages/app/src/utils/buttonContextDetector.ts` (217 lines)

### 4.2 useButtonActions Hook

**Purpose:** Routes button actions to appropriate handlers.

**Action Routing:**

| Action Type | Handler | Behavior |
|-------------|---------|----------|
| `'command'` | `executeCommandAction` | POST to `/api/sessions/:sessionId/commands` |
| `'api-call'` | `executeApiCallAction` | HTTP request to specified endpoint |
| `'quick-action'` | `executeQuickActionAction` | POST to `/api/sessions/:sessionId/quick-actions` |
| `'clipboard'` | `executeClipboardAction` | Copy to clipboard via `navigator.clipboard` |
| `'navigate'` | `executeNavigateAction` | Log (router integration pending) |
| `'custom'` | — | Log warning (not implemented) |

**Exports:**
- `executeAction(button)` → Executes button's action
- `trackUsage(buttonId, projectId)` → Tracks usage via `/api/toolbar/:projectId/track`

**File:** `D:/ActionFlowsDashboard/packages/app/src/hooks/useButtonActions.ts` (240 lines)

---

## 5. Backend API (packages/backend/src/routes/)

### 5.1 Registry API (registry.ts)

**Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/registry/entries` | List entries (filter: type, source, enabled, packId) |
| GET | `/api/registry/entries/:id` | Get single entry |
| POST | `/api/registry/entries` | Create entry |
| PATCH | `/api/registry/entries/:id` | Update entry |
| DELETE | `/api/registry/entries/:id` | Delete entry |
| GET | `/api/registry/packs` | List installed packs |
| POST | `/api/registry/packs` | Install pack |
| POST | `/api/registry/packs/:id/enable` | Enable pack |
| POST | `/api/registry/packs/:id/disable` | Disable pack |
| DELETE | `/api/registry/packs/:id` | Uninstall pack |
| GET | `/api/registry/resolve/:entryId` | Resolve behavior with layer precedence |
| GET | `/api/registry/conflicts/:entryId` | Get conflicts |
| GET | `/api/registry/stats` | Registry statistics |
| GET | `/api/registry/modifiers` | List modifiers (filter: status, tier) |
| GET | `/api/registry/modifiers/:id` | Get modifier |
| GET | `/api/registry/modifiers/:id/preview` | Preview modifier changes |
| POST | `/api/registry/modifiers/:id/apply` | Apply modifier (body: dryRun?, force?) |
| POST | `/api/registry/modifiers/:id/rollback` | Rollback modifier |

**File:** `D:/ActionFlowsDashboard/packages/backend/src/routes/registry.ts` (843 lines)

### 5.2 Toolbar API (toolbar.ts)

**Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/toolbar/:projectId/config` | Get toolbar config |
| PUT | `/api/toolbar/:projectId/config` | Update toolbar config |
| POST | `/api/toolbar/:projectId/track` | Track button usage |

**In-Memory Storage:**
- `toolbarConfigs: Map<ProjectId, ToolbarConfig>`

**Usage Tracking Logic:**
- Creates slot if doesn't exist
- Increments `usageCount`, updates `lastUsed`
- Auto-reorders unpinned slots by usage (if `autoLearn` enabled)
- Trims slots to `maxSlots` (keeps pinned + most used)

**File:** `D:/ActionFlowsDashboard/packages/backend/src/routes/toolbar.ts` (223 lines)

---

## 6. Existing Prompt/Macro Functionality

### 6.1 QuickActionDefinition (Already Exists!)

**Type:** `packages/shared/src/sessionWindows.ts` (lines 68-86)

```typescript
export interface QuickActionDefinition {
  id: string;              // Unique ID
  label: string;           // Display label (THIS IS THE ALIAS!)
  icon: string;            // Icon name
  value: string;           // Input value to send (THIS IS THE PROMPT PAYLOAD!)
  contextPatterns?: string[];  // Context patterns (optional)
  alwaysShow?: boolean;    // Always show (ignore context)
}
```

**Key Finding:** This is **exactly what we need** for custom prompts:
- `label` = button alias (display name)
- `value` = prompt payload (what gets sent when clicked)
- `contextPatterns` = optional context filtering
- `alwaysShow` = always visible flag

**Current Usage:**
- Used by `QuickActionBar` component
- Displayed at bottom of session tiles
- Context-aware filtering via regex patterns

### 6.2 Gap Analysis

| Feature | QuickActionDefinition | Custom Prompt Button (Needed) |
|---------|----------------------|-------------------------------|
| Display label (alias) | ✅ `label` | ✅ Same |
| Prompt payload | ✅ `value` | ✅ Same |
| Context filtering | ✅ `contextPatterns` | ✅ Can reuse |
| Always show | ✅ `alwaysShow` | ✅ Can reuse |
| Icon | ✅ `icon` | ✅ Can reuse |
| User creation UI | ❌ Missing | ⚠️ Needs dialog |
| Registry integration | ❌ Not in registry | ⚠️ Needs entry type |
| Per-project storage | ❌ Session-level only | ⚠️ Needs backend persistence |
| Inline button display | ❌ Only in QuickActionBar | ⚠️ Needs InlineButtons integration |

**Recommendation:** Extend `QuickActionDefinition` to work with the registry system rather than creating a new type from scratch.

---

## 7. Dialog/Form Patterns (for Button Creation UI)

**Sample Dialog:** `StarBookmarkDialog.tsx` (237 lines)

**Pattern Used:**
- Backdrop overlay (`<div className="star-bookmark-dialog-backdrop">`)
- Modal container (`<div className="star-bookmark-dialog">`)
- Header with title + close button
- Form with controlled inputs
- Action buttons (submit + cancel)
- Loading states (`isLoading` prop)
- Validation (disable submit until valid)

**Similar Components:**
- `ConflictDialog.tsx` (code editor conflicts)
- `ClaudeCliStartDialog.tsx` (project selection)
- `DisambiguationModal.tsx` (session selection)
- `ProjectForm.tsx` (project creation form)

**CSS Pattern:**
- Backdrop: Full-screen overlay with `rgba(0, 0, 0, 0.5)` background
- Modal: Centered card with `border-radius`, `box-shadow`, `padding`
- Form groups: Stacked with `margin-bottom`
- Buttons: Primary/secondary variants

**File:** `D:/ActionFlowsDashboard/packages/app/src/components/StarBookmark/StarBookmarkDialog.tsx`

---

## 8. Architecture Summary

### 8.1 Data Flow

```
User clicks button
  ↓
InlineButtonItem.handleClick()
  ↓
useButtonActions.executeAction(button)
  ↓
Switch on button.action.type
  ↓
POST /api/sessions/:sessionId/commands (or other endpoint)
  ↓
Backend processes action
  ↓
WebSocket event broadcasts result
```

### 8.2 Layer Resolution (Phase 3: Registry Model)

**Precedence:** Project > Pack > Core

**Example:**
- Core defines button "retry" with icon "↻"
- Pack "debugging-tools" overrides with icon "🔄"
- Project "my-project" overrides with icon "⟳"
- **Result:** Project layer wins, button shows "⟳"

**Implementation:** `layerResolver.resolve(entryId, projectId)` in `packages/backend/src/services/layerResolver.js`

### 8.3 Pattern Detection (Phase 2)

**Frequency Tracking:**
- Tracks button usage via `/api/toolbar/:projectId/track`
- Stores `usageCount` and `lastUsed` per button
- Auto-reorders toolbar slots by frequency (if `autoLearn` enabled)

**Pattern Actions:**
- Detected patterns can suggest button actions
- Stored as `RegistryEntry` with type `'pattern'`
- `PatternAction` type defines trigger conditions and suggested action

**File:** `D:/ActionFlowsDashboard/packages/shared/src/patternTypes.ts`

---

## 9. Gaps & Extension Points

### 9.1 Missing for Custom Prompt Button

| Component | Status | Action Required |
|-----------|--------|-----------------|
| Button Creation UI | ❌ Missing | Create `CreateButtonDialog.tsx` component |
| Registry entry type | ⚠️ Partial | Extend `RegistryEntry` to support custom prompts |
| Backend persistence | ⚠️ Partial | Use existing `/api/registry/entries` POST endpoint |
| InlineButtons integration | ✅ Ready | Button filtering already supports all `ButtonContext` types |
| Toolbar integration | ✅ Ready | Usage tracking already works via `/api/toolbar/:projectId/track` |

### 9.2 Recommended Approach

**Option A: Extend QuickActionDefinition**
- Create new `RegistryEntry` type `'custom-prompt'`
- Entry data wraps `QuickActionDefinition` structure
- Reuse `label` (alias) and `value` (prompt)
- Display in both `QuickActionBar` and `InlineButtons`

**Option B: Create ButtonDefinition with type 'custom-prompt'**
- Use existing `ButtonDefinition` type
- Set `action.type = 'custom-prompt'` (new action type)
- Add `action.payload.promptText` for the prompt payload
- Requires adding `'custom-prompt'` to `ButtonActionType` enum

**Recommendation:** Option A is simpler and reuses more infrastructure.

---

## 10. File Inventory

### 10.1 Shared Types (packages/shared/src/)

| File | Lines | Purpose |
|------|-------|---------|
| `buttonTypes.ts` | 140 | Button system types |
| `registryTypes.ts` | 235 | Registry and pack types |
| `patternTypes.ts` | 151 | Pattern detection types |
| `selfEvolvingTypes.ts` | 21 | Common types (LayerSource, BehaviorPackId) |
| `sessionWindows.ts` | ~40 | QuickActionDefinition (lines 68-103) |

### 10.2 Frontend Components (packages/app/src/components/)

| Component | Files | Lines | Purpose |
|-----------|-------|-------|---------|
| `InlineButtons/` | 3 | ~300 | Inline button row renderer |
| `QuickActionBar/` | 3 | ~300 | Bottom quick action bar |
| `RegistryBrowser/` | 5 | ~500 | Registry management UI |
| `StarBookmark/` | 3 | ~300 | Dialog pattern reference |

### 10.3 Frontend Utilities (packages/app/src/)

| File | Lines | Purpose |
|------|-------|---------|
| `utils/buttonContextDetector.ts` | 217 | Context classification |
| `hooks/useButtonActions.ts` | 240 | Action routing |

### 10.4 Backend Routes (packages/backend/src/routes/)

| File | Lines | Purpose |
|------|-------|---------|
| `registry.ts` | 843 | Registry CRUD + modifiers |
| `toolbar.ts` | 223 | Toolbar config + usage tracking |

**Total:** ~3,000 lines of button infrastructure code

---

## 11. Recommendations

### 11.1 For Custom Prompt Button Feature

**Phase 1: Backend Extension**
1. Add `'custom-prompt'` to `RegistryEntryType` union in `registryTypes.ts`
2. Define `CustomPromptDefinition` interface (or reuse `QuickActionDefinition`)
3. Add registry entry creation via existing POST `/api/registry/entries`

**Phase 2: Frontend Dialog**
1. Create `CreateCustomPromptDialog.tsx` (follow `StarBookmarkDialog` pattern)
2. Form fields:
   - Alias (text input) → maps to `label`
   - Prompt (textarea) → maps to `value`
   - Context (dropdown) → maps to `contexts[]`
   - Icon (text input or picker) → maps to `icon`
   - Always show (checkbox) → maps to `alwaysShow`
3. Submit via POST `/api/registry/entries`

**Phase 3: Integration**
1. Fetch custom prompt entries via GET `/api/registry/entries?type=custom-prompt`
2. Convert to `ButtonDefinition` format
3. Pass to `InlineButtons` component (already filters by context)
4. Usage tracking automatically works via `useButtonActions` hook

**Phase 4: UI Trigger**
1. Add "+ Custom Button" button to `RegistryBrowser` or toolbar
2. Open `CreateCustomPromptDialog` on click
3. Refresh registry after creation

### 11.2 Alternative: Minimal Implementation

**Simplest Path:** Reuse `QuickActionDefinition` without registry
1. Store custom prompts in project config (`quickActionPresets`)
2. Add UI to create/edit quick actions
3. Display in `QuickActionBar` (already supported)
4. Skip registry, layer resolution, and pattern detection

**Tradeoff:** Less powerful (no context filtering, no layer resolution) but faster to implement.

---

## 12. Fresh Eye Discoveries

**[FRESH EYE]** The `QuickActionDefinition` type is an **exact match** for the Custom Prompt Button requirement (alias + prompt payload). The feature is essentially "promoting QuickActions to first-class registry entries with InlineButtons integration."

**[FRESH EYE]** The `buttonContextDetector.ts` utility is **very sophisticated** with 6 detection rules and confidence scoring. Custom prompts can leverage this immediately.

**[FRESH EYE]** The toolbar usage tracking (`usageCount`, `lastUsed`) provides **ready-made analytics** for custom buttons. No additional tracking needed.

**[FRESH EYE]** The `ModifierDefinition` system (self-modification templates) is **fully implemented** in the registry API but not documented in the memory files. This is a complete Phase 4 feature.

**[FRESH EYE]** The `StarBookmarkDialog` provides a **perfect pattern** for the button creation dialog. Copy structure, replace fields, ship.

**[FRESH EYE]** The backend registry API uses **in-memory storage** for modifiers (`modifierBackups: Map`) but should probably use the Storage interface for persistence. Potential bug.

---

## Metadata

- **Total files analyzed:** 24
- **Total lines of code:** ~3,000
- **Packages covered:** @afw/shared, @afw/app (frontend), @afw/backend (API)
- **Key directories:** `packages/app/src/components/`, `packages/shared/src/`, `packages/backend/src/routes/`
- **Date:** 2026-02-09
- **Agent:** analyze/
