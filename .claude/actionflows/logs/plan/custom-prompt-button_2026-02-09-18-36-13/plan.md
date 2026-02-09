# Implementation Plan: Custom Prompt Button Feature

## Overview

The Custom Prompt Button feature enables users to create persistent, reusable buttons through a dialog interface with two core fields: an **alias** (button display label) and a **prompt** (text payload sent when clicked). This extends the existing QuickActionDefinition structure into the registry system, providing persistence, context-aware filtering, and usage tracking. The implementation leverages the comprehensive button infrastructure built in Phases 1-4 of the Self-Evolving UI system.

**Implementation Approach:** Extend `QuickActionDefinition` as a new registry entry type (`'custom-prompt'`) and integrate with both `QuickActionBar` and `InlineButtons` display surfaces. This approach maximizes code reuse while adding registry-backed persistence.

---

## Steps

### Step 1: Extend Shared Types for Custom Prompt Registry Entry

**Package:** `@afw/shared` (packages/shared/)

**Files to Modify:**
- `packages/shared/src/registryTypes.ts` (line 35)
- `packages/shared/src/index.ts` (export new type)

**Changes:**
1. Add `'custom-prompt'` to `RegistryEntryType` union (line 35):
   ```typescript
   export type RegistryEntryType = 'button' | 'pattern' | 'workflow' | 'shortcut' | 'modifier' | 'pack' | 'custom-prompt';
   ```

2. Add `CustomPromptDefinition` interface after `ShortcutDefinition` (around line 81):
   ```typescript
   /**
    * Custom prompt button definition
    * User-created buttons with custom labels and prompt payloads
    */
   export interface CustomPromptDefinition {
     /** Display label (alias) shown on button */
     label: string;

     /** Prompt text sent when button is clicked */
     prompt: string;

     /** Optional icon (emoji or icon name) */
     icon?: string;

     /** Optional context patterns for context-aware display */
     contextPatterns?: string[];

     /** Always show (ignore context detection) */
     alwaysShow?: boolean;
   }
   ```

3. Update `RegistryEntry` discriminated union data field to include custom-prompt case (around line 150):
   ```typescript
   data:
     | { type: 'button'; buttonDef: ButtonDefinition }
     | { type: 'pattern'; patternAction: PatternAction }
     | { type: 'workflow'; workflowDef: WorkflowDefinition }
     | { type: 'shortcut'; shortcutDef: ShortcutDefinition }
     | { type: 'modifier'; modifierDef: ModifierDefinition }
     | { type: 'pack'; packId: BehaviorPackId }
     | { type: 'custom-prompt'; customPromptDef: CustomPromptDefinition };
   ```

4. Export `CustomPromptDefinition` in `packages/shared/src/index.ts`:
   ```typescript
   export type { CustomPromptDefinition } from './registryTypes.js';
   ```

**Why:** Registry types are shared across backend and frontend. This establishes the data structure contract before implementing backend storage and frontend UI.

**Depends on:** Nothing (first step in dependency chain)

---

### Step 2: Update Backend Registry Storage Schema

**Package:** `@afw/backend` (packages/backend/)

**Files to Modify:**
- `packages/backend/src/schemas/api.ts` (around line 100-200, registry entry schemas)

**Changes:**
1. Add Zod schema for `CustomPromptDefinition`:
   ```typescript
   const customPromptDefinitionSchema = z.object({
     label: z.string().min(1).max(100),
     prompt: z.string().min(1).max(2000),
     icon: z.string().optional(),
     contextPatterns: z.array(z.string()).optional(),
     alwaysShow: z.boolean().optional(),
   });
   ```

2. Update `createRegistryEntrySchema` to accept `'custom-prompt'` type and validate `customPromptDef` field:
   ```typescript
   // Add to type enum
   type: z.enum(['button', 'pattern', 'workflow', 'shortcut', 'modifier', 'pack', 'custom-prompt']),

   // Add to data discriminated union validation
   .refine(
     (data) => {
       if (data.type === 'custom-prompt') {
         return customPromptDefinitionSchema.safeParse(data.customPromptDef).success;
       }
       // ... existing type validations
     },
     { message: 'Invalid data for custom-prompt entry' }
   )
   ```

3. Update `updateRegistryEntrySchema` similarly to support partial updates of custom prompt entries.

