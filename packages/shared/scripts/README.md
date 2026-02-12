# Shared Package Scripts

## Contract Validation

### `validate-contract.ts`

Automated validation script that verifies complete alignment across the 4-layer contract stack:

1. **CONTRACT.md specification** — Format definitions and requirements
2. **TypeScript types** — Interface definitions in `src/contract/types/`
3. **Zod schemas** — Runtime validation in `src/contract/validation/schemas.ts`
4. **Parser implementations** — Extraction logic in `src/contract/parsers/`

### What It Checks

For each of the 19 contract formats (1.1–6.2):

- ✅ **Spec layer:** Format is documented in CONTRACT.md
- ✅ **Type layer:** TypeScript interface exists with all required fields
- ✅ **Schema layer:** Zod schema exists with matching fields
- ✅ **Parser layer:** Parser function extracts all type fields

### Running Validation

**Local development:**
```bash
cd packages/shared
pnpm run contract:validate
```

**CI/JSON output:**
```bash
pnpm run contract:validate:json
```

**From project root:**
```bash
pnpm -F @afw/shared run contract:validate
```

### Exit Codes

- **0** — No drift detected, all formats aligned
- **1** — Critical drift found (missing fields, type mismatches)
- **2** — Validation error (script bug or missing files)

### Output Example

```
================================================================================
Contract Drift Validation Report
================================================================================

Timestamp: 2026-02-12T23:30:00.000Z
Total Formats: 19
Aligned: 17
Drift Detected: 2
Critical Issues: 3

Format 1.1 (ChainCompilationParsed): ✅ ALIGNED [✓✓✓✓] 100%
Format 1.2 (ChainExecutionStartParsed): ✅ ALIGNED [✓✓✓✓] 100%
Format 5.1 (ReviewReportParsed): ⚠️ DRIFT [✓✓✓✗] 75%
  🔴 [parser] Field "fixesApplied" exists in TypeScript type but not extracted by parser
  🔴 [parser] Field "flagsForHuman" exists in TypeScript type but not extracted by parser

Overall: ✅ 89% aligned (17/19 formats)
❌ 2 critical issue(s) detected.
```

### Interpreting Results

**Layer Status Indicators:**
- `[✓✓✓✓]` — All 4 layers present (spec, type, schema, parser)
- `[✓✓✓✗]` — Parser layer missing
- `[✓✓✗✗]` — Schema and parser missing

**Severity Levels:**
- 🔴 **CRITICAL** — Missing required field, type mismatch, layer missing
- 🟡 **MEDIUM** — Naming inconsistency, optional field issue
- 🟢 **LOW** — Style or documentation issue

### How to Fix Drift Issues

**Missing field in Zod schema:**
1. Open `src/contract/validation/schemas.ts`
2. Find the schema (e.g., `ReviewReportSchema`)
3. Add missing field with appropriate Zod validator
4. Run `pnpm run contract:validate` to verify

**Missing field in parser:**
1. Open the parser file (e.g., `src/contract/parsers/actionParser.ts`)
2. Find the parser function (e.g., `parseReviewReport`)
3. Add extraction logic for the missing field
4. Update the returned object to include the field
5. Run `pnpm run contract:validate` to verify

**Missing field in TypeScript type:**
1. Open the type file (e.g., `src/contract/types/actionFormats.ts`)
2. Find the interface (e.g., `ReviewReportParsed`)
3. Add the field with appropriate type annotation
4. Run `pnpm run type-check` to verify
5. Run `pnpm run contract:validate` to verify full alignment

**Format not documented in CONTRACT.md:**
1. This should never happen for existing formats
2. If adding a new format, see `docs/architecture/CONTRACT_EVOLUTION.md`

### CI Integration

**Pre-commit hook** (optional):
```bash
# .husky/pre-commit
if git diff --cached --name-only | grep -E "(CONTRACT\.md|schemas\.ts|.*Formats\.ts|.*Parser\.ts)"; then
  echo "Contract files changed, validating alignment..."
  cd packages/shared && pnpm run contract:validate
fi
```

**GitHub Actions:**
```yaml
- name: Validate Contract Alignment
  run: pnpm -F @afw/shared run contract:validate
```

### Limitations

**Current implementation:**
- Uses regex/string matching (not full TypeScript AST parsing)
- May miss complex nested types or conditional fields
- Does not validate field types match (only presence)
- Does not validate CONTRACT.md examples are parseable

**Future enhancements:**
- Parse TypeScript AST for accurate type extraction
- Validate field type compatibility (string vs number)
- Test parsers against CONTRACT.md examples
- Validate nullable/optional field consistency
- Check frontend component integration

### Design Philosophy

**Graceful degradation:**
- If validator cannot parse a format, it logs a warning and continues
- Script never blocks commits on validator bugs
- Only blocks on actual contract drift

**Maintainability:**
- Format mapping in single configuration object
- Easy to add new formats
- Clear separation of extraction and validation logic

**Evolution:**
- Can expand validation depth in future iterations
- Start simple (field presence), grow to type checking
- Prioritize critical formats (Chain Management 1.x, Action Outputs 5.x)

### Troubleshooting

**Script fails with "Cannot find module":**
```bash
# Install tsx if missing
pnpm add -D tsx
```

**Validator detects false positives:**
- Check if field uses JSDoc comments (validator may miss these)
- Check if field has complex type annotation (validator may not parse)
- Report issue with format ID and field name

**Validator misses real drift:**
- Check if type uses inheritance (validator only checks direct fields)
- Check if schema uses `.merge()` or `.extend()` (validator only checks extend)
- Report issue with format ID and missing field

### Related Documentation

- **Contract Evolution:** `docs/architecture/CONTRACT_EVOLUTION.md`
- **Contract Specification:** `.claude/actionflows/CONTRACT.md`
- **Parser Priority:** `packages/app/docs/PARSER_PRIORITY.md`
- **Harmony Detection:** `.claude/actionflows/docs/living/HARMONY.md`
