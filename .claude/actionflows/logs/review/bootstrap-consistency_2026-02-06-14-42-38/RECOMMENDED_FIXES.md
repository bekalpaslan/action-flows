# Recommended Fixes for Bootstrap.md

**Total Issues:** 2
**Priority:** Medium (1), Low (1)

---

## Fix #1: Update Orchestration Guide Reference (Line 451)

**File:** `.claude/bootstrap.md`
**Location:** Line 451 (Part 3: Universal vs Discovered)
**Severity:** Medium
**Reason:** References wrong file for orchestration guide

### Current Text (INCORRECT)

```markdown
| Orchestration guide | `.claude/CLAUDE.md` with Rules 1-11 | Orchestrator behavior is project-independent |
```

### Corrected Text

```markdown
| Orchestration guide | `.claude/actionflows/ORCHESTRATOR.md` with Rules 1-11 | Orchestrator behavior is project-independent |
| Project context | `.claude/CLAUDE.md` | Project-specific values auto-loaded by all agents |
```

### Rationale

The orchestration guide (Rules 1-11, Session-Start Protocol, Sin Test, Gates) lives in ORCHESTRATOR.md, not CLAUDE.md. CLAUDE.md contains only project context. This fix adds both entries to clarify the split.

---

## Fix #2: Clarify Template Reference (Line 2190)

**File:** `.claude/bootstrap.md`
**Location:** Line 2190 (Step 9b: Create ORCHESTRATOR.md)
**Severity:** Low
**Reason:** Minor ambiguity in template reference

### Current Text (AMBIGUOUS)

```markdown
Create this file with ALL orchestrator content from Part 8:
```

### Corrected Text

```markdown
Create this file with ALL orchestrator content from Part 8.2:
```

### Rationale

Part 8 has TWO sections:
- 8.1: CLAUDE.md Template
- 8.2: ORCHESTRATOR.md Template

Specifying "Part 8.2" removes any ambiguity about which template to use for ORCHESTRATOR.md.

---

## Implementation Notes

### For a code/ agent implementing these fixes:

1. **Tool:** Use Edit tool with exact string matching
2. **Verification:** Run grep to confirm changes applied correctly
3. **Testing:** No runtime testing needed (documentation only)

### Edit Commands

```python
# Fix #1
Edit(
    file_path="D:/ActionFlowsDashboard/.claude/bootstrap.md",
    old_string="| Orchestration guide | `.claude/CLAUDE.md` with Rules 1-11 | Orchestrator behavior is project-independent |",
    new_string="| Orchestration guide | `.claude/actionflows/ORCHESTRATOR.md` with Rules 1-11 | Orchestrator behavior is project-independent |\n| Project context | `.claude/CLAUDE.md` | Project-specific values auto-loaded by all agents |"
)

# Fix #2
Edit(
    file_path="D:/ActionFlowsDashboard/.claude/bootstrap.md",
    old_string="Create this file with ALL orchestrator content from Part 8:",
    new_string="Create this file with ALL orchestrator content from Part 8.2:"
)
```

---

## Verification After Fixes

After applying both fixes, verify:

```bash
# Check Fix #1 applied
grep -n "ORCHESTRATOR.md with Rules 1-11" .claude/bootstrap.md

# Check Fix #2 applied
grep -n "Part 8.2:" .claude/bootstrap.md

# Ensure no remaining stale references
grep -n "CLAUDE.md with Rules" .claude/bootstrap.md
```

Expected output:
- Line 451 should reference ORCHESTRATOR.md (not CLAUDE.md)
- Line 452 should reference CLAUDE.md as project context
- Line 2190 should say "Part 8.2" (not "Part 8")

---

## Optional Enhancements (Not Required)

### Enhancement A: Part 8 Header Note

Add a quick-reference note at the start of Part 8:

```markdown
## Part 8: File Templates for CLAUDE.md and ORCHESTRATOR.md

**Quick reference:** 8.1 = CLAUDE.md (project context), 8.2 = ORCHESTRATOR.md (orchestrator rules)

**Builder Note:** In Step 9, you will create TWO separate files...
```

### Enhancement B: Cross-Reference Notes

In Step 9a (line ~2157):
```markdown
#### 9a. Create `.claude/CLAUDE.md` — Lean Project Context

→ **Template:** See Part 8.1

**If file exists:** Preserve existing project context...
```

In Step 9b (line ~2186):
```markdown
#### 9b. Create `.claude/actionflows/ORCHESTRATOR.md` — Orchestrator Guide

→ **Template:** See Part 8.2

**IMPORTANT:** This file is read ONLY by the orchestrator...
```

These enhancements improve navigation but are not critical for correctness.