**Why:** Backend validates all incoming registry entry creation/update requests using Zod schemas. This ensures data integrity before persisting to storage.

**Depends on:** Step 1 (shared types must be defined first)

---

### Step 3: Create Custom Prompt Button Creation Dialog Component

**Package:** `@afw/app` (packages/app/)

**Files to Create:**
- `packages/app/src/components/CustomPromptButton/CustomPromptDialog.tsx` (new)
- `packages/app/src/components/CustomPromptButton/CustomPromptDialog.css` (new)
- `packages/app/src/components/CustomPromptButton/index.ts` (new, export)

**Changes:**
1. Create `CustomPromptDialog.tsx` following the `StarBookmarkDialog` pattern:
   - Props: `onSubmit: (label, prompt, icon?, contextPatterns?, alwaysShow?) => void`, `onCancel: () => void`, `isLoading?: boolean`
   - Form fields:
     - **Alias** (text input, required, max 100 chars) — becomes `label`
     - **Prompt** (textarea, required, max 2000 chars, 6 rows) — becomes `prompt`
     - **Icon** (text input, optional, placeholder "🚀 or icon-name") — becomes `icon`
     - **Context** (dropdown, optional, multi-select from `ButtonContext` enum) — becomes `contextPatterns`
     - **Always Show** (checkbox, optional, default unchecked) — becomes `alwaysShow`
   - Submit button disabled until alias + prompt are non-empty
   - Loading state disables all inputs and shows spinner on submit button
   - Close button calls `onCancel`
   - Form submit calls `onSubmit` with all field values

2. Create `CustomPromptDialog.css` following `StarBookmark.css` structure:
   - `.custom-prompt-dialog-backdrop` — full-screen overlay, rgba(0,0,0,0.5), flex center
   - `.custom-prompt-dialog` — white card, max-width 600px, border-radius 12px, box-shadow, padding 24px
   - `.custom-prompt-dialog-header` — flex row, space-between, margin-bottom 20px
   - `.form-group` — margin-bottom 16px, stacked layout
   - `.form-label` — font-weight 600, margin-bottom 8px, color var(--text-primary)
   - `.text-input`, `.textarea-input` — border 1px solid var(--border), border-radius 8px, padding 10px, font-size 14px
   - `.textarea-input` — min-height 120px, font-family monospace (for prompt preview)
   - `.form-actions` — flex row, justify-end, gap 12px, margin-top 24px
   - `.button-primary`, `.button-secondary` — button variants with hover states

3. Create `index.ts` exporting `CustomPromptDialog`.

**Why:** Dialog provides the user interface for creating custom prompt buttons. Following the existing `StarBookmarkDialog` pattern ensures UI consistency and reuses established patterns (backdrop, modal, form validation).

**Depends on:** Step 1 (imports `CustomPromptDefinition` type from `@afw/shared`)

---

### Step 4: Add Dialog Trigger to RegistryBrowser

**Package:** `@afw/app` (packages/app/)

**Files to Modify:**
- `packages/app/src/components/RegistryBrowser/RegistryBrowser.tsx` (around line 50-100, toolbar section)

**Changes:**
1. Import `CustomPromptDialog` component and `useState` for dialog visibility.

2. Add "+ Custom Prompt" button to the Entries tab toolbar (before filters):
   ```tsx
   <button
     className="add-custom-prompt-button"
     onClick={() => setShowCustomPromptDialog(true)}
     title="Create custom prompt button"
   >
     + Custom Prompt
   </button>
   ```

3. Add state for dialog visibility and form loading:
   ```tsx
   const [showCustomPromptDialog, setShowCustomPromptDialog] = useState(false);
   const [isCreatingPrompt, setIsCreatingPrompt] = useState(false);
   ```

4. Add `handleCreateCustomPrompt` callback:
   ```tsx
   const handleCreateCustomPrompt = async (
     label: string,
     prompt: string,
     icon?: string,
     contextPatterns?: string[],
     alwaysShow?: boolean
   ) => {
     setIsCreatingPrompt(true);
     try {
       const response = await fetch('/api/registry/entries', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           name: label, // Registry entry name
           description: `Custom prompt: ${prompt.substring(0, 50)}...`,
           type: 'custom-prompt',
           source: 'project', // User-created entries are project-scoped
           version: '1.0.0',
           status: 'active',
           enabled: true,
           customPromptDef: { label, prompt, icon, contextPatterns, alwaysShow },
         }),
       });

       if (!response.ok) throw new Error('Failed to create custom prompt');

       // Refresh entries list
       await refetchEntries();
       setShowCustomPromptDialog(false);
     } catch (error) {
       console.error('Error creating custom prompt:', error);
       alert('Failed to create custom prompt. Please try again.');
     } finally {
       setIsCreatingPrompt(false);
     }
   };
   ```

