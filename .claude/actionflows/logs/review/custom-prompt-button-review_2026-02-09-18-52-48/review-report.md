# Review Report: Custom Prompt Button Feature Implementation

## Verdict: NEEDS_CHANGES
## Score: 82%

## Summary

The Custom Prompt Button feature implementation is well-structured and follows established patterns in the codebase. The code quality is good with proper TypeScript typing, consistent naming conventions, and appropriate separation of concerns. However, there are several issues that need to be addressed before merging: a critical discriminated union type inconsistency between shared types and backend schema, a missing export in the frontend barrel file, inconsistent field naming in the data union, and a few architectural concerns around context handling and error boundaries.

## Findings

| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|
| 1 | packages/shared/src/registryTypes.ts | 149 | critical | Discriminated union uses `customPromptDef` field instead of `definition`, breaking consistency with other entry types. All other types use `definition` field (button, pattern, workflow, shortcut, modifier). | Change `customPromptDef: CustomPromptDefinition` to `definition: CustomPromptDefinition` on line 149 to match the pattern used by all other entry types. |
| 2 | packages/backend/src/schemas/api.ts | 382 | critical | Backend Zod schema uses `customPromptDef` field, which is inconsistent with TypeScript types if they follow the pattern of other entry types. This will cause runtime validation failures. | Update line 382 from `customPromptDef: customPromptDefinitionSchema` to `definition: customPromptDefinitionSchema` to align with TypeScript types and other entry type schemas. |
| 3 | packages/app/src/components/CustomPromptButton/index.ts | 1 | high | Missing export for the barrel file. The pattern in this codebase exports both the component AND its props interface for external consumption. | Add export for CustomPromptDialogProps: `export type { CustomPromptDialogProps } from './CustomPromptDialog';` |
| 4 | packages/app/src/hooks/useCustomPromptButtons.ts | 60-80 | medium | Type narrowing in map function accesses `entry.data.customPromptDef` which will fail if Finding #1 is fixed. The field should be `definition` based on discriminated union pattern. | Change line 63 from `const def: CustomPromptDefinition = entry.data.customPromptDef;` to `const def: CustomPromptDefinition = entry.data.definition;` after fixing the type definition. |
| 5 | packages/app/src/components/RegistryEntryCard.tsx | 36-40 | medium | Type narrowing check uses `'customPromptDef' in entry.data` which is fragile. After fixing Finding #1, this will need to be updated, but the discriminated union should already provide type safety without manual checks. | After fixing type definitions, replace the 'in' check with discriminated union pattern: `if (entry.data.type !== 'custom-prompt') return null;` and then access `entry.data.definition` directly. TypeScript will narrow the type automatically. |
| 6 | packages/app/src/components/RegistryBrowser/RegistryBrowser.tsx | 148-161 | medium | Registry entry creation uses `customPromptDef` field in POST body, which needs to align with the corrected type definitions. | Change line 158 from `customPromptDef: { label, prompt, icon, contextPatterns, alwaysShow }` to `definition: { label, prompt, icon, contextPatterns, alwaysShow }` after fixing type definitions. |
| 7 | packages/app/src/hooks/useCustomPromptButtons.ts | 61 | low | Filter condition checks for both `entry.type === 'custom-prompt'` AND `entry.data?.customPromptDef` existence. The discriminated union already guarantees that if type is 'custom-prompt', the data field will have the correct shape. The second check is redundant. | Simplify to `.filter((entry: any) => entry.type === 'custom-prompt')` and rely on discriminated union type narrowing. |
| 8 | packages/app/src/hooks/useCustomPromptButtons.ts | 76 | low | Hardcoded context as `['general' as const]` for all custom prompts. This ignores the `contextPatterns` field from CustomPromptDefinition and prevents context-aware button filtering. | Map `def.contextPatterns` to ButtonDefinition contexts or implement a context-pattern-to-context converter. Fallback to `['general']` only if contextPatterns is empty or alwaysShow is true. |
| 9 | packages/app/src/components/QuickActionBar/QuickActionBar.tsx | 76 | low | Similar context issue: maps all custom prompt buttons to alwaysShow based on 'general' context presence. This is backwards - alwaysShow should be determined by the `alwaysShow` field from CustomPromptDefinition. | Change line 76 to `alwaysShow: btn.contexts.includes('general') || (btn.action.payload?.alwaysShow as boolean) || false` to respect the original alwaysShow field. |
| 10 | packages/app/src/components/CustomPromptButton/CustomPromptDialog.tsx | 46 | low | Comment says "contextPatterns - not implemented in UI yet" but passes undefined. This prevents users from setting context patterns at creation time. | Either implement context patterns input (textarea with placeholder "Enter regex patterns, one per line") or document this as a future enhancement in the UI. |
| 11 | packages/app/src/hooks/useCustomPromptButtons.ts | 34-38 | low | Early return when `!projectId` prevents fetching custom prompts that might be defined at core or pack level. Custom prompts could theoretically be scoped to core or pack sources. | Change conditional from `if (!projectId)` to `if (!projectId && source === 'project')` or remove the early return entirely and make projectId query param optional. |
| 12 | packages/backend/src/schemas/api.ts | 343-349 | low | Custom prompt schema allows max 2000 chars for prompt, but the shared type has no validation. Runtime could accept larger prompts that fail backend validation. | Add JSDoc comment to CustomPromptDefinition interface documenting the 2000-char limit enforced by backend validation. |

## Flags for Human

| Issue | Why Human Needed |
|-------|-----------------|
| Discriminated union field naming (`definition` vs `customPromptDef`) | This is a breaking API change that affects the contract between frontend, backend, and storage. Need decision on whether to align with existing pattern (definition) or keep custom name (customPromptDef). Changing it requires coordinated updates across all layers. |
| Context pattern handling architecture | The feature has `contextPatterns` field in types but no UI for setting it, and the conversion logic ignores it entirely. Need product decision: should users be able to set regex context patterns? Should context-aware filtering work for custom prompts? Or should they always show? |
| Custom prompt source scoping | Current implementation assumes custom prompts are always project-scoped. Need decision: should custom prompts support core/pack sources for reusability across projects? |

## Learnings

**Issue:** Discriminated union field naming inconsistency discovered during review

**Root Cause:** The shared types use `customPromptDef` field for custom-prompt entries while all other entry types use `definition` field. This breaks the established pattern and creates a special case that makes the discriminated union harder to work with. The backend schema mirrors this inconsistency.

**Suggestion:** When extending discriminated unions, always follow the existing pattern for field naming. In this case, all entry types should use `data.definition` regardless of type. Review the discriminated union pattern across the codebase before adding new cases to ensure consistency.

[FRESH EYE] The `useCustomPromptButtons` hook has a design issue: it fetches custom prompts on every render cycle when `projectId` changes, but there's no WebSocket subscription to detect when new custom prompts are created by other users or sessions. This means the UI won't update when a new custom prompt is created until the component remounts or `refetch()` is called manually. Consider adding a WebSocket listener for `registry:changed` events to auto-refetch when registry entries are modified.
