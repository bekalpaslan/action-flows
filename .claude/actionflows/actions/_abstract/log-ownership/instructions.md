# Log Ownership Pattern

**Purpose:** Formalize the log path ownership principle used by all ActionFlows agents.

---

## Principle

**Orchestrator provides WHERE. Agent provides WHAT.**

This separation creates clean coordination:
- Orchestrator manages chain-level tracking and path strategy
- Agent owns folder creation and content delivery
- Both roles are independent yet harmonious

---

## Decision Gate

Before spawning an agent, the orchestrator asks: **"Does this output need chain-level tracking?"**

**YES → Orchestrator provides path in spawn prompt**
- Chain needs to aggregate logs from multiple agents
- Chain-level summary references agent outputs
- Logs are part of a larger workflow narrative

**NO → Agent uses default pattern**
- Standalone execution (e.g., ad-hoc analysis request)
- Agent output is terminal (no chain aggregation)
- Default path works: `.claude/actionflows/logs/{action}/{description}_{datetime}/`

---

## Orchestrator Responsibilities

### 1. Provide Path in Spawn Prompt

When spawning an agent, include the log path explicitly:

```markdown
## Inputs
- **task:** {task description}
- **scope:** {scope}
- **save_to:** .claude/actionflows/logs/{action}/{description}_{datetime}/
```

**Path format:** `.claude/actionflows/logs/{action}/{description}_{YYYY-MM-DD-HH-MM-SS}/`

**Components:**
- `{action}` = Action type (analyze, code, review, etc.)
- `{description}` = Kebab-case task description (e.g., `log-ownership-abstract`)
- `{datetime}` = Timestamp using `date +%Y-%m-%d-%H-%M-%S`

### 2. Include Path in Step-Completion Message

After agent completes, reference the log path:

```
>> Step N complete: {action}/ -- {summary}. Log: {path}
```

This creates traceability in the chain execution narrative.

### 3. Aggregate Chain-Level Logs

For flows that produce chain-level summaries:
- Collect paths from all agents
- Reference agent logs in summary
- Create index of chain outputs

---

## Agent Responsibilities

### 1. Create Folder via Abstract

All agents (except `commit/`) extend `_abstract/create-log-folder/`:

```markdown
## Extends

This agent follows these abstract action standards:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` — Datetime log folder for outputs

**When you need to:**
- Follow behavioral standards → Read: `.claude/actionflows/actions/_abstract/agent-standards/instructions.md`
- Create log folder → Read: `.claude/actionflows/actions/_abstract/create-log-folder/instructions.md`
```

### 2. Save Deliverables to Provided Path

If orchestrator provides `save_to` input:
```bash
# Use provided path
LOG_FOLDER="${save_to}"
```

If no path provided:
```bash
# Use default pattern
datetime=$(date +%Y-%m-%d-%H-%M-%S)
LOG_FOLDER=".claude/actionflows/logs/${ACTION_TYPE}/${description}_${datetime}/"
mkdir -p "${LOG_FOLDER}"
```

### 3. Return Path in Completion Message

Agent completion message MUST include:
```markdown
Log folder: {absolute_path}
```

This enables orchestrator to reference the output.

---

## Standard Elements

### Datetime Format

**Canonical:** `YYYY-MM-DD-HH-MM-SS`

**Implementation:**
```bash
datetime=$(date +%Y-%m-%d-%H-%M-%S)
```

**Example:** `2026-02-13-02-14-35`

### Folder Structure

**Standard pattern:**
```
.claude/actionflows/logs/{action-type}/{description}_{datetime}/
```

**Examples:**
- `.claude/actionflows/logs/analyze/log-ownership-survey_2026-02-13-02-12-07/`
- `.claude/actionflows/logs/code/auth-changes_2026-02-05-14-30-45/`
- `.claude/actionflows/logs/review/api-refactor_2026-01-20-08-15-30/`

**Intentional variations:**
- `narrate/`: Uses `chapter-{N}_{datetime}/` (chapter tracking)
- `test/playwright/`: Uses `{target}_{datetime}/` (test target tracking)
- `onboarding/`: Uses `completion_{datetime}/` (session milestone)

These variations are **documented exceptions** that serve domain-specific needs.

### Primary Deliverables

Each action type has a canonical primary file:

| Agent Type | Primary Deliverable | Purpose |
|------------|---------------------|---------|
| analyze | `report.md` | Analysis findings |
| audit | `audit-report.md` | Quality audit results |
| brainstorm | `session-transcript.md` | Ideation session record |
| code/* | `changes.md` | Implementation summary |
| diagnose | `root-cause-analysis.md` | RCA findings |
| isolate | `quarantine-record.md` | Quarantine tracking |
| narrate | `chapter-{N}.md` | Narrative chapter |
| onboarding | Multiple files | Progressive disclosure |
| plan | `plan.md` | Planning document |
| review | `review-report.md` | Code review findings |
| second-opinion | `second-opinion-report.md` | Critique report |
| test | `test-results.md` | Test execution results |
| verify-healing | `healing-verification.md` | Healing verification |

**Rule:** Deliverable name reflects action purpose (not generic "output.md").

---

## Exception: Commit Agent

**Status:** Does NOT follow log ownership pattern.

**Rationale:**
- Atomic operation (git commit + push)
- No persistent logging needed
- Reports result directly to orchestrator (commit hash + push status)

**Extends:** Only `_abstract/agent-standards` (NOT `_abstract/create-log-folder`)

---

## Trace Contract Integration

All agents document trace requirements in their `agent.md`:

```markdown
## Trace Contract

**Log folder:** `.claude/actionflows/logs/{action}/{description}_{datetime}/`
**Default log level:** DEBUG
**Log types produced:** (see `LOGGING_STANDARDS_CATALOG.md` § Part 2)
- `agent-reasoning` — Implementation approach and pattern decisions
- `tool-usage` — File reads, edits, writes, shell commands
```

**Trace depth:**
- **INFO:** Primary deliverable only
- **DEBUG:** + Tool calls + reasoning
- **TRACE:** + All alternatives considered + exploration

---

## Pattern Status

**Maturity:** ✅ **PRODUCTION**

**Coverage:** 16/17 agents (94%)

**Survey Date:** 2026-02-13

**Survey Report:** `.claude/actionflows/logs/analyze/log-ownership-survey_2026-02-13-02-12-07/report.md`

---

## Cross-References

- **Abstract Action:** `_abstract/create-log-folder/`
- **Survey Report:** `.claude/actionflows/logs/analyze/log-ownership-survey_2026-02-13-02-12-07/report.md`
- **Logging Standards:** `.claude/actionflows/docs/standards/LOGGING_STANDARDS_CATALOG.md`
- **Agent Standards:** `_abstract/agent-standards/`
