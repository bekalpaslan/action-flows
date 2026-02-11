# Orchestrator Observability Catalog

> Complete catalog of interaction mechanisms between orchestrator, backend, and frontend. Includes ownership boundaries, trace artifacts, and observability patterns.

**Last Updated:** 2026-02-11

---

## Overview

The ActionFlows system follows a **trust-based contract architecture**:
- **Orchestrator is "light and trusted"** — Outputs contract-compliant formats naturally, zero observability burden
- **Backend is "strict but graceful"** — Validates orchestrator outputs at gate checkpoints, degrades gracefully on violations
- **Frontend visualizes traces** — Displays gate logs, harmony violations, system health

This document catalogs all interaction points, artifacts, and ownership boundaries.

---

### Trust Requirement Taxonomy

Every interaction mechanism has a **trust requirement** level that defines how the system validates it:

| Level | Name | Description | Validation Strategy | Example |
|-------|------|-------------|---------------------|---------|
| **T0** | **Zero Trust** | Never trust, always verify with strict validation | Block on failure, reject malformed input | User input, external API responses |
| **T1** | **Validate Always** | Strict validation required, but allow graceful degradation | Store violations, trigger healing, continue execution | Agent outputs (Format 5.1/5.2/5.3) |
| **T2** | **High Trust + Monitor** | Trust but monitor for drift, parse at checkpoints | Graceful degradation, maintenance signals on drift | Orchestrator gate outputs (Format 1.1/2.1/3.1) |
| **T3** | **Complete Trust** | No validation, assumed correct by design | No parsing, direct use | Orchestrator internal reasoning, Claude CLI tool results |

**Key Principle:** Higher trust = lower validation burden = faster execution. Orchestrator operates at **T3** for internal work, **T2** for outputs. Backend validates at **T2** (gates) and **T1** (agents). Frontend accepts backend-validated data at **T3**.

---

## 1. Orchestrator Outputs (What Orchestrator Produces)

### 1.1 Conversation Transcript (Primary Artifact)

**File:** `C:\Users\alpas\.claude\projects\D--ActionFlowsDashboard\{session-id}.jsonl`

**Format:** JSON Lines (one JSON object per line)

**Contents:**
```jsonl
{"type":"user","message":{"role":"user","content":"implement X"},"timestamp":"..."}
{"type":"assistant","message":{"role":"assistant","content":"## Chain: ..."},"timestamp":"..."}
{"type":"user","message":{"role":"user","content":[{"tool_use_id":"...","type":"tool_result"}]}}
```

**What's Captured:**
- Every orchestrator response (full text)
- Every tool use (name, parameters, results)
- Timestamps, UUIDs, request IDs
- Agent spawning (subagent task logs)

**Trust Requirement:** **T3 (Complete Trust)** — Claude CLI generates JSONL automatically, structural integrity guaranteed by Claude Code infrastructure

