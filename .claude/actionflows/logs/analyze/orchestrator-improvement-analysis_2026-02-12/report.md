# Orchestrator Improvement Analysis

> **Scope:** Framework evolution — learnings protocol, harmony layer, immune system, structural gaps
> **Date:** 2026-02-12
> **Context:** Post-exploration of orchestration framework + project source (21K+ lines, 112 files, 95% complete)

---

## 1. Learnings Protocol — Current State & Gaps

### What Exists

The learnings protocol has three touchpoints:

| Component | Location | Role |
|-----------|----------|------|
| Rule 4 | ORCHESTRATOR.md:117 | "Fix root causes, not symptoms" — Stop → Diagnose → Root cause → Fix source → Document |
| Rule 5 | ORCHESTRATOR.md:119 | Surface agent learnings to human, ask approval before fixing |
| LEARNINGS.md | logs/LEARNINGS.md | Persistent memory — anti-patterns, proven approaches |

Agent outputs use a required learnings format (from `_abstract/agent-standards/instructions.md`):
```
## Learnings
**Issue:** {what happened}
**Root Cause:** {why}
**Suggestion:** {how to prevent}
[FRESH EYE] {discovery if any}
Or: None — execution proceeded as expected.
```

### What's Missing

**1. No aggregation pipeline.** Learnings exist in individual agent outputs (scattered across `logs/{action}/{datetime}/` folders) and in LEARNINGS.md (manual). There's no defined process for how a learning moves from agent output → LEARNINGS.md. The orchestrator is supposed to "check for learnings in every completion" but there's no structured extraction — it's a prose read of agent outputs.

**2. No structured schema.** LEARNINGS.md is freeform markdown. The agent output format has structure (Issue/Root Cause/Suggestion) but LEARNINGS.md loses that structure when entries are manually transcribed. There's no machine-parseable format that downstream systems (or future orchestrator sessions) can reliably query.

**3. No categorization taxonomy.** Learnings are loosely grouped ("By Action Type", "Anti-Patterns", "Proven Approaches") but there's no defined taxonomy. As learnings accumulate, they'll become a flat wall of text without reliable retrieval.

**4. No feedback loop closure.** A learning is documented, but there's no mechanism to verify it was applied. If an anti-pattern is recorded, nothing prevents the same pattern from recurring — the orchestrator has to manually remember to check LEARNINGS.md and apply it.

**5. No severity or frequency tracking.** A learning that fires once vs. one that fires repeatedly look identical. There's no count, no "last seen", no escalation for recurring issues.

---

## 2. The Harmony Layer — Structured Gate Outputs

### Concept

The harmony layer formalizes the boundary between "what agents produce" and "what the orchestrator consumes." Currently, the orchestrator reads agent outputs as prose and makes judgment calls. The harmony layer replaces that with structured gate outputs.

### Current State (Implicit Harmony)

Today, gates exist informally:

| Gate | Location | Format |
|------|----------|--------|
| Review verdict | review/agent.md | APPROVED or NEEDS_CHANGES (structured) |
| Audit severity | audit/agent.md | CRITICAL/HIGH/MEDIUM/LOW (structured) |
| Test results | test/agent.md | pass/fail/skip counts (structured) |
| Learnings | agent-standards | Issue/Root Cause/Suggestion (semi-structured) |
| Step completion | ORCHESTRATOR.md:177 | Free text one-liner (unstructured) |

The review agent produces a structured verdict. The audit agent produces severity categories. But these aren't consumed programmatically — the orchestrator reads the markdown and interprets it.

### Proposed Harmony Layer

Every agent output should include a **machine-readable gate block** at the top:

```yaml
---
gate:
  verdict: APPROVED | NEEDS_CHANGES | BLOCKED | FAILED
  severity: none | low | medium | high | critical
  metrics:
    files_changed: 3
    issues_found: 0
    tests_passed: 12
    tests_failed: 0
  learnings:
    - type: anti-pattern | proven-approach | fresh-eye
      issue: "what happened"
      root_cause: "why"
      suggestion: "how to prevent"
      action_type: code | review | audit | test | analyze
      frequency: first | recurring
  blocks: []  # list of step IDs this output blocks
  unblocks: []  # list of step IDs this output enables
---
```

