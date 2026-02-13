# Agent Standards

> Core behavioral standards for all agents.

## Core Principles

### 1. Single Responsibility
Each agent does one thing well. One clear mission per agent. Split complex workflows into phases.

### 2. Token Efficiency
- **Grep before Read:** Find what you need, then read only those files
- Skip files that pass validation
- Summarize findings in tables, not prose

### 3. Fresh Eye Discovery
Notice issues OUTSIDE your explicit instructions. Tag with `[FRESH EYE]` in output.

### 4. Parallel Safety
Each parallel agent writes to its OWN file. Never assume exclusive access to shared files.

### 5. Verify, Don't Assume
Never trust filenames — always check contents before referencing.

### 6. Explicit Over Implicit
Use concrete file paths, not relative references. Provide examples for complex concepts.

### 7. Output Boundaries
- Assessment actions (analyze, review, audit): Write to `logs/{action}/{datetime}/`
- Implementation actions (code, test, commit): Write to project directories

### 8. Graceful Degradation
- Step fails: Continue with remaining, report failures
- File not found: Note "Not Configured", continue

### 9. Identity Boundary
- You are a task executor, not an orchestrator. Never read ORCHESTRATOR.md. Never route, delegate, or compile chains. Execute your agent.md instructions directly.

### 10. Pre-Completion Validation
- Before finalizing, validate all output files exist and are non-empty
- If you created a log folder, ensure it contains required output files
- Empty log folders break the execution registry — verify before completing

### 11. Output Boundary
- Assessment actions (analyze, review, audit) write to `logs/{action}/{datetime}/`
- Implementation actions (code, test, commit) write to project directories
- Never write outside your designated output location

### 12. Contract Compliance (for output-producing actions)

If your action produces structured output consumed by the dashboard (review reports, analysis reports, brainstorm transcripts):

- **Read the format specification** in `.claude/actionflows/CONTRACT.md` for your action type
- **Follow the exact markdown structure** defined in the contract
- **Include all required fields** — Missing fields cause harmony violations
- **Use correct enums/types** — Backend validates using contract-defined parsers
- **Test your output** — Run `pnpm run harmony:check` to validate output format

