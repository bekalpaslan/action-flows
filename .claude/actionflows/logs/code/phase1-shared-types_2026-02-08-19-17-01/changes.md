# Code Changes: Phase 1 - Self-Evolving Type System

## Summary

Created foundational types for the self-evolving button system as specified in SRD Section 2.0 and 2.1. These types enable dynamic behavior resolution with multi-layer sourcing (core, pack, project) and context-aware button definitions.

## Files Created

| File | Purpose | Size |
|------|---------|------|
| `packages/shared/src/selfEvolvingTypes.ts` | Common types to avoid circular dependencies: `BehaviorPackId`, `LayerSource` | 733 B |
| `packages/shared/src/buttonTypes.ts` | Complete button system types: `ButtonId`, `ButtonDefinition`, `ButtonAction`, `ToolbarConfig`, etc. | 4.0 KB |

## Files Modified

| File | Change |
|------|--------|
| `packages/shared/src/index.ts` | Added exports for new Self-Evolving System Types and Button System Types sections |

## Key Type Definitions

### selfEvolvingTypes.ts
- **`BehaviorPackId`**: Branded type for behavior pack identifiers
- **`LayerSource`**: Discriminated union enabling multi-layer behavior resolution:
  - `{ type: 'core' }` — Built-in, non-deletable
  - `{ type: 'pack'; packId: BehaviorPackId }` — From installed pack
  - `{ type: 'project'; projectId: ProjectId }` — Per-project override

### buttonTypes.ts
- **`ButtonId`**: Branded type for button identifiers
- **`ButtonActionType`**: Union of `'command'`, `'api-call'`, `'quick-action'`, `'clipboard'`, `'navigate'`, `'custom'`
- **`ButtonAction`**: Payload describing button behavior with optional command type, endpoint, method, and generic payload
- **`ButtonContext`**: Response classification (code-change, error-message, analysis-report, question-prompt, file-modification, general)
- **`ButtonDefinition`**: Full button specification including label, icon, action, contexts, shortcut, source layer, priority, enabled state
- **`ButtonState`**: Execution state tracking (idle, loading, success, error)
- **`ToolbarSlot`**: Button position and usage tracking (pinned, position, usageCount, lastUsed)
- **`ToolbarConfig`**: Toolbar configuration per-project with maxSlots, autoLearn, and showUsageCount

## Architecture Alignment

- **Patterns**: Follow existing branded string types (SessionId, ChainId, etc.)
- **Imports**: Use `.js` extensions as per project conventions
- **No Circular Dependencies**: `selfEvolvingTypes.ts` placed first and imported by both `buttonTypes.ts` and other modules
- **Type Safety**: All IDs are branded types; discriminated unions for LayerSource and ButtonActionType

## Verification

- Type check: **PASS** ✓
- All packages type-checked successfully:
  - `@afw/shared` ✓
  - `@afw/backend` ✓
  - `@afw/second-opinion` ✓
  - `@afw/hooks` ✓
- No TypeScript errors introduced

## Next Steps

These types are ready for integration with:
1. Registry system (behavior pack loading and resolution)
2. Frontend button renderer component
3. Toolbar learning algorithm
4. Context classification in response processing