### What This Enables

1. **Automated chain flow control** — The orchestrator reads `verdict` to decide continue/loop/abort without parsing prose
2. **Learning extraction** — Structured `learnings` array replaces manual scanning
3. **Metric aggregation** — Cross-chain metrics become queryable
4. **Dependency signaling** — `blocks`/`unblocks` enable dynamic chain recompilation

### Implementation Path

This is a change to `_abstract/agent-standards/instructions.md` — add the gate block as a required output prefix. Each action's agent.md then defines which gate fields it populates. The orchestrator's step completion handler parses the YAML frontmatter before reading the prose body.

---

## 3. The Immune System — Self-Correcting Flows

### Concept

The immune system is a set of flows that consume structured learnings and produce corrections — without human intervention for known patterns, with human approval for novel patterns.

### Current State (Manual Immune Response)

Today, the "immune response" is:
1. Agent discovers issue → writes to learnings section
2. Orchestrator reads agent output → notices learning
3. Orchestrator surfaces learning to human (Rule 5)
4. Human approves fix
5. Orchestrator compiles a new chain to implement fix
6. Fix is implemented, learning documented in LEARNINGS.md

This is effective but **entirely manual**. Every immune response requires human involvement and orchestrator attention.

### Proposed Immune System

Three tiers of automated response:

| Tier | Trigger | Response | Human Approval |
|------|---------|----------|----------------|
| **Tier 1: Known patterns** | Learning matches entry in LEARNINGS.md | Auto-apply proven fix | No (pre-approved) |
| **Tier 2: Recurring signals** | Same learning fires 2+ times across chains | Compile fix chain + propose framework change | Yes (fix) + Yes (framework) |
| **Tier 3: Novel discoveries** | [FRESH EYE] or unmatched pattern | Surface to human with context | Yes (always) |

### Required Components

1. **Learning matcher** — Compares new learnings against LEARNINGS.md entries (pattern matching on issue + root cause)
2. **Auto-fix registry** — Extends LEARNINGS.md with a `fix` field that contains an action reference (e.g., `fix: code/backend task="apply zod validation to route"`)
3. **Frequency tracker** — Count occurrences per learning pattern (stored in LEARNINGS.md or separate file)
4. **Escalation rules** — When a Tier 1 auto-fix fails, escalate to Tier 2. When Tier 2 recurs 3+ times, escalate to Tier 3 with a framework health check.

### Implementation Path

This is a new flow: `framework/immune-response/`. It chains:
1. `analyze/` — Parse learning, match against LEARNINGS.md, determine tier
2. If Tier 1: `code/` — Apply known fix (no approval gate)
3. If Tier 2: Present chain for approval → `code/` → `review/` → `post-completion/`
4. If Tier 3: Surface to human → stop (human decides)

The flow is triggered by the orchestrator's step boundary evaluation (trigger #1: Agent Output Signals) when a learning is detected in the gate block.

---

## 4. Structural Issues (from existing analysis + fresh findings)

### Previously Identified (15 issues from orchestrator-status analysis)

The existing analysis at `logs/analyze/orchestrator-status_2026-02-12-07-37-01/` identified 15 issues. Key ones still unresolved:

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | CRITICAL | Hardcoded wrong working directory (D:/ActionFlowsDashboard) | Unresolved |
| 2 | HIGH | CLAUDE.md duplicates project.config.md | Unresolved |
| 4 | HIGH | Permissions table contradicts Quick Triage | Unresolved |
| 5 | MEDIUM | post-completion name collision (abstract action + flow) | Unresolved |
| 8 | MEDIUM | update-queue orphaned (no agents use it) | Unresolved |

### Fresh Findings

**6 new observations from this analysis:**

**F1. Zero real executions (HIGH)**
The framework has never been exercised for actual project work. One self-analysis exists. This means all flow definitions, agent instructions, and chain patterns are untested in practice. The first real execution will likely surface issues that static analysis can't find.

