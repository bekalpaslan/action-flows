# Backwards Harmony Audit

> Audit contract harmony from the frontend backwards through parsers and specs.

---

## Purpose

Performs a comprehensive harmony audit by starting from the dashboard frontend (consumer perspective) and working backwards through parsers, specifications, and finally cross-referencing all layers. Detects contract drift, dead code, specification gaps, and graceful degradation points.

## When to Use

- Periodic contract compliance checks
- After major orchestrator output format changes
- Before releases involving format changes
- When dashboard displays unexpected parsing behavior
- When human requests "audit harmony", "check contract", or "backwards harmony"

## Chain Pattern

analyze×3 (parallel) → audit → second-opinion/

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| focus | No | Narrow to specific format(s) | "all" |
| depth | No | Analysis depth | "comprehensive" |

## Action Sequence

### Steps 1-3: Layer Analysis (Parallel)

Three analyze/ agents run in parallel, each examining one layer:

**Step 1 — Frontend Layer (analyze/, sonnet)**
- Scope: packages/app/src/
- Task: Inventory all orchestrator output consumption points. Document what fields each component expects, what WebSocket events it subscribes to, and what data shapes it renders.

**Step 2 — Parser Layer (analyze/, sonnet)**
- Scope: packages/shared/src/contract/
- Task: Analyze all parser implementations. Document function signatures, regex patterns, extracted fields, validation logic, error handling. Map each parser to its CONTRACT.md specification.

**Step 3 — Specification Layer (analyze/, sonnet)**
- Scope: .claude/actionflows/CONTRACT.md, .claude/actionflows/ORCHESTRATOR.md, .claude/actionflows/docs/
- Task: Catalog all output format specifications. Document format numbers, TypeScript types, parser names, required fields, priority levels, and examples.

### Step 4: Cross-Reference Audit (audit/, opus)

Waits for Steps 1-3. Reads all three layer reports and cross-references:
- Spec drift (CONTRACT.md vs parser implementations)
- Parser drift (parsers vs spec documentation)
- Frontend drift (components vs parser output)
- Missing coverage (specs without parsers, parsers without specs)
- Degradation points (where graceful degradation occurs)
- Priority violations (P0 formats with weak parsing)

Categorizes findings: CRITICAL → HIGH → MEDIUM → LOW

### Step 5: Second Opinion (second-opinion/, haiku)

Waits for Step 4. Critiques audit findings via Ollama.

## Dependencies

```
[Step 1: Frontend]  ──┐
[Step 2: Parsers]   ──┼──→ [Step 4: Audit] → [Step 5: Second Opinion]
[Step 3: Specs]     ──┘
```

## Output

All outputs follow standard log folder pattern:
- Step 1: .claude/actionflows/logs/analyze/frontend-layer_{datetime}/report.md
- Step 2: .claude/actionflows/logs/analyze/parser-layer_{datetime}/report.md
- Step 3: .claude/actionflows/logs/analyze/spec-layer_{datetime}/report.md
- Step 4: .claude/actionflows/logs/audit/backwards-harmony_{datetime}/audit-report.md
- Step 5: .claude/actionflows/logs/second-opinion/audit-critique_{datetime}/second-opinion-report.md

## Chains With

- → code-and-review/ (to fix harmony violations from report)
- → post-completion/ (after audit reviewed and approved)

## Example Invocations

- "audit harmony" → full audit, all formats
- "backwards harmony audit focusing on ChainCompilation" → focused audit
- "check contract compliance" → full audit