5. Render `CustomPromptDialog` conditionally:
   ```tsx
   {showCustomPromptDialog && (
     <CustomPromptDialog
       onSubmit={handleCreateCustomPrompt}
       onCancel={() => setShowCustomPromptDialog(false)}
       isLoading={isCreatingPrompt}
     />
   )}
   ```

**Why:** Provides the entry point for users to create custom prompt buttons. RegistryBrowser is the natural location since it's the central UI for managing registry entries.

**Depends on:** Step 2 (backend must accept custom-prompt entries), Step 3 (dialog component must exist)

---

### Step 5: Fetch and Convert Custom Prompt Entries to ButtonDefinitions

**Package:** `@afw/app` (packages/app/)

**Files to Modify:**
- `packages/app/src/hooks/useCustomPromptButtons.ts` (new file)

**Changes:**
1. Create new hook `useCustomPromptButtons` that:
   - Fetches custom prompt registry entries via `GET /api/registry/entries?type=custom-prompt&enabled=true`
   - Converts each `CustomPromptDefinition` to a `ButtonDefinition` with:
     - `id`: Generate from entry ID (`entry.id as ButtonId`)
     - `label`: Use `customPromptDef.label`
     - `icon`: Use `customPromptDef.icon` or default to "💬"
     - `action`: `{ type: 'quick-action', payload: { value: customPromptDef.prompt } }`
     - `contexts`: Convert `contextPatterns` to `ButtonContext[]` (default to `['general']` if empty)
     - `source`: Use entry source (project/pack/core)
     - `priority`: Default to 100 (lower priority than core buttons)
     - `enabled`: Use entry enabled flag
   - Returns array of `ButtonDefinition[]`
   - Handles loading state and errors
   - Re-fetches when project ID changes

2. Hook interface:
   ```typescript
   export function useCustomPromptButtons(projectId?: ProjectId): {
     buttons: ButtonDefinition[];
     isLoading: boolean;
     error: Error | null;
     refetch: () => Promise<void>;
   }
   ```

**Why:** This hook bridges the registry storage layer (custom prompt entries) with the existing button display system (ButtonDefinition). It encapsulates the conversion logic and provides a clean interface for components.

**Depends on:** Step 1 (types), Step 2 (backend API)

---

### Step 6: Integrate Custom Prompt Buttons into InlineButtons

**Package:** `@afw/app` (packages/app/)

**Files to Modify:**
- `packages/app/src/components/InlineButtons/InlineButtons.tsx` (around line 30-50, button list construction)

**Changes:**
1. Import `useCustomPromptButtons` hook.

2. Call hook inside `InlineButtons` component:
   ```tsx
   const { buttons: customPromptButtons } = useCustomPromptButtons(projectId);
   ```

3. Merge custom prompt buttons with existing buttons from `buttons` prop:
   ```tsx
   const allButtons = useMemo(
     () => [...buttons, ...customPromptButtons],
     [buttons, customPromptButtons]
   );
   ```

4. Use `allButtons` instead of `buttons` for filtering and rendering logic.

**Why:** Makes custom prompt buttons visible in the inline button row (appears after Claude responses). The existing context detection logic will automatically filter buttons based on their `contexts` field.

**Depends on:** Step 5 (hook must exist)

---

### Step 7: Integrate Custom Prompt Buttons into QuickActionBar

**Package:** `@afw/app` (packages/app/)

**Files to Modify:**
- `packages/app/src/components/QuickActionBar/QuickActionBar.tsx` (around line 10-40, quickActions prop)

**Changes:**
1. Import `useCustomPromptButtons` and `ButtonDefinition` type.

2. Add prop for `projectId` (needed by hook):
   ```tsx
   export interface QuickActionBarProps {
     // ... existing props
     projectId?: ProjectId;
   }
   ```