**Recommendation:** Run a controlled end-to-end chain (e.g., fix one of the 3 remaining TODOs in the project source) to validate the full pipeline: routing → chain compilation → agent spawn → execution → post-completion → registry update.

**F2. INDEX.md "By Pattern Signature" and "By Intent Type" sections never populated (MEDIUM)**
These sections exist as scaffolding but have no entries. The post-completion flow/abstract action should populate them, but since no chain has completed, it's unclear if the instructions actually produce correct entries.

**F3. Checklist system deferred but referenced (LOW)**
ORCHESTRATOR.md and review/agent.md reference checklists as inputs, but the checklist system is empty scaffolding. This is intentionally deferred, but the references create a ghost dependency — agents will silently skip checklist processing when none exist.

**F4. Project source is 95% complete — framework overhead may exceed remaining work (OBSERVATION)**
The project has 112 source files, 21K lines, and only 4 minor TODOs remaining. The orchestration framework (43 files, ~3K lines of instructions) is significant overhead for the remaining work. This isn't a problem if the framework serves future projects, but for this project specifically, most of the heavy lifting is done.

**F5. Hook system and MCP server are production-ready but untested with the orchestrator (MEDIUM)**
The hooks package sends lifecycle events (session start/end, step spawned/completed, output capture) to the backend. The MCP server exposes command checking. But neither has been tested in an orchestrated chain — the integration point between "Claude Code hooks fire" and "orchestrator receives events" is unvalidated.

**F6. Six step-boundary evaluation triggers undefined (MEDIUM)**
ORCHESTRATOR.md:188-194 lists six triggers (Agent Output Signals, Pattern Recognition, Dependency Discovery, Quality Threshold, Chain Redesign Initiative, Reuse Opportunity) but none are defined. These are the exact triggers the immune system would hook into — they need formal definitions before the immune system can be built.

---

## 5. Improvement Priority Matrix

| Priority | Improvement | Effort | Impact | Prerequisite For |
|----------|-------------|--------|--------|------------------|
| P0 | Fix hardcoded working directory | 5 min | Blocks correctness | Everything |
| P0 | First real chain execution (validate pipeline) | 1 chain | Validates framework | Learnings, immune system |
| P1 | Define 6 step-boundary triggers | Medium | Enables immune system | Immune system |
| P1 | Structured gate outputs (harmony layer) | Medium | Machine-readable agents | Immune system, metrics |
| P1 | Resolve CLAUDE.md / project.config.md duplication | Small | Single source of truth | Clarity |
| P2 | Immune system flow (framework/immune-response/) | Large | Self-correcting framework | Harmony layer, triggers |
| P2 | Learning aggregation pipeline | Medium | Structured knowledge base | Harmony layer |
| P2 | Resolve post-completion name collision | Small | Reduces confusion | Clarity |
| P3 | Remove orphaned update-queue | Small | Reduces dead code | — |
| P3 | Populate checklist system | Medium | Enables review quality | — |
| P3 | Hook/MCP integration test | Medium | Validates lifecycle events | — |

---

## 6. Recommended Execution Order

1. **Fix P0 blockers** — hardcoded directory, run first real chain
2. **Define step-boundary triggers** — formalize the 6 triggers as structured rules
3. **Implement harmony layer** — add gate block to agent-standards, update each agent.md
4. **Build learning pipeline** — structured extraction from gate blocks → LEARNINGS.md
5. **Build immune system** — framework/immune-response/ flow consuming structured learnings
6. **Clean up** — name collisions, orphans, duplication, checklists

Steps 1-3 are foundational. Steps 4-5 build on them. Step 6 is housekeeping that can happen anytime.

---

## Learnings

**Issue:** Framework is structurally complete but operationally unvalidated
**Root Cause:** Build-first approach — all components designed before any were exercised
**Suggestion:** Adopt a "validate as you build" cadence — run real chains after every structural addition

[FRESH EYE] The learnings protocol is the embryonic form of both the harmony layer and the immune system. The three concepts share a single data flow: agent output → structured extraction → pattern matching → response. Building them as one coherent pipeline (rather than three separate features) would prevent architectural fragmentation.
