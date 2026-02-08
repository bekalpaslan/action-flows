# Planning Flow

> Structured roadmap review and prioritization sessions.

---

## When to Use

- Orchestrator needs to understand "what's next"
- Human requests roadmap status ("what's next?", "show priorities", "review roadmap")
- Human requests reprioritization ("update roadmap", "reprioritize", "adjust priorities")
- After major milestone completion (check if priorities shifted)
- Weekly/biweekly roadmap review sessions

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| mode | Operation mode | "review" or "update" |
| context | Optional focus area | "backend", "frontend", "security", or omit for full roadmap |

---

## Action Sequence

### Step 1: Analyze Current State

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: roadmap-status
- scope: ROADMAP.md, .claude/actionflows/logs/INDEX.md, .claude/actionflows/LEARNINGS.md
- context: {context from human if provided, else "full roadmap"}
```

**Output:** Analysis of:
- What shipped since last update (check INDEX.md for recent completions)
- What's in progress (items with status=in-progress)
- What's blocked (items in Blocked section)
- What's next (items in Immediate tier, not-started)
- Priority drift (items that should move tiers based on new learnings)

**Gate:** Current state analysis delivered.

---

### Step 2: Prioritization Plan

**Action:** `.claude/actionflows/actions/plan/`
**Model:** sonnet

**Spawn after Step 1:**
```
Read your definition in .claude/actionflows/actions/plan/agent.md

Input:
- requirements: Based on analysis from Step 1, produce prioritization recommendations for ROADMAP.md
- context: Current ROADMAP.md content, analysis from Step 1
- depth: high-level
```

**Output:** Recommendations for:
- Items to move between tiers (e.g., "R-020 should move from Short-Term to Immediate")
- Items to mark as done (completed since last update)
- Items to mark as blocked (new blockers discovered)
- New items to add (from LEARNINGS.md or recent discoveries)
- Priority changes (P0 → P1, etc.)

**Gate:** Prioritization plan delivered.

---

### Step 3: Mode Branch

**If mode = "review":**
- Present analysis and plan to human
- Flow ends (no changes to ROADMAP.md)

**If mode = "update":**
- Proceed to Step 4 (HUMAN GATE)

---

### Step 4: HUMAN GATE (update mode only)

Present prioritization plan for approval. Human reviews proposed changes, can accept/modify/reject.

- **Accept:** Proceed to Step 5
- **Modify:** Human provides adjustments, loop back to Step 2 with modifications
- **Reject:** Flow ends (no changes)

---

### Step 5: Update ROADMAP.md (update mode only)

**Action:** `.claude/actionflows/actions/code/`
**Model:** haiku

**Spawn after Human approves Step 4:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Update ROADMAP.md per approved prioritization plan from Step 4
- context: Approved plan, current ROADMAP.md, guidelines in ROADMAP.md "How to Use" section
```

**Output:** ROADMAP.md updated with:
- Items moved between tiers
- Status changes (not-started → in-progress → done)
- Priority changes
- New items added
- Blocked items moved to/from Blocked section
- Last Updated timestamp updated
- Updated By field set to orchestrator name

**Gate:** ROADMAP.md updated successfully.

---

### Step 6: Commit Changes (update mode only)

**Action:** `.claude/actionflows/actions/commit/`
**Model:** haiku

**Spawn after Step 5:**
```
Read your definition in .claude/actionflows/actions/commit/agent.md

Input:
- summary: Roadmap update: {brief summary of changes}
- files: ROADMAP.md
```

**Output:** Changes committed to git with descriptive message.

**Gate:** Commit successful.

---

## Dependencies

**Review Mode:**
```
Step 1 → Step 2 → (present and end)
```

**Update Mode:**
```
Step 1 → Step 2 → Step 3 (branch) → Step 4 (HUMAN GATE) → Step 5 → Step 6
```

**Parallel groups:** None — fully sequential.

---

## Chains With

- ← Triggered after major milestone completions
- ← Triggered on weekly/biweekly review schedule
- → `post-completion/` (after Step 6 in update mode)

---

## Examples

**Review Mode Example:**
```
Human: "What's next on the roadmap?"
Orchestrator: [Routes to planning/ flow, review mode]
Output: Status report showing current priorities, what shipped, what's blocked
```

**Update Mode Example:**
```
Human: "We just shipped Dashboard screen (M4). Update roadmap priorities."
Orchestrator: [Routes to planning/ flow, update mode]
Output: Updated ROADMAP.md with M4 items marked done, priorities reshuffled, next milestone items promoted to Immediate tier
```

---

## Mode Selection Guidelines

| Scenario | Mode | Rationale |
|----------|------|-----------|
| "What's next?" | review | Human wants information, no changes needed |
| "Show priorities" | review | Read-only status check |
| "Review roadmap" | review | General status inquiry |
| "Update roadmap" | update | Human explicitly requests changes |
| "Reprioritize" | update | Implies changes to priorities |
| "Mark X as done" | update | Requires ROADMAP.md modification |
| After milestone completion | update | Priorities likely shifted, update needed |
| Weekly review | review | Regular status check, changes only if needed |

---
