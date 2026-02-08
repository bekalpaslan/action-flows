# Documentation Reorganization Flow

> Analyze, plan, and execute documentation structure improvements.

---

## When to Use

- Documentation structure has become fragmented or unclear
- Root-level .md files have accumulated outside proper directories
- Documentation needs consolidation or reorganization
- Cross-references between docs are stale or broken

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| scope | What to analyze | "all .md files" or "root-level docs only" |
| execute | Whether to execute or plan only | "plan-only" or "execute" (default: plan-only) |

---

## Action Sequence

### Step 1: Analyze Documentation

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- target: All .md files in repository (excluding node_modules/, .git/, packages/*/dist/)
- focus: Categorization, misplacement detection, consolidation opportunities, cross-reference mapping
- output-format: Structured analysis with file counts, proposed moves, consolidations, and new structure
```

**Gate:** Analysis delivered with:
- Total file count and current distribution
- Misplaced files with proposed destinations
- Files that can be consolidated
- Proposed new directory structure
- Cross-references requiring updates

---

### Step 2: HUMAN GATE

Present the analysis findings for approval. Human reviews:
- Proposed directory structure
- Files to move/consolidate
- Cross-reference updates
- Any files to keep in current location

Human decides:
- APPROVE (proceed to Step 3)
- MODIFY (provide adjustments, return to Step 1)
- CANCEL (abort flow)

---

### Step 3: Plan Reorganization Execution

**Action:** `.claude/actionflows/actions/plan/`
**Model:** opus

**Spawn after Human approves:**
```
Read your definition in .claude/actionflows/actions/plan/agent.md

Input:
- requirements: Create precise execution plan for doc reorganization based on approved analysis
- context: Analysis from Step 1, approved structure, human adjustments
- depth: detailed
```

**Output:** Detailed execution plan with:
1. Exact directories to create (full paths)
2. Exact file moves (source -> destination, using git mv)
3. Exact consolidations (which files merge, consolidation strategy)
4. Exact cross-reference updates (file, old text -> new text)
5. New files to create (INDEX.md, guides, etc.)
6. Order of operations with dependencies

**Gate:** Execution plan delivered with unambiguous steps.

---

### Step 4: HUMAN GATE

Present the execution plan for final approval. Human reviews:
- All proposed git mv operations
- Consolidation strategies
- New file content (INDEX.md, etc.)
- Cross-reference updates

Human decides:
- APPROVE (proceed to Step 5)
- MODIFY (adjust plan, return to Step 3)
- CANCEL (abort execution)

---

### Step 5: Execute Reorganization

**Action:** `.claude/actionflows/actions/code/`
**Model:** haiku

**Spawn after Human approves plan:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Execute doc reorganization per approved plan from Step 3
- context: Execution plan with exact paths, moves, consolidations, and updates
- component: docs
```

**Execution order:**
1. Create new directories
2. Create new files (INDEX.md)
3. Execute git mv for file moves (preserves git history)
4. Consolidate files (merge content, delete sources with git rm)
5. Update cross-references in all affected files
6. Verify no broken links remain

**Gate:** All operations completed, no broken references.

---

### Step 6: Review Results

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet

**Spawn after Step 5:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: All modified/moved/created documentation files
- type: documentation-review
```

**Review focuses on:**
- New directory structure clarity
- INDEX.md completeness and accuracy
- Cross-reference correctness
- No broken links
- Content preservation in consolidations
- Git history preservation (moved files tracked correctly)

**Gate:** Verdict delivered (APPROVED or NEEDS_CHANGES).

---

### Step 7: Handle Verdict

- **APPROVED** -> Proceed to post-completion
- **NEEDS_CHANGES** -> Back to Step 5 with review feedback

---

## Dependencies

```
Step 1 -> Step 2 (HUMAN GATE) -> Step 3 -> Step 4 (HUMAN GATE) -> Step 5 -> Step 6 -> Step 7 (verdict gate)
                                                                  ^_____________________| (if NEEDS_CHANGES)
```

**Parallel groups:** None -- fully sequential with approval gates and possible loop.

---

## Chains With

- -> `post-completion/` (when review APPROVED)
- Can be invoked standalone or as part of framework-health checks

---

## Safety Guardrails

1. **Always use git mv** (never raw mv) to preserve file history
2. **Human approval required** before any file operations
3. **Verify cross-references** before and after moves
4. **Consolidation strategy** must preserve all unique content
5. **Rollback plan:** Git history allows reverting all moves/consolidations

---

## Output Artifacts

- `.claude/actionflows/logs/analyze/{datetime}/analysis.md` -- Full analysis
- `.claude/actionflows/logs/plan/{datetime}/plan.md` -- Execution plan
- `.claude/actionflows/logs/code/{datetime}/changes.md` -- Execution log
- `docs/INDEX.md` -- New documentation map (created during execution)