3. Call hook inside `QuickActionBar` component:
   ```tsx
   const { buttons: customPromptButtons } = useCustomPromptButtons(projectId);
   ```

4. Convert `ButtonDefinition[]` to `QuickActionDefinition[]`:
   ```tsx
   const customQuickActions: QuickActionDefinition[] = useMemo(
     () => customPromptButtons.map((btn) => ({
       id: btn.id,
       label: btn.label,
       icon: btn.icon || '💬',
       value: btn.action.payload?.value as string || '',
       contextPatterns: btn.contexts.map(ctx => ctx.toString()), // Convert ButtonContext to string patterns
       alwaysShow: btn.contexts.includes('general'),
     })),
     [customPromptButtons]
   );
   ```

5. Merge with existing `quickActions` prop:
   ```tsx
   const allQuickActions = useMemo(
     () => [...quickActions, ...customQuickActions],
     [quickActions, customQuickActions]
   );
   ```

6. Use `allQuickActions` instead of `quickActions` for filtering and rendering.

**Why:** Makes custom prompt buttons visible in the bottom quick action bar. Reuses the existing context-aware filtering logic (regex patterns).

**Depends on:** Step 5 (hook must exist)

---

### Step 8: Update Parent Components to Pass projectId

**Package:** `@afw/app` (packages/app/)

**Files to Modify:**
- `packages/app/src/components/SessionTile/SessionTile.tsx` (wherever `QuickActionBar` is rendered)
- Any other components rendering `QuickActionBar`

**Changes:**
1. Ensure `QuickActionBar` receives `projectId` prop from session context:
   ```tsx
   <QuickActionBar
     sessionId={session.id}
     lifecycleState={session.lifecycleState}
     quickActions={quickActions}
     onActionClick={handleActionClick}
     onManualInput={handleManualInput}
     projectId={session.projectId} // Add this line
   />
   ```

**Why:** The `useCustomPromptButtons` hook needs `projectId` to fetch project-scoped custom prompts. This ensures the correct prompts are loaded for each session.

**Depends on:** Step 7 (QuickActionBar now requires projectId prop)

---

### Step 9: Add Dark Mode Styles for Custom Prompt Dialog

**Package:** `@afw/app` (packages/app/)

**Files to Modify:**
- `packages/app/src/components/CustomPromptButton/CustomPromptDialog.css` (created in Step 3)

**Changes:**
1. Add dark mode styles using `@media (prefers-color-scheme: dark)`:
   ```css
   @media (prefers-color-scheme: dark) {
     .custom-prompt-dialog {
       background: var(--background-secondary-dark);
       color: var(--text-primary-dark);
       border: 1px solid var(--border-dark);
     }

     .text-input,
     .textarea-input {
       background: var(--background-primary-dark);
       color: var(--text-primary-dark);
       border-color: var(--border-dark);
     }

     .text-input:focus,
     .textarea-input:focus {
       border-color: var(--accent-dark);
       box-shadow: 0 0 0 3px var(--accent-alpha-dark);
     }

     .button-primary {
       background: var(--accent-dark);
     }

     .button-secondary {
       background: transparent;
       border-color: var(--border-dark);
       color: var(--text-primary-dark);
     }
   }
   ```

**Why:** Ensures the dialog looks correct in dark mode, following the existing dark mode patterns used throughout the app (see recent dark mode work in git history).

**Depends on:** Step 3 (CSS file must exist)

---

### Step 10: Add Registry Entry Card Support for Custom Prompt Type

**Package:** `@afw/app` (packages/app/)

**Files to Modify:**
- `packages/app/src/components/RegistryBrowser/RegistryEntryCard.tsx` (around line 50-150, switch on entry.type)

**Changes:**
1. Add case for `'custom-prompt'` in the entry type rendering switch:
   ```tsx
   case 'custom-prompt': {
     const def = entry.data.customPromptDef;
     return (
       <div className="registry-entry-card custom-prompt-card">
         <div className="card-header">
           <span className="entry-icon">{def.icon || '💬'}</span>
           <span className="entry-label">{def.label}</span>
           <span className="entry-type-badge">Custom Prompt</span>
         </div>
         <div className="card-body">
           <div className="prompt-preview">
             {def.prompt.length > 100
               ? def.prompt.substring(0, 100) + '...'
               : def.prompt}
           </div>
           {def.contextPatterns && def.contextPatterns.length > 0 && (
             <div className="context-patterns">
               <span className="label">Contexts:</span>
               {def.contextPatterns.join(', ')}
             </div>
           )}
           {def.alwaysShow && (
             <div className="always-show-badge">Always Visible</div>
           )}
         </div>
         <div className="card-actions">
           <button onClick={() => onToggle?.(entry.id)}>
             {entry.enabled ? 'Disable' : 'Enable'}
           </button>
           <button onClick={() => onDelete?.(entry.id)}>Delete</button>
         </div>
       </div>
     );
   }
   ```