**Contract-defined actions:**
- **review/** → Review Report Structure (CONTRACT.md § Format 5.1)
  - Required: Verdict (APPROVED | NEEDS_CHANGES), Score (0-100), Summary, Findings table, Fixes Applied (if mode=review-and-fix), Flags for Human
- **analyze/** → Analysis Report Structure (CONTRACT.md § Format 5.2)
  - Required: Title, Aspect, Scope, Date, Agent, numbered analysis sections, Recommendations
- **brainstorm/** → Brainstorm Session Transcript (CONTRACT.md § Format 5.3)
  - Recommended structure (not strictly enforced): Idea, Classification, Transcript, Key Insights, Issues & Risks, Next Steps

**Why this matters:**
- The backend **parses your output** using contract-defined parsers
- If structure doesn't match → parsing fails → harmony violation logged
- Dashboard shows **"parsing incomplete"** and degrades gracefully
- Harmony detector **broadcasts violations** via WebSocket (visible in dashboard)

**Evolution process:** See `docs/architecture/CONTRACT_EVOLUTION.md` for adding/modifying formats

**Validation command:**
```bash
pnpm run harmony:check
```

**Not contract-defined:** Agent learnings, internal notes, working files, intermediate outputs. Only final deliverables consumed by dashboard are contract-defined.

### 13. Contract Format Completeness

When your action produces or modifies contract-defined formats (parsers, types, components in `packages/shared/src/contract/` or `packages/app/src/components/`):

1. **Read the format specification** in `.claude/actionflows/CONTRACT.md` § Format X.Y
2. **Verify your output scope**:
   - Parser implementation only? Mark as "Parser complete (33%)"
   - Frontend component only? Mark as "Component created (66%)"
   - Full integration? Mark as "Complete (100%)" and verify wiring
3. **Run validation** before completing:
   - Parser work: `pnpm run harmony:check`
   - Frontend work: Verify component is imported and rendered in a dashboard view
   - Integration work: Manual test + visual verification
4. **Surface incompleteness** in completion message:
   - If < 100%: "Format X is Y% complete. Remaining work: {list steps}"
   - If 100%: "Format X is complete end-to-end. Verified: spec + parser + frontend + integration."

**Critical:** Partial completions (< 100%) MUST be surfaced as **learnings** (escalation to orchestrator), NOT as "next steps" (optional suggestions). This triggers automatic follow-up chain compilation.

### 14. DIR.md Convention

Every code directory must contain a lightweight `DIR.md` file that serves as a manifest for agents to understand directory contents without reading individual files.

**Format:**
```markdown
# {directory-name}/

- subdirA/ → see subdirA/DIR.md
- fileA.ts — exports: exportA, exportB, exportC
- fileB.ts — exports: exportD
```

**Rules:**
- **When navigating code:** Read the target directory's `DIR.md` BEFORE reading individual files. This allows you to understand structure and identify what you actually need.
- **When modifying code:** After adding, removing, or renaming files or exports, update the directory's `DIR.md` immediately. Stale manifests break agent navigation.
- **Scope:** All directories under `packages/backend/src/`, `packages/app/src/`, `packages/shared/src/` must have DIR.md files (excluding `__tests__/`, `__mocks__/`, and `contracts/` directories).

**Why this matters:** Agents can scan DIR.md (100 bytes) instead of reading and parsing multiple 500-line TypeScript files. This dramatically reduces token consumption and accelerates code navigation.

---

## Learnings Output Format

Every agent MUST include:
```
## Learnings
**Issue:** {What happened}
**Root Cause:** {Why}
**Suggestion:** {How to prevent}
[FRESH EYE] {Discovery if any}
Or: None — execution proceeded as expected.
```

### Partial Completion Rule

If your work completes at < 100% of the full scope:
- **Treat this as a learning**, not a "next step"
- **Surface the gap explicitly**: "Work stopped at X% because Y"
- **Propose follow-up chain**: "Recommend queueing: action/scope"
- **Include Completion State field** in learnings output

**Distinction:**
- **Learning (escalation):** "Integration pending (66% complete) — recommend follow-up chain"
- **Next Step (optional):** "Future: Add dark mode styling" or "Optional: Add export to CSV"

Required work that is out of scope is a LEARNING. Optional enhancements are NEXT STEPS. Never mix these.

**Example:**
```
## Learnings

**Issue:** Format 6.1 parser + component implemented (66%) but integration pending
**Root Cause:** Integration requires modifying ConversationPanel, which was out of current scope
**Suggestion:** Queue follow-up chain: code/frontend/format-6-1-integration
**Completion State:** 66% (parser ✓, component ✓, integration ❌)
```

---

## Pre-Completion Validation

Before finishing, ALL agents must verify:

**Log Folder Checklist:**
- [ ] Log folder exists and contains output files
- [ ] Files are non-empty (> 0 bytes)
- [ ] Folder path follows `logs/{action-type}/{description}_{datetime}/` format
- [ ] Description is kebab-case, no spaces or special chars

**Why this matters:** Empty log folders corrupt the execution registry (INDEX.md). Agents MUST validate their output exists before completing.

## Cleanup Protocol

Before completing execution:
1. Verify ALL output files are in your assigned log folder
2. Verify you did NOT write any files to repository root
3. Remove any .tmp, .backup, or work-in-progress files you created
4. List all files created in your output summary

---

## Contract Contributions

This abstract extends all agent contracts with:

**Output Contract additions:**
- All agents MUST produce `## Learnings` section if discoveries found (see Standard #3)
- Learnings format: Issue, Root Cause, Suggestion (see Learnings Output Format above)

**Trace Contract additions:**
- All agents MUST validate output exists before completing (Standard #10)
- All agents MUST surface partial completions as learnings, not next-steps (Standard #13)
- All agents MUST produce `agent-reasoning` log type at DEBUG level

---

## Trace Standards

### Log Levels

All agents operate at one of five log levels:

| Level | Value | Use |
|-------|-------|-----|
| TRACE | 10 | Maximum verbosity, every decision point |
| DEBUG | 20 | Reasoning steps, decision alternatives (default for most agents) |
| INFO | 30 | Key decisions, state changes, milestones |
| WARN | 40 | Warnings, deferred work, incomplete states |
| ERROR | 50 | Failures, unrecoverable errors |

**Level Selection:**
- Standard chains: INFO
- Debugging failing chains: DEBUG
- Deep investigation: TRACE
- High-stakes work: DEBUG

### Log Type: tool-usage

Every tool call MUST be logged:

```yaml
timestamp: ISO 8601
tool: [Bash|Read|Glob|Grep|Edit|Write|Task|etc]
operation: [command for Bash, file_path for Read, pattern for Glob, etc]
caller: [orchestrator|analyze|code|review|etc]
purpose: [why was this tool used?]
status: [started|completed|error]
result_summary: [brief outcome]
duration_ms: [execution time]
```

### Log Type: agent-reasoning

Agents MUST log internal reasoning at DEBUG+ level:

```yaml
timestamp: ISO 8601
agent: [action-type/subtype]
task: [assigned task]
phase: [startup|analysis|reasoning|decision|execution|completion]
reasoning: [what is agent thinking?]
alternatives: [options considered]
chosen_approach: [which approach selected]
confidence: [high|medium|low]
next_step: [what will happen next]
```

### Log Type: data-flow

Data processing operations MUST be logged:

```yaml
timestamp: ISO 8601
operation: [read|transform|write|parse|validate]
source: [file path or origin]
destination: [file path or destination]
data_type: [json|markdown|typescript|yaml|csv|etc]
record_count: [number of records/lines processed]
validation_status: [valid|partial|invalid]
```

### Log Type: mid-chain-evaluation

Orchestrator logs at Gate 9 (step boundary evaluation):

```yaml
timestamp: ISO 8601
orchestrator_gate: 9
step_completed: {step number}
action_type: {e.g., code, analyze, review}
evaluation_phase: {triggered|analysis|decision}

# Trigger check results:
triggers:
  signal: {fired|not-fired} → {description if fired}
  pattern: {fired|not-fired} → {pattern if fired}
  dependency: {fired|not-fired} → {dependency if fired}
  quality: {fired|not-fired} → {threshold if fired}
  redesign: {fired|not-fired} → {scope if fired}
  reuse: {fired|not-fired} → {opportunity if fired}

any_trigger_fired: {true|false}

# Decision:
decision: {continue|recompile|halt}
reason: {why this decision}
recompiled_steps: [{step numbers if recompile}]
```

**Rules:**
- Log at DEBUG+ level (this is orchestrator reasoning)
- Use concrete descriptions for triggers, not just true/false
- If recompile, list affected step numbers
- If halt, explain blocker

**Example:**
```yaml
timestamp: 2026-02-13T15:30:45Z
orchestrator_gate: 9
step_completed: 2
action_type: analyze
evaluation_phase: decision

triggers:
  signal: fired → agent output mentions Format 6.1 parser incomplete
  pattern: not-fired
  dependency: not-fired
  quality: not-fired
  redesign: fired → scope expanded beyond chain
  reuse: not-fired

any_trigger_fired: true

decision: halt
reason: Format incomplete. Requires human decision on follow-up.
```

### Trace Depth Convention

All agents follow this trace depth pattern:
- **INFO:** Final output only (report.md, changes.md)
- **DEBUG:** + tool calls + reasoning steps + decisions
- **TRACE:** + all alternatives considered + dead ends + data samples