**Owner:** Claude CLI (automatic)
**Consumer:** Backend (tails for real-time parsing)
**Retention:** Permanent (user's project directory)

---

### 1.2 Contract-Compliant Response Formats

**Location:** Orchestrator stdout (conversation responses)

**Specification:** `.claude/actionflows/CONTRACT.md` (17 formats defined)

**Critical Formats for Gate Checkpoints:**

| Format | Name | Gate | Orchestrator Outputs | Trust | Owner |
|--------|------|------|---------------------|-------|-------|
| **1.1** | Chain Compilation Table | Gate 4 | `## Chain: [title]` + markdown table | **T2** | Orchestrator |
| **1.2** | Execution Start Announcement | Gate 7 | `Spawning Step N: action/ (model)...` | **T2** | Orchestrator |
| **2.1** | Step Completion Announcement | Gate 8 | `>> Step N complete: action/ -- result` | **T2** | Orchestrator |
| **2.2** | Chain Status Update | Gate 11 | Updated chain table mid-execution | **T2** | Orchestrator |
| **3.1** | Execution Complete Summary | Gate 11 | `## Done: [title]` + summary | **T2** | Orchestrator |
| **5.1** | Review Report | Agent output | Verdict, Score, Summary, Findings | **T1** | Agent |
| **5.2** | Analysis Report | Agent output | Title, Aspect, Scope, Recommendations | **T1** | Agent |
| **6.1** | Learning Surface | Gate 13 | `## Agent Learning` + Issue/Root/Fix | **T2** | Orchestrator |

**Trust Levels:** Orchestrator outputs = **T2** (High Trust + Monitor with graceful degradation). Agent outputs = **T1** (Validate Always with strict compliance checks).

**Parsing:** Backend parses at gate checkpoints (see § 3)

**Owner:** Orchestrator (produces), Backend (validates), Frontend (displays)

---

### 1.3 Tool Calls

**Available Tools:**
- **File Operations:** Read, Write, Edit, Glob, Grep
- **Execution:** Bash, Task (agent spawning)
- **User Interaction:** AskUserQuestion
- **Session Control:** TaskOutput, TaskStop
- **MCP Tools:** mcp__* (Greptile, Figma, Postgres, Slack, Chrome DevTools)

**Trace Artifacts:**
- Tool use logged in conversation JSONL
- Tool results logged in conversation JSONL
- File operations create/modify files (discoverable via git)

**Trust Requirement:** **T3 (Complete Trust)** — Claude CLI guarantees tool execution integrity, results are structural facts not subject to validation

**Owner:** Orchestrator (calls tools), Claude CLI (executes tools), Backend (observes via JSONL)

---

### 1.4 Agent Spawns

**Mechanism:** `Task` tool with `subagent_type` parameter

**Agent Types:**
- `general-purpose` — Full tool access (Read, Write, Edit, Bash, etc.)
- `Bash` — Limited to Bash tool only
- `Explore` — Fast codebase exploration (no Edit/Write)
- `Plan` — Implementation planning

**Trace Artifacts:**
- Agent log folder: `.claude/actionflows/logs/{action-type}/{description}_{timestamp}/`
- Agent output files: `output.md`, `changes.md`, `review-report.md`, etc.
- Completion logged in conversation JSONL

**Trust Requirement:** **T1 (Validate Always)** — Agent outputs require strict validation (Format 5.1/5.2/5.3 compliance, completeness checks, learning section presence)

**Owner:** Orchestrator (spawns), Claude CLI (executes), Backend (watches log folders)

---

### 1.5 Registry Edits

**Files Modified by Orchestrator:**

| File | When | What | Frequency | Trust |
|------|------|------|-----------|-------|
| `.claude/actionflows/logs/INDEX.md` | After chain completes | Add execution record | Once per chain | **T2** |
| `.claude/actionflows/LEARNINGS.md` | When learning discovered | Add issue/root/fix | As needed | **T2** |

**Format:**
```markdown
| 2026-02-11 | Gate logging implementation | plan → code×5 → review | Success (abc123f)
```

**Trust Requirement:** **T2 (High Trust + Monitor)** — Registry edits are orchestrator-written, backend monitors for structural consistency at Gate 12 checkpoint

**Owner:** Orchestrator (writes), Backend (parses for gate traces), Frontend (displays in Archive)

---

### 1.6 Git Commits

**Mechanism:** `commit/` action (spawns agent with Bash access to git)

**Trace Artifacts:**
- Git commit with message + Co-Authored-By trailer
- Commit hash logged in INDEX.md
- Files modified tracked by git

**Format:**
```
feat: implement gate checkpoint validators

Added backend gate checkpoint infrastructure for contract validation.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

**Trust Requirement:** **T3 (Complete Trust)** — Git commits are facts stored in git history, structural integrity guaranteed by git itself, no validation needed

**Owner:** Orchestrator (initiates via commit/ action), commit/ agent (executes git commands), Git (stores)

---

## 2. Interaction Mechanisms (How Backend Observes Orchestrator)

### 2.1 JSONL Tailing (Primary Observation Method)

**What:** Backend service tails conversation JSONL file in real-time

**Implementation:**
```typescript
// packages/backend/src/services/orchestrationMonitor.ts
const tail = spawn('tail', ['-f', sessionJsonlPath]);

tail.stdout.on('data', async (line) => {
  const message = JSON.parse(line);
  if (message.type === 'assistant') {
    await parseGateBoundaries(message.content);
  }
});
```

**What's Observed:**
- Orchestrator responses (full text)
- Tool calls (name, params)
- Tool results (output)
- Timing (timestamps)

**Latency:** ~50-200ms (file write + parse)

**Trust Requirement:** **T3 → T2** — JSONL structure is T3 (trusted), but orchestrator response content is parsed at T2 (gate checkpoints with graceful degradation)

**Owner:** Backend
**Consumer:** Gate checkpoint validators (§ 3)

---

### 2.2 Hooks (Event-Driven Observation)

**Available Hooks:**
- `user-prompt-submit` — Before user message processed
- `post-tool-use` — After any tool execution
- `on-error` — When errors occur

**Location:** `.claude/hooks/`

**Example Use Case:**
```bash
# .claude/hooks/post-tool-use
# Parse orchestrator output, extract [GATE:XX] markers, POST to backend
if grep -q '\[GATE:' "$OUTPUT_FILE"; then
  curl -X POST http://localhost:3001/api/gates/log \
    -H "Content-Type: application/json" \
    -d "$(parse_gate_output "$OUTPUT_FILE")"
fi
```

**Trust Requirement:** **T0 (Zero Trust)** — Hooks are user-configured shell scripts, must validate all hook output strictly (potential injection vector)

**Owner:** User (configures hooks), Claude CLI (executes hooks), Backend (receives hook results)

**Status:** Not currently used for gate logging (JSONL tailing preferred for zero config)

---

### 2.3 File Watching (Agent Output Observation)

**What:** Backend watches `.claude/actionflows/logs/` directories for new files

**Implementation:**
```typescript
// packages/backend/src/services/fileWatcher.ts (exists)
import chokidar from 'chokidar';

const watcher = chokidar.watch('.claude/actionflows/logs/', {
  ignoreInitial: true
});

watcher.on('add', async (filePath) => {
  // When agent creates output file, validate and store
  await harmonyDetector.validateAgentOutput(filePath);
});
```

**What's Observed:**
- New agent log folders (logs/analyze/, logs/code/, etc.)
- Agent output files (output.md, changes.md, etc.)
- Agent completion state

**Trust Requirement:** **T1 (Validate Always)** — Agent outputs require strict validation against CONTRACT.md Format 5.1/5.2/5.3, with completeness and learning section checks

**Owner:** Backend
**Consumer:** HarmonyDetector, AgentValidator (Component 3)

---

### 2.4 Tool Result Parsing

**What:** Structured data from tool results (e.g., file paths from Write, command output from Bash)

**Example:**
```json
{
  "tool_use_id": "toolu_123",
  "type": "tool_result",
  "content": "File created successfully at: D:/ActionFlowsDashboard/..."
}
```

**What's Observable:**
- File paths (Write/Edit results)
- Command output (Bash results)
- Task agent status (TaskOutput results)

**Trust Requirement:** **T3 (Complete Trust)** — Tool results are structural facts from Claude CLI, guaranteed correct by infrastructure

**Owner:** Claude CLI (generates tool results), Orchestrator (receives), Backend (observes via JSONL)

---

### 2.5 WebSocket (Backend → Frontend)

**What:** Real-time event broadcast from backend to frontend

**Not Used For:** Orchestrator → Backend communication (unidirectional)

**Used For:** Backend → Frontend updates (gate traces, harmony violations, session events)

**Implementation:**
```typescript
// packages/backend/src/ws/broadcastService.ts
broadcastService.emit('gate:passed', {
  gateId: 'gate-04',
  timestamp: Date.now(),
  data: parsed
});
```

**Trust Requirement:** **T3 (Complete Trust)** — Backend-to-frontend events are internal system messages, already validated by backend before broadcast

**Owner:** Backend (broadcasts), Frontend (receives)

---

### 2.6 MCP Servers (Bidirectional?)

**Status:** Unclear if orchestrator can send data TO MCP or only receive FROM MCP

**Available MCP Servers:**
- Greptile (code analysis)
- Figma (design integration)
- Postgres (database queries)
- Slack (messaging)
- Chrome DevTools (browser automation)

**Trust Requirement:** **T0 (Zero Trust)** — MCP servers are external integrations, all responses must be validated strictly before use (potential security boundary)

**Owner:** MCP Server (provides tools), Orchestrator (uses tools), Backend (observes tool use via JSONL)

**Needs Investigation:** Can orchestrator push structured events through MCP?

---

## 3. Gate Checkpoints (Where Backend Validates Orchestrator)

### 3.1 Overview

**Total Gates:** 14 (across 5 execution phases)

**Checkpoint Pattern:**
```
Orchestrator outputs naturally → Backend validates at checkpoint → Trace stored in Harmony
```

**Owner Boundary:**
- **Orchestrator:** Produces contract-compliant outputs (already doing)
- **Backend:** Implements checkpoint validators (parses outputs)
- **Frontend:** Displays gate traces from Harmony

---

### 3.2 Gate Checkpoint Catalog

| Gate | Checkpoint Name | Orchestrator Outputs | Backend Validates | Harmony Stores | Trust |
|------|----------------|---------------------|------------------|----------------|-------|
| **1** | Parse & Understand | (internal reasoning, not output) | N/A | N/A | **T3** |
| **2** | Route to Context | "Routing to **work** context..." (prose) | ✅ Parse context from prose | ✅ Trace | **T2** |
| **3** | Detect Special Work | "This is **contract-format** work..." (prose) | ✅ Parse work type from prose | ✅ Trace | **T2** |
| **4** | Compile Chain | Format 1.1 (Chain Compilation Table) | ✅ Parse chain table | ✅ Trace | **T2** |
| **5** | Present Chain | "Execute?" prompt | ✅ Detect approval gate | ✅ Trace | **T2** |
| **6** | Human Approval | (human responds "yes"/"no") | ✅ Parse human decision | ✅ Trace | **T0** |
| **7** | Execute Step | Format 1.2 (Step Announcement) | ✅ Parse step info | ✅ Trace | **T2** |
| **8** | Step Completion | Format 2.1 (Step Completion) | ✅ Parse result | ✅ Trace | **T2** |
| **9** | Mid-Chain Eval | (internal reasoning, affects next steps) | ✅ Infer from chain modifications | ✅ Trace | **T2** |
| **10** | Auto-Trigger | Insert second-opinion/ step | ✅ Detect chain modification | ✅ Trace | **T2** |
| **11** | Chain Complete | Format 3.1 (Execution Complete) | ✅ Parse summary | ✅ Trace | **T2** |
| **12** | Archive & Index | Add line to INDEX.md (orchestrator writes) | ✅ Parse INDEX.md entry | ✅ Trace | **T2** |
| **13** | Learning Surface | Format 6.1 (Agent Learning) | ✅ Parse learning | ✅ Trace | **T2** |
| **14** | Flow Candidate | (internal evaluation, may suggest flow) | ✅ Detect flow suggestion | ✅ Trace | **T2** |

**Trust Distribution:**
- **T0 (Zero Trust):** Gate 6 (human input must be validated strictly)
- **T2 (High Trust + Monitor):** Gates 2-5, 7-14 (orchestrator outputs with graceful degradation)
- **T3 (Complete Trust):** Gate 1 (internal reasoning, no validation needed)

**Implementation Status:**
- **Current:** 3/14 gates fully logged (Gates 7, 12, 13)
- **Target:** 14/14 gates with checkpoint validators (Component 2 of revised plan)

---

### 3.3 Checkpoint Validation Pattern

**Trust Requirement Impact on Validation:**

| Trust Level | Validation Strategy | On Failure |
|-------------|--------------------|--------------|
| **T0** | Strict validation, block execution | Reject input, return error to user |
| **T1** | Strict validation with compliance tests | Store violation, trigger healing, allow continuation |
| **T2** | Parse with graceful degradation | Store violation, create maintenance signal, continue |
| **T3** | No validation, trust by design | N/A (structural integrity guaranteed by infrastructure) |

Most gate checkpoints operate at **T2** (High Trust + Monitor) because orchestrator outputs are trusted but monitored for drift.

---

**Example: Gate 4 (Compile Chain) — Trust Level T2**

```typescript
// packages/backend/src/services/checkpoints/gate04-chain-compilation.ts

export async function validateGate04(orchestratorOutput: string) {
  try {
    // Parse Format 1.1 using existing CONTRACT.md parser
    const parsed = parseChainCompilation(orchestratorOutput);

    if (!parsed) {
      throw new Error('Failed to parse chain compilation');
    }

    // Validate required fields
    const schema = z.object({
      title: z.string(),
      steps: z.array(z.object({
        id: z.number(),
        action: z.string(),
        model: z.string(),
        status: z.enum(['Pending', 'Done', 'Awaiting'])
      })),
      executionPattern: z.string()
    });

    const validated = schema.parse(parsed);

    // Store trace in Harmony namespace (Redis)
    await harmonyStorage.storeGateTrace({
      gateId: 'gate-04',
      gateName: 'Compile Chain',
      timestamp: Date.now(),
      data: validated,
      status: 'passed'
    });

    // Broadcast to frontend
    await websocket.emit('gate:passed', {
      gateId: 'gate-04',
      data: validated
    });

  } catch (error) {
    // Graceful degradation - store violation
    await harmonyStorage.storeViolation({
      gateId: 'gate-04',
      reason: error.message,
      rawOutput: orchestratorOutput,
      status: 'violated'
    });

    // Trigger healing if threshold met (3+ violations)
    await harmonyDetector.evaluateViolation('gate-04');
  }
}
```

**Owner:** Backend (implements validator)
**Consumer:** Frontend (displays gate trace), Harmony (monitors violations)

---

### 3.4 Harmony Trace Storage

**Storage:** Redis with 7-day TTL (matches existing harmonyDetector pattern)

**Schema:**
```typescript
interface GateTrace {
  gateId: GateId;           // 'gate-01' through 'gate-14'
  gateName: string;         // Human-readable name
  timestamp: number;        // Unix timestamp
  data: unknown;            // Parsed gate data (varies by gate)
  status: 'passed' | 'violated';
}

interface GateViolation {
  gateId: GateId;
  timestamp: number;
  reason: string;           // Error message
  rawOutput: string;        // Unparsable orchestrator output
  status: 'violated';
}
```

**Keys:**
```
gate:{gateId}:{timestamp}               # Individual trace
gate:{gateId}:history                   # List of trace timestamps
harmony:violations                      # List of all violations
```

**Owner:** Backend (writes), Frontend (reads), Harmony (monitors)

---

## 4. Trace Artifacts (What Orchestrator Leaves Behind)

### 4.1 Permanent Traces

**1. Conversation JSONL**
- Location: `C:\Users\alpas\.claude\projects\D--ActionFlowsDashboard\{session-id}.jsonl`
- Retention: Permanent
- Size: Grows unbounded (compaction may occur)
- Owner: Claude CLI

**2. Agent Log Folders**
- Location: `.claude/actionflows/logs/{action-type}/{description}_{timestamp}/`
- Retention: Permanent (user manages)
- Contents: Agent output files (output.md, changes.md, etc.)
- Owner: Agents (write), Backend (validates), Frontend (displays)

**3. INDEX.md Entries**
- Location: `.claude/actionflows/logs/INDEX.md`
- Retention: Permanent
- Format: Markdown table (one row per chain)
- Owner: Orchestrator (writes), Backend (parses)

**4. LEARNINGS.md Entries**
- Location: `.claude/actionflows/LEARNINGS.md`
- Retention: Permanent
- Format: Markdown sections (one per learning)
- Owner: Orchestrator (writes)

**5. Git Commits**
- Location: Git history
- Retention: Permanent (until pruned)
- Format: Standard git commit with Co-Authored-By trailer
- Owner: commit/ agent (writes via git)

---

### 4.2 Temporary Traces (TTL)

**1. Gate Traces (Harmony)**
- Location: Redis `gate:*` keys
- Retention: 7 days (TTL)
- Format: JSON (GateTrace schema)
- Owner: Backend (writes via gate checkpoints)

**2. Harmony Violations**
- Location: Redis `harmony:violations` key
- Retention: 7 days (TTL)
- Format: JSON list (GateViolation schema)
- Owner: Backend (writes via graceful degradation)

**3. Task Agent Outputs**
- Location: `C:\Users\alpas\AppData\Local\Temp\claude\D--ActionFlowsDashboard\tasks\{agent-id}.output`
- Retention: Temporary (OS manages)
- Format: Plain text (agent stdout)
- Owner: Claude CLI (writes), Orchestrator (reads via TaskOutput)

---

### 4.3 Discoverable Traces (Filesystem)

**1. Files Created via Write Tool**
- Location: User-specified paths (typically in project directory)
- Retention: Permanent (user manages)
- Discoverable: `git status`, `git log`, file search
- Owner: Orchestrator (creates via Write tool)

**2. Files Modified via Edit Tool**
- Location: User-specified paths
- Retention: Permanent
- Discoverable: `git diff`, `git log -p`
- Owner: Orchestrator (modifies via Edit tool)

**3. Command Outputs (Bash Tool)**
- Location: Embedded in conversation JSONL (tool results)
- Retention: Permanent (JSONL retained)
- Discoverable: Search JSONL for `"tool_use_id"` with `"Bash"`
- Owner: Bash command (produces), Orchestrator (receives)

---

## 5. Ownership Boundaries

### 5.1 Orchestrator Responsibilities

**What Orchestrator DOES:**
- ✅ Output contract-compliant formats (CONTRACT.md)
- ✅ Follow ORCHESTRATOR.md instructions at session start
- ✅ Spawn agents via Task tool when needed
- ✅ Use tools (Read, Write, Edit, Bash, etc.)
- ✅ Write INDEX.md entries after chain completes
- ✅ Write LEARNINGS.md entries when issues discovered

**What Orchestrator DOES NOT DO:**
- ❌ Explicitly log gate passages (no Write calls for gate logs)
- ❌ Call backend APIs directly (no HTTP POST/GET)
- ❌ Validate its own outputs (trusts contract compliance)
- ❌ Monitor harmony violations (passive, unaware)
- ❌ Trigger remediation flows (backend routes via human will)

**Principle:** **"Zero orchestrator burden"** — Orchestrator is "light and trusted," produces outputs naturally, backend validates passively.

---

### 5.2 Backend Responsibilities

**What Backend DOES:**
- ✅ Tail conversation JSONL in real-time
- ✅ Parse orchestrator outputs at gate checkpoints
- ✅ Validate contract compliance (Zod schemas)
- ✅ Store gate traces in Harmony (Redis)
- ✅ Detect violations (format drift, missing fields)
- ✅ Broadcast WebSocket events to frontend
- ✅ Trigger healing when violation threshold met
- ✅ Watch agent log folders via chokidar
- ✅ Validate agent outputs (Component 3)

**What Backend DOES NOT DO:**
- ❌ Instruct orchestrator to log differently (accepts what it gets)
- ❌ Modify orchestrator instructions (ORCHESTRATOR.md is read-only at runtime)
- ❌ Block orchestrator execution on validation failures (graceful degradation)

**Principle:** **"Strict but graceful"** — Backend expects contract compliance, degrades gracefully when violated, creates maintenance signals not crashes.

---

### 5.3 Frontend Responsibilities

**What Frontend DOES:**
- ✅ Display gate traces from Harmony
- ✅ Visualize cosmic map with gate checkpoints
- ✅ Show harmony violations in Harmony workbench
- ✅ Render orchestrator responses (markdown)
- ✅ Send WebSocket subscriptions to backend
- ✅ Capture orchestrator responses (for gate checkpoint API)

**What Frontend DOES NOT DO:**
- ❌ Parse orchestrator outputs directly (backend does this)
- ❌ Validate contract compliance (backend responsibility)
- ❌ Store traces (backend + Harmony store)

**Principle:** **"Visualize, don't validate"** — Frontend displays backend-validated data, trusts Harmony as source of truth.

---

### 5.4 Agent Responsibilities

**What Agents DO:**
- ✅ Read their own agent.md instructions
- ✅ Execute tasks (analyze, code, review, plan, etc.)
- ✅ Create log folders (logs/{action-type}/{description}_{timestamp}/)
- ✅ Write output files (output.md, changes.md, etc.)
- ✅ Produce contract-compliant formats (Format 5.1, 5.2, 5.3)
- ✅ Surface learnings (Issue, Root Cause, Suggestion)

**What Agents DO NOT DO:**
- ❌ Read ORCHESTRATOR.md (identity boundary violation)
- ❌ Delegate to other agents (single responsibility)
- ❌ Modify framework files (except when explicitly tasked)

**Principle:** **"Agent standards compliance"** — Agents follow `.claude/actionflows/actions/_abstract/agent-standards/instructions.md`.

---

## 6. Observability Patterns

### 6.1 Trust-Based Contract System

```
┌─────────────────────────────────────────────────────────────┐
│                  TRUST-BASED ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Orchestrator: "Light and Trusted"                          │
│  ├─ Follows CONTRACT.md formats naturally                   │
│  ├─ Zero observability burden                               │
│  └─ Unaware of validation infrastructure                    │
│                                                               │
│  Backend: "Strict but Graceful"                             │
│  ├─ Expects contract compliance                             │
│  ├─ Validates at gate checkpoints                           │
│  ├─ Degrades gracefully on violations                       │
│  └─ Creates maintenance signals, not crashes                │
│                                                               │
│  Harmony: "Health Layer"                                    │
│  ├─ Stores gate traces (7-day TTL)                          │
│  ├─ Monitors violation patterns                             │
│  ├─ Triggers healing when threshold met                     │
│  └─ Learns from every cycle (LEARNINGS.md)                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

### 6.2 Data Flow: Orchestrator → Backend → Frontend

```
┌──────────────┐
│ Orchestrator │  1. Outputs naturally (CONTRACT.md formats)
└──────┬───────┘
       │
       v
┌──────────────┐
│ JSONL File   │  2. Conversation logged to JSONL
└──────┬───────┘
       │
       v
┌──────────────┐
│ Backend      │  3. Tails JSONL, parses at gate checkpoints
│ (Monitor)    │
└──────┬───────┘
       │
       v
┌──────────────┐
│ Gate         │  4. Validates contract compliance
│ Checkpoint   │
└──────┬───────┘
       │
       ├─ Pass ──────────┐
       │                 v
       │          ┌──────────────┐
       │          │ Harmony      │  5a. Store trace (Redis, 7d TTL)
       │          │ (Trace)      │
       │          └──────┬───────┘
       │                 │
       │                 v
       │          ┌──────────────┐
       │          │ WebSocket    │  6a. Broadcast gate:passed
       │          └──────┬───────┘
       │                 │
       │                 v
       │          ┌──────────────┐
       │          │ Frontend     │  7a. Display gate trace
       │          └──────────────┘
       │
       └─ Fail ──────────┐
                         v
                  ┌──────────────┐
                  │ Harmony      │  5b. Store violation
                  │ (Violation)  │
                  └──────┬───────┘
                         │
                         v
                  ┌──────────────┐
                  │ Healing      │  6b. Trigger remediation (threshold)
                  │ Cycle        │
                  └──────┬───────┘
                         │
                         v
                  ┌──────────────┐
                  │ LEARNINGS.md │  7b. Record learning
                  └──────────────┘
```

---

### 6.3 Graceful Degradation Pattern

**When Parsing Fails:**

1. **Backend graceful degradation:**
   - Store violation in Harmony (Redis)
   - Log error (not crash)
   - Continue processing other gates

2. **Frontend graceful degradation:**
   - Display partial view (what could be parsed)
   - Show "format drift detected" warning
   - Link to Harmony workbench for details

3. **Healing cycle triggered:**
   - If 3+ violations for same gate in 24h
   - Backend routes to remediation flow
   - Agents fix the issue (update parser, fix orchestrator instruction, sync contract)
   - Next session benefits from fix

**No cascading failures. Resilience is built in.**

---

## 7. Future Enhancements

### 7.1 Gate Performance Analytics

**Status:** Out of scope for initial implementation

**Concept:**
- Track gate passage duration (avg, p50, p95, p99)
- Identify slow gates for optimization
- Dashboard visualization of gate performance over time

---

### 7.2 Agent Spawn Audit Trail

**Status:** Out of scope for initial implementation

**Concept:**
- Extend OrchestrationLogger to log agent spawns
- Capture: action type, model, prompt, inputs, timestamp
- Storage: `.claude/actionflows/logs/gates/agent-spawn_{timestamp}/`
- AgentSpawnViewer component (frontend)

---

### 7.3 MCP Bidirectional Events

**Status:** Needs investigation

**Question:** Can orchestrator push structured events through MCP servers?

**Use Case:** If MCP supports bidirectional events, could be alternative to JSONL tailing for gate logging.

---

## 8. References

### Primary Documentation
- **CONTRACT.md** — Format specifications (17 formats)
- **ORCHESTRATOR.md** — Orchestrator behavior rules
- **SYSTEM.md** — Living system architecture (7 layers)
- **GATE_STRUCTURE.md** — Complete gate catalog (14 gates)
- **LOGGING_STANDARDS_CATALOG.md** — Logging standards by action

### Implementation Files
- **packages/backend/src/services/harmonyDetector.ts** — Contract validation service
- **packages/backend/src/services/fileWatcher.ts** — Agent output file watching
- **packages/backend/src/ws/broadcastService.ts** — WebSocket event broadcasting
- **packages/shared/src/contract/parsers/** — CONTRACT.md format parsers

### Related Plans
- **logs/plan/auditable-verification-system-revised_2026-02-11-21-59-55/plan.md** — Revised verification infrastructure plan (57KB)

---

## 9. Quick Reference

### Orchestrator Observability Checklist

**What Orchestrator Outputs:**
- ✅ Conversation JSONL (automatic) — **T3**
- ✅ CONTRACT.md formats (trained behavior) — **T2**
- ✅ Tool calls (Read, Write, Edit, Bash, Task) — **T3**
- ✅ Agent spawns (Task tool) — **T1** (agent outputs)
- ✅ Registry edits (INDEX.md, LEARNINGS.md) — **T2**
- ✅ Git commits (via commit/ action) — **T3**

**What Backend Observes:**
- ✅ JSONL tailing (real-time) — **T3 → T2** (structure trusted, content parsed)
- ✅ Gate checkpoint validation (14 gates) — **T2** (13 gates), **T0** (Gate 6 human input)
- ✅ Agent log folder watching (chokidar) — **T1** (strict validation)
- ✅ Contract compliance (Zod schemas) — **T2** (graceful degradation)
- ✅ Harmony trace storage (Redis, 7d TTL) — **T3** (internal storage)

**What Frontend Displays:**
- ✅ Cosmic map (workbenches + gate checkpoints) — **T3** (backend-validated data)
- ✅ Gate traces (Harmony workbench) — **T3** (backend-validated data)
- ✅ Harmony violations (terrain flicker) — **T3** (backend-validated data)
- ✅ Agent outputs (session detail view) — **T3** (backend-validated data)

**Trust Level Distribution:**
- **T0 (Zero Trust):** User input (Gate 6), MCP servers, hooks
- **T1 (Validate Always):** Agent outputs (Format 5.1/5.2/5.3)
- **T2 (High Trust + Monitor):** Orchestrator gate outputs (Format 1.1/2.1/3.1/6.1), registry edits
- **T3 (Complete Trust):** JSONL structure, tool results, git commits, internal events

**Zero Orchestrator Burden:** ✅ Confirmed

---

**End of Catalog**