2. Add corresponding CSS styles in `RegistryBrowser.css`:
   ```css
   .custom-prompt-card .prompt-preview {
     font-family: monospace;
     font-size: 12px;
     color: var(--text-secondary);
     padding: 8px;
     background: var(--background-tertiary);
     border-radius: 4px;
     margin-top: 8px;
     white-space: pre-wrap;
     word-break: break-word;
   }

   .custom-prompt-card .context-patterns {
     margin-top: 8px;
     font-size: 11px;
     color: var(--text-tertiary);
   }

   .custom-prompt-card .always-show-badge {
     margin-top: 8px;
     display: inline-block;
     padding: 2px 8px;
     background: var(--accent-alpha);
     color: var(--accent);
     border-radius: 4px;
     font-size: 10px;
     font-weight: 600;
   }
   ```

**Why:** Allows users to view, enable/disable, and delete custom prompt buttons from the RegistryBrowser UI. This completes the CRUD lifecycle.

**Depends on:** Step 1 (types), Step 4 (RegistryBrowser modifications)

---

### Step 11: Add Usage Tracking for Custom Prompt Buttons

**Package:** `@afw/app` (packages/app/)

**Files to Modify:**
- `packages/app/src/hooks/useButtonActions.ts` (around line 150-200, action routing)

**Changes:**
1. Update `executeQuickActionAction` to handle custom prompt buttons:
   ```typescript
   const executeQuickActionAction = async (button: ButtonDefinition) => {
     const { sessionId, projectId } = button.action.payload || {};
     const value = button.action.payload?.value as string;

     if (!sessionId || !value) {
       console.warn('[useButtonActions] Missing sessionId or value for quick-action');
       return;
     }

     try {
       const response = await fetch(`/api/sessions/${sessionId}/quick-actions`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ value }),
       });

       if (!response.ok) throw new Error('Quick action failed');

       // Track usage (existing logic)
       if (projectId) {
         await trackUsage(button.id, projectId);
       }
     } catch (error) {
       console.error('[useButtonActions] Quick action error:', error);
       throw error;
     }
   };
   ```

2. Ensure `trackUsage` is called for all custom prompt button clicks (already implemented in Step 1, but verify).

**Why:** Tracks usage frequency for custom prompt buttons, enabling the learning-based toolbar organization system to surface frequently-used prompts.

**Depends on:** Step 5 (buttons must include action payload with sessionId and value)

---

### Step 12: Add Type Check and Verification

**Package:** All packages

**Files to Verify:**
- `packages/shared/` — Type check
- `packages/backend/` — Type check + unit test for registry schema
- `packages/app/` — Type check

**Changes:**
1. Run type check across all packages:
   ```bash
   pnpm type-check
   ```

2. Fix any type errors introduced by the changes (primarily around `RegistryEntry` discriminated union).

3. Add unit test for custom prompt creation in `packages/backend/src/__tests__/registry.test.ts`:
   ```typescript
   describe('POST /api/registry/entries - custom-prompt', () => {
     it('should create a custom prompt entry', async () => {
       const response = await request(app)
         .post('/api/registry/entries')
         .send({
           name: 'Test Prompt',
           description: 'Test custom prompt',
           type: 'custom-prompt',
           source: 'project',
           version: '1.0.0',
           status: 'active',
           enabled: true,
           customPromptDef: {
             label: 'Ask Claude',
             prompt: 'Please explain this code in detail',
             icon: '🤖',
           },
         });

       expect(response.status).toBe(201);
       expect(response.body.type).toBe('custom-prompt');
       expect(response.body.data.customPromptDef.label).toBe('Ask Claude');
     });

     it('should reject invalid custom prompt (missing label)', async () => {
       const response = await request(app)
         .post('/api/registry/entries')
         .send({
           name: 'Invalid Prompt',
           type: 'custom-prompt',
           source: 'project',
           customPromptDef: { prompt: 'Test' }, // Missing label
         });

       expect(response.status).toBe(400);
     });
   });
   ```

