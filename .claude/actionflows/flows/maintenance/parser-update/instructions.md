# Parser Update Flow

> Update backend parser to handle evolved orchestrator/agent output formats.

---

## When to Use

- Human says "update parser for Gate N"
- Recommendations suggest parser-update/
- Gate 9 (or other gate) repeatedly fails on same agent output pattern
- Orchestrator/agent output format has evolved beyond current parser capability
- Need to handle new optional fields, structural changes, or format variants

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| gate_id | (optional) Which gate shows parser failures | "Gate 4" or "Gate 9" |
| context | (optional) Description of parsing failures | "Parser can't handle optional status field" or "Chain compilation missing priority" |

---

## Action Sequence

### Step 1: Analyze Parser Gap

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: parser-gap
- scope: packages/shared/src/contract/parsers/ vs orchestrator/agent output
- context: {human context, or "analyze parser gaps at Gate {gate_id}"}. Collect failed parsing examples. Compare expected vs actual format. Identify: what new field(s) parser can't handle? What structural change broke the parser? What type mismatch? Provide concrete before/after examples from actual failed outputs.
```

**Gate:** Parser gap analysis delivered with:
- Specific parsing failures with examples
- What fields/structure the parser doesn't handle
- Expected vs actual format
- Impact assessment (how many gates affected)

---

### Step 2: Backend Parser Update

**Action:** `.claude/actionflows/actions/code/backend/`
**Model:** haiku

**Spawn after Step 1:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Update parser in packages/shared/src/contract/parsers/ to handle new format variant. Parser gap analysis from Step 1 identified what parser can't handle. Update the parseXXX() function to: (1) handle the new field/structure, (2) maintain backward compatibility with old format variant, (3) gracefully degrade if optional fields missing. Include inline comments explaining the variant handling.
- context: Parser gap analysis from Step 1 with specific examples
- component: backend
```

**Gate:** Parser updated in packages/shared/src/contract/parsers/; changes type-check cleanly.

---

### Step 3: Test Parser

**Action:** `.claude/actionflows/actions/test/`
**Model:** haiku

**Spawn after Step 2:**
```
Read your definition in .claude/actionflows/actions/test/agent.md

Input:
- parser: Name of the parser updated in Step 2 (e.g., parseChainCompilation)
- samples: Include both old and new format examples from Step 1 analysis
- context: Parser now handles new format. Test: (1) new format parses correctly, (2) old format still parses (backward compat), (3) malformed input fails gracefully with clear error.
```

**Test validates:**
- Updated parser handles new format correctly
- Old format variants still parse (backward compatibility)
- Malformed input fails gracefully
- No type errors

**Gate:** Tests pass; parser validates both old and new formats.

---

### Step 4: Code Review

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet

**Spawn after Step 3:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: Parser code changes from Step 2 and test additions from Step 3
- type: code-review
- context: Parser updated to handle new format variant. Check: graceful degradation, backward compatibility, clear error messages, appropriate type safety.
```

**Review focuses on:**
- Parser implementation is correct and handles both formats
- Backward compatibility maintained
- Error messages are clear
- Type safety maintained
- Tests cover new variant + old variant + edge cases

**Gate:** Verdict delivered (APPROVED or NEEDS_CHANGES).

---

### Step 5: Second Opinion

**Action:** `.claude/actionflows/actions/second-opinion/`
**Model:** opus

**Spawn after Step 4:**
```
Read your definition in .claude/actionflows/actions/second-opinion/agent.md

Input:
- review-log: {log path from Step 4}
- focus: Verify parser handles new format without breaking backward compatibility. Check: both format variants parse, edge cases covered, type safety maintained.
```

**Gate:** Second opinion delivered (CONCUR or DISSENT).

---

### Step 6: Handle Verdict

- **APPROVED + CONCUR** → Proceed to Step 7 (commit)
- **NEEDS_CHANGES or DISSENT** → Back to Step 2 with feedback

---

### Step 7: Commit

**Action:** `.claude/actionflows/actions/commit/`
**Model:** haiku

**Spawn after verdict approval:**
```
Read your definition in .claude/actionflows/actions/commit/agent.md

Input:
- scope: Parser changes from Step 2 and test additions from Step 3
- message_type: parser-update
- context: Update parseXXX() to handle new format variant while maintaining backward compatibility. Briefly note what format variant was added (e.g., "Handle optional status field in Chain Compilation").
```

**Commit includes:**
- Updated parser implementation
- New tests for format variant
- Tag: `parser-update`

---

## Dependencies

```
Step 1 → Step 2 → Step 3 → Step 4 → Step 5 (verdict gate) → Step 7
                                       ↑_________________↓ (if NEEDS_CHANGES/DISSENT)
```

**Parallel groups:** None — sequential with approval gate and possible loop.

---

## Chains With

- ← Triggered from: Human request or gate failure recommendation
- → `harmony-audit-and-fix/` (to clear gate violations if parser was root cause)
- → `framework-health/` (to verify parser updated correctly)

---

## Safety Guardrails

1. **Always analyze before coding** — Parser gap must be clear with examples before implementation
2. **Backward compatibility required** — Updated parser must handle both old and new format variants
3. **Test both variants** — Tests must cover new format AND old format
4. **Graceful degradation** — Parser must fail with clear error message if input is truly malformed
5. **Type safety** — Use appropriate TypeScript types; no `any` type
6. **Review before commit** — All parser changes validated by code review + second opinion
7. **Verify gate passes** — After update, gate should report success on previously-failing output

---

## Output Artifacts

- `.claude/actionflows/logs/analyze/parser-gap-{datetime}/analysis.md` — Parser gap analysis
- `.claude/actionflows/logs/code/parser-update-{datetime}/changes.md` — Parser implementation log
- `.claude/actionflows/logs/test/parser-{datetime}/test-results.md` — Test results
- `.claude/actionflows/logs/review/parser-update-{datetime}/review.md` — Code review results
- `.claude/actionflows/logs/second-opinion/parser-update-{datetime}/opinion.md` — Second opinion
