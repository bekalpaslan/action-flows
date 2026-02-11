# Cleanup Flow

> Human-directed repository cleanup — analyze, plan, execute, review, and commit.

---

## When to Use

- Repository artifact cleanup (build outputs, temporary files, logs)
- Dead code removal (unused components, orphaned files)
- Dependency pruning (unused packages, stale imports)
- Documentation cleanup (duplicate, outdated, or orphaned docs)
- Test artifact cleanup (generated files, snapshots, reports)
- Any housekeeping where human describes WHAT to clean

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| target | What to clean up | "migration report artifacts in root directory" |
| scope | Where to look (optional) | "root directory only" or "entire repository" (default: auto-detect) |

---

## Action Sequence

### Step 1: Analyze Cleanup Scope

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: inventory
- scope: {scope from human, or auto-detect based on target}
- context: Cleanup target: {target from human}. Identify all files/directories matching the cleanup criteria. Categorize by type, assess safety of removal, flag any that require preservation or special handling.
```

**Gate:** Analysis delivered with:
- Complete list of files/directories to remove
- Categorization by type (artifacts, logs, dead code, etc.)
- Safety assessment (safe to delete, preserve, git-tracked, etc.)
- Recommended removal strategy

---

### Step 2: Plan Cleanup Execution

**Action:** `.claude/actionflows/actions/plan/`
**Model:** opus

**Spawn after Step 1:**
```
Read your definition in .claude/actionflows/actions/plan/agent.md

Input:
- requirements: Create precise cleanup execution plan based on analysis
- context: Analysis from Step 1, safety assessments, removal candidates
- depth: detailed
```

**Output:** Detailed execution plan with:
1. Exact files/directories to remove (full paths)
2. Removal method (git rm, rm, directory cleanup)
3. Order of operations (dependencies)
4. Files to preserve (if any)
5. Prevention recommendations (.gitignore updates, build script fixes, etc.)

**Gate:** Execution plan delivered with unambiguous steps.

---

### Step 3: HUMAN GATE

Present the cleanup plan for approval. Human reviews:
- All files/directories marked for removal
- Removal methods
- Prevention recommendations

Human decides:
- APPROVE (proceed to Step 4)
- MODIFY (adjust plan, return to Step 2)
- CANCEL (abort cleanup)

---

### Step 4: Execute Cleanup

**Action:** `.claude/actionflows/actions/code/`
**Model:** haiku

**Spawn after Human approves:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Execute cleanup per approved plan from Step 2
- context: Execution plan with exact paths, removal methods, and prevention measures
- component: repository
```

**Execution order:**
1. Remove files/directories per plan (using git rm for tracked files, rm for untracked)
2. Apply prevention measures (.gitignore updates, script fixes)
3. Verify clean git status (no unintended removals)

**Gate:** All operations completed, git status clean.

---

### Step 5: Review Results

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet

**Spawn after Step 4:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: All modified/removed files and prevention measures
- type: cleanup-review
```

**Review focuses on:**
- All targeted files/directories removed
- No unintended deletions
- Prevention measures in place
- Git history preserved (removed files tracked correctly)
- .gitignore or build script updates correct

**Gate:** Verdict delivered (APPROVED or NEEDS_CHANGES).

---

### Step 6: Second Opinion

**Action:** `.claude/actionflows/actions/second-opinion/`
**Model:** opus

**Spawn after Step 5:**
```
Read your definition in .claude/actionflows/actions/second-opinion/agent.md

Input:
- review-log: {log path from Step 5}
- focus: Verify no critical files removed, prevention measures adequate, cleanup complete
```

**Gate:** Second opinion delivered (CONCUR or DISSENT).

---

### Step 7: Handle Verdict

- **APPROVED + CONCUR** → Proceed to post-completion (commit)
- **NEEDS_CHANGES** or **DISSENT** → Back to Step 4 with feedback

---

## Dependencies

```
Step 1 → Step 2 → Step 3 (HUMAN GATE) → Step 4 → Step 5 → Step 6 → Step 7 (verdict gate)
                                          ↑_____________________↓ (if NEEDS_CHANGES/DISSENT)
```

**Parallel groups:** None — sequential with approval gate and possible loop.

---

## Chains With

- → `post-completion/` (when review APPROVED and second opinion CONCURS)
- ← Cleanup requests route here

---

## Safety Guardrails

1. **Always use git rm** for tracked files (preserves history)
2. **Human approval required** before any deletions
3. **Prevention measures** recommended to avoid recurrence
4. **Verify git status** before and after cleanup
5. **Rollback plan:** Git history allows reverting all removals

---

## Output Artifacts

- `.claude/actionflows/logs/analyze/cleanup-{datetime}/analysis.md` — Full cleanup analysis
- `.claude/actionflows/logs/plan/cleanup-{datetime}/plan.md` — Execution plan
- `.claude/actionflows/logs/code/cleanup-{datetime}/changes.md` — Execution log
- `.claude/actionflows/logs/review/cleanup-{datetime}/review.md` — Review results
- `.claude/actionflows/logs/second-opinion/cleanup-{datetime}/opinion.md` — Second opinion