**Why:** Ensures type safety across the entire codebase and validates that the backend correctly accepts and validates custom prompt entries.

**Depends on:** All previous steps (entire implementation)

---

## Dependency Graph

```
Step 1 (shared types)
  ↓
Step 2 (backend schema validation)
  ↓
Step 3 (dialog component) ──→ Step 4 (dialog trigger in RegistryBrowser)
  ↓                              ↓
Step 5 (useCustomPromptButtons hook)
  ↓
Step 6 (InlineButtons integration) ──┐
  ↓                                   ↓
Step 7 (QuickActionBar integration)  Step 10 (registry card support)
  ↓                                   ↓
Step 8 (parent component updates)    Step 11 (usage tracking)
  ↓                                   ↓
Step 9 (dark mode styles)            Step 12 (type check + tests)
  ↓                                   ↓
  └────────────────────────────────────┘
                  ↓
          Step 12 (final verification)
```

**Parallelization Opportunities:**
- Steps 3 and 4 can be done in parallel (dialog creation and dialog trigger)
- Steps 6 and 7 can be done in parallel (both integrate the hook)
- Steps 9 and 10 can be done in parallel (styles and card support)

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Type conflicts in RegistryEntry union** | High — Breaks existing registry functionality if discriminated union isn't properly extended | Add thorough type checking (Step 12). Test all existing registry entry types after changes. |
| **Backend schema validation too strict** | Medium — Legitimate custom prompts might be rejected | Use reasonable limits (label max 100, prompt max 2000). Allow optional fields (icon, contextPatterns). |
| **Context pattern conversion issues** | Medium — ButtonContext enum vs string patterns mismatch | Default to `['general']` if no context patterns. Document that contextPatterns use regex strings, not ButtonContext enums. |
| **ProjectId not available in all contexts** | Medium — Hook fails if projectId is undefined | Make projectId optional in hook. Return empty array if projectId is undefined. |
| **QuickActionBar doesn't receive projectId** | Medium — Custom prompts won't load in QuickActionBar | Update all parent components rendering QuickActionBar (Step 8). Grep for all usages. |
| **Dark mode styles inconsistent** | Low — UI looks broken in dark mode | Follow existing dark mode patterns from recent commits. Use CSS variables defined in global styles. |
| **Dialog backdrop z-index conflicts** | Low — Dialog might appear behind other modals | Use high z-index (9999) matching StarBookmarkDialog. Test with other dialogs open. |
| **Prompt payload too large for API** | Low — Backend rejects prompts over 2000 chars | Validate prompt length in dialog (disable submit if > 2000). Show character counter. |
| **Registry storage persistence** | Low — Custom prompts lost on backend restart (if using MemoryStorage) | Document that production should use RedisStorage. Add migration guide for persisting registry entries. |
| **ButtonDefinition conversion loses data** | Low — CustomPromptDefinition fields not mapped correctly | Thoroughly test conversion logic in Step 5. Log warnings for unmapped fields. |

---

## Verification

### Type Checking
- [ ] `pnpm type-check` passes across all packages
- [ ] No TypeScript errors in VSCode for modified files
- [ ] Discriminated union narrowing works correctly for `'custom-prompt'` type

### Backend API
- [ ] POST `/api/registry/entries` accepts `type: 'custom-prompt'` with valid `customPromptDef`
- [ ] POST returns 400 for invalid `customPromptDef` (missing label, missing prompt)
- [ ] GET `/api/registry/entries?type=custom-prompt` returns custom prompt entries
- [ ] PATCH `/api/registry/entries/:id` updates custom prompt entries
- [ ] DELETE `/api/registry/entries/:id` removes custom prompt entries

### Frontend UI
- [ ] "+ Custom Prompt" button visible in RegistryBrowser Entries tab
- [ ] Clicking button opens `CustomPromptDialog`
- [ ] Dialog form validation works (submit disabled until alias + prompt filled)
- [ ] Dialog submit creates registry entry and closes dialog
- [ ] Dialog cancel button closes without creating entry
- [ ] Dialog displays correctly in light mode
- [ ] Dialog displays correctly in dark mode
- [ ] Custom prompt entry card displays in RegistryBrowser with correct icon, label, prompt preview
- [ ] Enable/disable toggle works for custom prompt entries
- [ ] Delete button removes custom prompt entries

