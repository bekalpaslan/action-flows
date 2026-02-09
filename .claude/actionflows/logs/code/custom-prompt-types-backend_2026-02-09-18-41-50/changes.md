# Code Changes: Custom Prompt Types and Backend Schema

## Files Modified

| File | Change |
|------|--------|
| packages/shared/src/registryTypes.ts | Added 'custom-prompt' to RegistryEntryType union; added CustomPromptDefinition interface (label, prompt, icon?, contextPatterns?, alwaysShow?); updated RegistryEntry data discriminated union to include custom-prompt type with customPromptDef field |
| packages/shared/src/index.ts | Exported CustomPromptDefinition type for external consumption |
| packages/backend/src/schemas/api.ts | Added customPromptDefinitionSchema with Zod validation (label: min(1) max(100), prompt: min(1) max(2000), icon: optional max(50), contextPatterns: optional array max(20), alwaysShow: optional boolean); updated registryEntryQuerySchema to accept 'custom-prompt' type filter; updated createRegistryEntrySchema to validate custom-prompt entries with discriminated union; updated updateRegistryEntrySchema similarly |

## Files Created

None — All changes were modifications to existing files.

## Verification

- Type check: **PASS**
- Notes: Successfully extended the registry system to support custom prompt buttons. The shared package was rebuilt to propagate type changes to dependent packages. All TypeScript compilation passed with no errors.

## Implementation Details

### Shared Types (registryTypes.ts)
- Added `CustomPromptDefinition` interface with required `label` and `prompt` fields
- Optional fields: `icon` (string), `contextPatterns` (array of strings), `alwaysShow` (boolean)
- Updated `RegistryEntryType` to include `'custom-prompt'` as a valid type
- Extended the discriminated union in `RegistryEntry['data']` to handle custom-prompt entries
- Used `customPromptDef` field name (not `definition`) to distinguish from other entry types

### Backend Schemas (api.ts)
- Created `customPromptDefinitionSchema` with comprehensive validation:
  - label: 1-100 chars (required)
  - prompt: 1-2000 chars (required)
  - icon: up to 50 chars (optional)
  - contextPatterns: array of strings up to 500 chars each, max 20 items (optional)
  - alwaysShow: boolean (optional)
- Updated query, create, and update schemas to accept 'custom-prompt' type
- Converted data field schemas from simple object to discriminated union for type-safe validation
- Each entry type now has explicit schema structure matching the TypeScript types

## Next Steps (from plan)

Steps 3-6 remain:
- Step 3: Frontend UI component for custom prompt button creation
- Step 4: TopBar integration to display custom prompt buttons
- Step 5: Click handler to trigger prompt submission
- Step 6: Testing and documentation
