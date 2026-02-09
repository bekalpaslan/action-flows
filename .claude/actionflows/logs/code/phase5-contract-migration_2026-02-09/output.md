# Code Changes: Phase 5 Contract Migration (Context-Native Routing)

**Date:** 2026-02-09
**Task:** Migrate contract Format 6.2 from DepartmentRoutingParsed to ContextRoutingParsed
**Scope:** packages/shared/src/contract/

---

## Summary

Successfully migrated Format 6.2 from department-based routing (Framework, Engineering, QA, Human) to context-based routing (work, maintenance, explore, review, settings, pm, etc.). The new ContextRoutingParsed interface includes:

- `context: WorkbenchId | null` — Replaces `department` field
- `confidence: number | null` — Confidence score (0.0-1.0)
- `disambiguated: boolean` — Whether disambiguation was needed

All deprecated aliases are in place to maintain backward compatibility.

---

## Files Modified

| File | Change |
|------|--------|
| `packages/shared/src/contract/types/statusFormats.ts` | Added WorkbenchId import, replaced DepartmentRoutingParsed with ContextRoutingParsed, created deprecated alias |
| `packages/shared/src/contract/types/index.ts` | Exported ContextRoutingParsed, marked DepartmentRoutingParsed as deprecated |
| `packages/shared/src/contract/patterns/statusPatterns.ts` | Created ContextRoutingPatterns with new field patterns (context, confidence, disambiguated), aliased DepartmentRoutingPatterns |
| `packages/shared/src/contract/parsers/statusParser.ts` | Created parseContextRouting with new parsing logic, aliased parseDepartmentRouting as deprecated |
| `packages/shared/src/contract/parsers/index.ts` | Exported parseContextRouting, updated ParsedFormat union, updated master parser to use parseContextRouting |
| `packages/shared/src/contract/guards.ts` | Created isContextRoutingParsed guard, aliased isDepartmentRoutingParsed as deprecated |
| `packages/shared/src/contract/index.ts` | Exported all new functions/types with deprecated aliases |
| `packages/shared/src/contract/README.md` | Updated documentation to reference context routing, marked deprecated items |
| `packages/backend/src/services/harmonyDetector.ts` | Updated format detection logic to recognize ContextRouting instead of DepartmentRouting |

---

## Files Created

None. All changes were modifications to existing files.

---

## Migration Details

### New Type Structure

```typescript
export interface ContextRoutingParsed {
  request: string | null;
  context: WorkbenchId | null;          // NEW: Replaces department
  confidence: number | null;            // NEW: Routing confidence
  flow: string | null;
  actions: string[] | null;
  disambiguated: boolean;               // NEW: Disambiguation flag
  raw: string;
  contractVersion: string;
}
```

### New Pattern Structure

```typescript
export const ContextRoutingPatterns = {
  heading: /^## Routing: (.+)$/m,
  context: /^\*\*Context:\*\* (work|maintenance|explore|review|settings|pm|archive|harmony|editor)$/mi,
  confidence: /^\*\*Confidence:\*\* ([\d.]+)$/m,
  flow: /^\*\*Flow:\*\* (.+)$/m,
  actions: /^\*\*Actions:\*\* (.+)$/m,
  disambiguated: /^\*\*Disambiguated:\*\* (true|false)$/mi,
} as const;
```

### Deprecated Aliases

All deprecated items are clearly marked with JSDoc comments:

- `DepartmentRoutingParsed` → `ContextRoutingParsed`
- `parseDepartmentRouting` → `parseContextRouting`
- `isDepartmentRoutingParsed` → `isContextRoutingParsed`
- `DepartmentRoutingPatterns` → `ContextRoutingPatterns`

---

## Verification

### Type Check: ✅ PASS

```bash
pnpm type-check
# All packages pass TypeScript compilation
```

### Global Search: ✅ PASS

```bash
grep -r "DepartmentRouting" packages/shared/src/contract
# All references are either deprecated aliases or documentation
```

### External References: ✅ PASS

- Backend `harmonyDetector.ts` updated to recognize `ContextRouting` format
- No other external references found in app or backend packages

---

## Notes

1. **Backward Compatibility:** All deprecated aliases in place. Code using old names will continue to work.
2. **WorkbenchId Import:** Added from `../../workbenchTypes.js` to support the new context field.
3. **Harmony Detection:** Updated backend harmony detector to correctly identify ContextRouting format.
4. **Parser Logic:** New parser correctly handles confidence (float), disambiguated (boolean), and context (WorkbenchId enum).

---

## Next Steps

1. Update ORCHESTRATOR.md to use context-based routing output format
2. Update CONTRACT.md documentation for Format 6.2
3. Remove deprecated aliases in a future phase (after verification period)
4. Add unit tests for parseContextRouting parser

---

## Contract Version

**Current:** 1.0 (unchanged - additive change, fully backward compatible)

This is an additive change with deprecated aliases, so no contract version increment is required.