### Button Display
- [ ] Custom prompt buttons appear in InlineButtons (after Claude responses)
- [ ] Custom prompt buttons appear in QuickActionBar (bottom bar)
- [ ] Context filtering works (buttons only appear in matching contexts)
- [ ] Always-show buttons always appear
- [ ] Button icons display correctly (emoji and icon names)
- [ ] Clicking custom prompt button sends prompt payload to session

### Usage Tracking
- [ ] Clicking custom prompt button increments usage count
- [ ] Usage count visible in RegistryBrowser (if usage tracking UI exists)
- [ ] Frequently-used custom prompts auto-reorder in toolbar (if auto-learn enabled)

### Error Handling
- [ ] Network errors during creation show user-friendly error message
- [ ] Invalid form input shows validation errors
- [ ] Backend validation errors display in dialog
- [ ] Missing projectId doesn't crash QuickActionBar or InlineButtons

### Integration
- [ ] Existing button system still works (core buttons, pattern buttons, etc.)
- [ ] Existing QuickActionBar behavior unchanged (manual input, context detection)
- [ ] Existing InlineButtons behavior unchanged (inline rendering, action routing)
- [ ] WebSocket events still fire correctly for custom prompt actions

---

## Optional Enhancements (Out of Scope)

These enhancements are not included in the core implementation but could be added in future iterations:

1. **Icon Picker Component** — Visual icon selector instead of text input (like emoji picker)
2. **Context Selector UI** — Multi-select dropdown for `ButtonContext` enum values instead of regex patterns
3. **Prompt Templates** — Pre-defined prompt templates users can customize (e.g., "Explain code", "Find bugs", "Optimize performance")
4. **Prompt Variables** — Support for `{{variable}}` placeholders that get replaced at execution time (e.g., `{{selected_code}}`)
5. **Export/Import** — Export custom prompts as JSON, import from file or URL
6. **Prompt Categories** — Organize custom prompts into folders or categories
7. **Prompt Sharing** — Share custom prompts with team via behavior packs
8. **Prompt Analytics** — Detailed usage stats (frequency, success rate, average response time)
9. **Prompt Editing** — Edit existing custom prompts in-place (currently requires delete + recreate)
10. **Keyboard Shortcuts** — Assign keyboard shortcuts to custom prompts (already supported via `ShortcutDefinition`, needs UI integration)

---

## Implementation Notes

### Code Reuse
This implementation maximizes reuse of existing infrastructure:
- **QuickActionDefinition** structure (alias + prompt) is nearly identical to `CustomPromptDefinition`
- **RegistryEntry** system handles persistence and CRUD
- **StarBookmarkDialog** pattern provides proven dialog UI structure
- **buttonContextDetector** provides context-aware filtering
- **useButtonActions** hook handles action routing and usage tracking
- **InlineButtons** and **QuickActionBar** already support button display

### Performance Considerations
- Custom prompt buttons are fetched once per project and cached in hook
- Context filtering uses pre-compiled regex patterns (existing optimization in QuickActionBar)
- Button rendering uses React.memo and useMemo to prevent unnecessary re-renders

### Accessibility
- Dialog follows WAI-ARIA dialog pattern (backdrop, focus trap, Escape to close)
- Form labels properly associated with inputs (htmlFor + id)
- Close button has aria-label
- Submit button disabled state communicated to screen readers

### Testing Strategy
- Unit tests for backend schema validation (Step 12)
- Manual E2E testing for UI flow (create → display → click → track usage)
- Type checking ensures compile-time safety
- Error boundary testing for network failures

---

## Metadata

- **Feature:** Custom Prompt Button
- **Complexity:** Medium (extends existing infrastructure, minimal new concepts)
- **Estimated Lines of Code:** ~800 lines (300 dialog component, 200 hook, 100 integration, 200 styles/tests)
- **Packages Modified:** @afw/shared (types), @afw/backend (schema), @afw/app (UI)
- **Breaking Changes:** None (purely additive)
- **Migration Required:** No
- **Documentation Updates:** Add usage guide to project README (out of scope for this plan)
