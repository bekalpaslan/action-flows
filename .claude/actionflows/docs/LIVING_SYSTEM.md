# The Living System

> ActionFlows is not a static framework. It is a living system that heals itself through use.

Every execution feeds back into the system. Every mistake becomes a lesson. Every discovery triggers evolution. The architecture is designed not just to execute work, but to learn from it — to become smarter, more efficient, and more reliable with each session.

---

## What Makes It Living?

A traditional framework is frozen at the moment it ships. ActionFlows is alive because:

1. **Memory** — Every chain execution is recorded. Past patterns inform future routing decisions.
2. **Self-Healing** — When drift is detected, remediation chains execute automatically.
3. **Evolution** — New flows, new agents, and new contract formats are created in response to observed patterns.
4. **Feedback Loops** — The harmony system watches for misalignment and triggers healing cycles.

This is not aspirational. On 2026-02-09, the backwards harmony audit detected that `harmonyDetector.ts` had broken support for 12 of 17 contract formats, the `useChainEvents` hook was dead code, and the `StepSkippedEvent` was missing from the event stream. The remediation chain fixed all three issues in the same session. The system healed itself.

---

## The Framework

ActionFlows is a framework for AI agent orchestration. An orchestrator coordinates work by compiling chains of actions and spawning agents to execute them. The dashboard visualizes this orchestration in real-time. This is not a task runner — it's a living system that learns from every execution and evolves its own capabilities.

---

## The Orchestrator

The orchestrator is a **router, not a helper**. It never writes code, never analyzes files, never produces content. It only coordinates.

**The Request Reception Protocol:**

Every human message flows through the same protocol:

1. **Parse intent** — What work is requested? What scope? What outputs?
2. **Route to context** — Read `CONTEXTS.md` to identify the domain (work, maintenance, explore, review, settings, pm)
3. **Find the flow** — Read `FLOWS.md` to find a matching flow, or compose from `ACTIONS.md`
4. **Compile chain** — Create a table of actions with models, inputs, dependencies, and status
5. **Present for approval** — Show the chain to the human, wait for confirmation
6. **Spawn agents** — Execute approved chain by spawning agents step-by-step

**The Sin Test:**

Before every action, the orchestrator asks: "Am I about to produce content?"
- **YES** → It's a sin. Stop. Compile a chain. Spawn an agent.
- **NO** → Am I coordinating? (routing, compiling, registry edits, presenting plans)
  - **YES** → Proceed. This is my job.
  - **NO** → What am I doing? Delegate it.

**Chain Compilation:**

A chain is a table of actions:

| # | Action | Model | Inputs | Waits For | Status |
|---|--------|-------|--------|-----------|--------|
| 1 | analyze/ | opus-4.6 | {task, context} | — | PENDING |
| 2 | code/ | opus-4.6 | {task from #1} | 1 | PENDING |
| 3 | review/ | opus-4.6 | {changes from #2} | 2 | PENDING |

The orchestrator compiles this, presents it, waits for approval, then executes autonomously.

**Delegation:**

Each action has an `agent.md` file that defines its mission, constraints, and output format. The orchestrator provides **only three inputs**: task, context, component. No ad-hoc instructions. The agent reads its own `agent.md` to know what to do. This isolation lets agents evolve independently.

**Quick Triage Exception:**

The one exception to "never produce content" is Quick Triage: trivial fixes (1-3 files, mechanical, obvious changes). All other work requires compilation and delegation.

---

## Human Interaction

The human works with ActionFlows through a trust-through-transparency model:

**Chain Presentation → Approval → Autonomous Execution:**

The orchestrator compiles a chain, shows it to the human, and waits for approval. Once approved, the orchestrator executes the entire chain autonomously — no stopping mid-chain unless a human gate is specified in the flow.

**Human Gates:**

Some flows include explicit approval points for design decisions. Example: `analyze → plan → [HUMAN GATE] → code → review`. The orchestrator pauses before coding, presents the plan, and waits for confirmation. This prevents wasted work on wrong approaches.

**"It's a Sin" — The Reset Command:**

When the human says "it's a sin," the orchestrator stops immediately, acknowledges the violation, and recompiles the work as a proper chain. This is the emergency brake for when the orchestrator crosses into content production.

**Learnings Surface:**

Agents discover things during execution (missing tests, broken patterns, design issues). These learnings are surfaced to the orchestrator, which presents them to the human. The human reviews and approves fixes. Learnings are recorded in `LEARNINGS.md` so future sessions benefit.

**One Question at a Time:**

When gathering multi-part input, the orchestrator asks ONE question, waits for answer, then asks next. Never batch. This reduces cognitive load and prevents ambiguity.

**Trust Through Transparency:**

Every chain is visible. Every step is announced ("Spawning Step 2: code/ (opus-4.6)..."). Every output is logged to `.claude/actionflows/logs/`. The human can inspect any execution, read any log, verify any decision. Trust is earned through demonstrated competence, not assumed.

---

## The 7 Layers

ActionFlows is organized as 7 layers, each with its own role, evolution mechanism, and relationship to other layers.

### Layer 0 — Memory

**Files:** `.claude/actionflows/logs/INDEX.md`, `LEARNINGS.md`, `logs/framework_health_report.md`

**Purpose:** The system's long-term memory — and its primary source of wisdom. Layer 0 is not part of the execution chain. Instead, the orchestrator **consults** Layer 0 **before every routing decision**, using past patterns and learnings to inform which chain to compile. Past executions and past mistakes shape the routing logic itself.

**What Makes It Living:**
- **INDEX.md** is a searchable registry of past executions. Before compiling any chain, the orchestrator reads INDEX.md to find similar patterns. "We solved this before with `analyze×3 → audit`. Let me reuse that pattern." This is not logging — it's active decision-making input.
- **LEARNINGS.md** is a catalog of past mistakes and their root causes. The orchestrator reads it before routing to check: "Has this type of work failed before? What went wrong? How do I avoid repeating it?" A learning entry includes: context, problem, root cause, and solution. Agents surface learnings during execution; the orchestrator records them; future sessions benefit. Learnings inform routing, they are not an execution step.
- **Reports** provide trend data. Framework health reports across sessions reveal patterns — e.g., "harmony violations dropped after we fixed the contract parsers."
- **Intel Dossiers** are the living manifestation of Layer 0 in the UI. A dossier is a persistent, evolving intelligence page about a code domain — it watches paths, accumulates insights, and grows through re-analysis. Where INDEX.md and LEARNINGS.md are the orchestrator's memory, dossiers are the *codebase's* memory. They follow their own lifecycle: Birth → Life → Growth → Memory. See `docs/design/INTEL_DOSSIER.md`.

**Key Mechanism:**
```
Before compiling ANY chain, the orchestrator CONSULTS memory (Layer 0):
1. Read INDEX.md — "Have we done this before? What pattern worked?"
2. Read LEARNINGS.md — "Has this type of work failed? What's the root cause?"
   ↓
This informs the routing decision and shapes the chain compilation
   ↓
Chain is presented to human for approval
   ↓
After execution completes, the loop records new data:
- INDEX.md appends new execution record
- LEARNINGS.md appends agent-surfaced findings
   ↓
Next session starts smarter — orchestrator reads enriched memory and routes more wisely
```

---

### Layer 1 — Routing

**Files:** `.claude/actionflows/ORCHESTRATOR.md`, `CONTEXTS.md`, `FLOWS.md`, `ACTIONS.md`

**Purpose:** Pure coordination. Maps human intent → contexts → flows → action chains. This layer never executes work. It only decides what work exists and how to compose it.

**What Makes It Living:**
- New flows are registered through the flow-creation/ flow. The orchestrator can add new capabilities without modifying its core logic.
- Contexts evolve as the project grows. If a new domain area emerges (e.g., "database-optimization"), a new context can be created and registered in CONTEXTS.md.
- The routing table is never "done." FLOWS.md and ACTIONS.md are living registries, not static configurations.

**Key Mechanism:**
```
Request Reception Protocol (every human message):
1. Parse intent without reading code (what work? what scope? what outputs?)
2. Route to context (read CONTEXTS.md)
3. Find the flow (read FLOWS.md or compose from ACTIONS.md)
4. Compile chain (what agents, what order, what waits-for dependencies?)
5. Present for approval, then execute

If a flow doesn't exist, the orchestrator can route to flow-creation/ to build it.
```

---

### Layer 2 — Agents

**Files:** `.claude/actionflows/actions/*/agent.md`, `.claude/actionflows/actions/_abstract/*/instructions.md`

**Purpose:** The hands. Self-contained executors with clear missions, constraints, and output formats. Agents are spawned by the orchestrator, execute independently, and return results.

**What Makes It Living:**
- Agents can be created through the action-creation/ flow.
- Agent standards evolve through the _abstract/ directory. If a new behavioral principle emerges, it's added to agent-standards/instructions.md, and all future agents inherit it.
- Agents are versioned by their agent.md file. If an agent's behavior needs to change, a new agent.md is created; the orchestrator chooses which version to spawn.

**Key Mechanism:**
```
Spawning Pattern (orchestrator to agent):
1. Agent reads its own agent.md (defines mission, constraints, output format)
2. Agent reads abstract standards (_abstract/agent-standards/, _abstract/create-log-folder/)
3. Agent receives only three inputs: task, context, component (no ad-hoc instructions)
4. Agent executes independently and returns results

This isolation ensures agents can evolve without breaking orchestrator logic.
```

---

### Layer 3 — Contract

**Files:** `.claude/actionflows/CONTRACT.md`, `packages/shared/src/contract/`

**Purpose:** The agreement between orchestrator output and dashboard parsing. A formal specification of 17 formats: chain compilations, step announcements, review reports, analysis reports, brainstorm transcripts, and more.

**What Makes It Living:**
- `CONTRACT_EVOLUTION.md` defines the process for evolving formats. Adding a new format is not ad-hoc; it's a deliberate, coordinated change.
- Formats are versioned. Breaking changes increment CONTRACT_VERSION and support both old and new versions during a 90-day migration window.
- TypeScript types, parser functions, regex patterns, and examples are all part of the contract. When a format changes, all three must be updated together.

**Key Mechanism:**
```
Format Specification (example from CONTRACT.md):

## Format 3.1: Chain Compilation (P0)
TypeScript: ChainCompilationParsed
Parser: parseChainCompilation(text: string): ChainCompilationParsed
Pattern: /^# Chain Compilation$/m
Example: ORCHESTRATOR.md § 23.1

Required Fields:
- Title (string)
- Agent Breakdown table (markdown table with #, Action, Model, Inputs, Waits For, Status)
- Timestamp (ISO 8601)

When this format changes, three things update:
1. CONTRACT.md (specification updated)
2. packages/shared/src/contract/parsers/parseChainCompilation.ts (parser updated)
3. ORCHESTRATOR.md (examples updated)
```

---

### Layer 4 — Infrastructure

**Files:** `packages/backend/src/services/`, `packages/shared/src/events.ts`, `packages/shared/src/contract/`

**Purpose:** The plumbing. Two parallel universes that serve different purposes but protect the same contract.

**Universe A — Real-Time Events (WebSocket Stream)**
- **Path:** Orchestrator spawns agent → Agent sends WebSocket events → Frontend consumes via hooks
- **Purpose:** Live rendering of orchestrator activity. The dashboard shows chain compilations, step starts, step completions, errors, in real-time.
- **Files:** `packages/shared/src/events.ts` (typed event definitions), `packages/backend/src/ws/` (WebSocket server), `packages/app/src/hooks/` (frontend consumption)
- **Example:** `StepStartedEvent`, `StepCompletedEvent`, `ChainFailedEvent`

**Universe B — Monitoring (Contract Parsers)**
- **Path:** Orchestrator outputs markdown → Backend parses using contract specifications → Harmony detector validates
- **Purpose:** Validate that orchestrator output matches contract spec. Detect drift between what the orchestrator claims it's doing and what the contract says it should be doing.
- **Files:** `packages/shared/src/contract/parsers/` (format parsers), `packages/backend/src/services/harmonyDetector.ts` (validation service)
- **Example:** `parseChainCompilation()` reads the orchestrator's chain compilation table and validates it matches the expected structure

**The Deliberate Split:**
- Frontend never touches raw markdown. It consumes only typed WebSocket events.
- Harmony detector never drives rendering. It only monitors and validates.
- They serve different masters (live UI vs. drift detection) but protect the same contract.

**What Makes It Living:**
- New event types are added as the system grows. If a new orchestrator feature needs to broadcast state, a new event type is created, added to events.ts, and frontend components subscribe to it.
- New service implementations support new contract formats. As the contract evolves, services evolve to handle new formats.
- WebSocket connections are pooled and managed for real-time responsiveness. The backend can scale from one session to thousands.

---

### Layer 5 — Presentation

**Files:** `packages/app/src/components/`, `packages/app/src/hooks/`, `packages/app/src/contexts/`

**Purpose:** What the human sees. A React-based desktop application (via Electron) that consumes structured WebSocket events and renders the orchestrator activity as an interactive visualization.

**Components:**
- **DAG Viewer:** Shows chain structure and step dependencies (ReactFlow-based)
- **Step Node:** Displays individual step status, inputs, outputs, errors
- **Timeline:** Real-time execution timeline with pausing and resuming
- **SquadPanel:** Agent status indicators (in development)
- **Harmony Panel:** Real-time harmony violations and parsing status
- **Intel Workbench:** Living dossiers about code domains — persistent intelligence pages with widgets (StatCard, InsightCard, FileTree, SnippetPreview, CodeHealthMeter, AlertPanel). This is where Layer 0 (Memory) becomes visible. Dossiers watch file changes, trigger re-analysis, and accumulate insights over time. The dashboard shifts from passive observer to active intelligence gatherer.

**What Makes It Living:**
- The Self-Evolving UI system allows the dashboard to register new button types, detect visual patterns, and self-modify. Instead of hard-coding UI elements, the system reads a registry and generates buttons dynamically.
- Components are built from typed events, never raw data. When a new event type is added (Layer 4), a corresponding component can be created to render it.
- Graceful degradation is built-in. If parsing fails, the dashboard shows a degraded view instead of crashing.

**Key Mechanism:**
```
Frontend Hook Pattern:
const { steps, isLoading } = useChainEvents(chainId)

useChainEvents hook:
1. Opens WebSocket connection
2. Subscribes to StepStartedEvent, StepCompletedEvent, etc.
3. Maintains local state with typed event data
4. Returns data to components (never raw markdown)

Components render the data:
<StepNode step={step} />  // step is typed, never raw
```

---

### Layer 6 — Harmony

**Files:** `packages/backend/src/services/harmonyDetector.ts`, `packages/shared/src/harmonyTypes.ts`, `.claude/actionflows/flows/backwards-harmony-audit/`

**Purpose:** The meta-layer that watches all other layers. Detects drift between contract specs, parsers, frontend expectations, and orchestrator output. When drift is detected, triggers healing.

**How Harmony Detection Works:**

1. **Specification Validation** — Every orchestrator output is parsed using contract-defined parsers
2. **Structure Matching** — Parsed structure is compared to expected format specification
3. **Version Checking** — If CONTRACT_VERSION has changed, validates correct version is used
4. **Broadcasting Violations** — Any mismatch triggers a HarmonyViolationEvent broadcast via WebSocket
5. **Dashboard Display** — Violations appear in real-time harmony panel

**Historical Example (2026-02-09):**
```
Backwards Harmony Audit ran and detected:
- harmonyDetector.ts missing parsers for 12/17 contract formats
- useChainEvents hook dead (no parser validation)
- StepSkippedEvent type defined but never broadcast

Findings reported to orchestrator.
Orchestrator routed to code-and-review/ flow.
Code agent fixed all three issues in one session.
Next audit shows 0 violations.
```

**What Makes It Living:**
- The harmony system itself evolves. New audit flows are created when patterns emerge.
- Violations are not failures — they're signals. When a violation is detected, the orchestrator can route to a remediation flow automatically.
- The backward audit (checking that frontend, parsers, and specs agree) can discover design issues earlier.

**Key Mechanism:**
```
Harmony Cycle:
Layer 6 detects drift
    ↓
Routes to remediation flow
    ↓
Agents execute fixes
    ↓
Layer 0 records what happened
    ↓
Next execution → Layer 1 reads memory → smarter routing
```

---

## The Healing Cycle

This is the most important diagram in the system. It shows how ActionFlows heals itself:

```
┌─────────────────────────────────────┐
│   Layer 6: Harmony Monitoring       │
│   Detects drift, broadcasts          │
│   HarmonyViolationEvent              │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   Layer 1: Routing                  │
│   Orchestrator reads violation,      │
│   routes to remediation flow         │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   Layer 2: Agents                   │
│   Spawned agents execute fix         │
│   (code-and-review, test, etc.)      │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   Layer 0: Memory                   │
│   Records execution in INDEX.md,     │
│   learnings in LEARNINGS.md          │
└──────────────┬──────────────────────┘
               │
               ↓
        ┌──────────────┐
        │  Next        │
        │  Session     │
        └──────────────┘
               │
               ↓
  Layer 1 reads INDEX.md
  → Smarter routing decisions
  → Patterns reused
  → System improves
```

The cycle is not aspirational. It is operational right now.

---

## The Growth Cycle

The healing cycle fixes what's broken. The growth cycle is different — it makes the system **stronger with every use**, even when nothing is broken.

### Every Chain Is a Seed

Every ad-hoc chain the orchestrator compiles is a potential reusable flow. When the orchestrator composes `analyze×3 → audit → second-opinion` to solve a problem, that pattern is recorded in INDEX.md. If it works well and the pattern recurs, it gets promoted to a registered flow in FLOWS.md. What was a 5-step manual composition becomes a single invocation.

This happened in practice on 2026-02-09: the backwards harmony audit was composed ad-hoc from existing actions. It worked. It was immediately registered as `backwards-harmony-audit/` — a permanent flow available to every future session.

**Every chain is a seed. Some seeds become flows. Flows become the system's muscle memory.**

### Every Dossier Is a Living Record

The growth cycle isn't limited to orchestrator chains. **Intel Dossiers** follow the same principle at the code level:

```
Dossier created (Birth)
    ↓
File watcher detects changes (Life)
    ↓
Re-analysis runs, new insights accumulate (Growth)
    ↓
Prior states preserved for temporal comparison (Memory)
    ↓
Domain understanding deepens with every change
```

Where chains grow the orchestrator's routing intelligence, dossiers grow the system's understanding of the codebase itself. A dossier about "Auth System" that watches `middleware/auth.ts`, `AuthContext.tsx`, and `types/user.ts` sees the full cross-cutting domain — and gets smarter every time those files change. The system doesn't just execute work better. It *understands the code better*.

### The Compounding Properties

As the system grows through use, five properties compound:

**1. Operational Efficiency**
Each session does less redundant work than the last. Patterns that required manual composition become one-step flow invocations. The orchestrator's routing gets faster because INDEX.md provides proven solutions. Work that took a full chain now takes a flow reference.

**2. Intentionality**
Decisions are never random. The orchestrator reads INDEX.md ("what worked before?") and LEARNINGS.md ("what failed?") before every routing decision. Each chain is compiled with full historical awareness. The system makes **informed, deliberate choices** — not guesses.

**3. Trust**
As successful patterns accumulate and learnings prevent repeat mistakes, trust grows between human and system. The human approves chains faster because the orchestrator's track record is visible in INDEX.md. Trust is earned through demonstrated competence, not assumed.

**4. Less Work, Higher Quality**
These are not in tension — they compound together. Reusable flows eliminate composition overhead. Learnings prevent repeat mistakes. Reviews catch issues early. Second opinions provide safety nets. The system does **less total work** while producing **higher quality output** because it builds on proven foundations instead of starting from scratch.

**5. Growth**
The system grows its own capabilities. New flows are registered. New agents are created. New patterns are discovered. The framework today is more capable than the framework yesterday — not because someone redesigned it, but because it was used.

### The Growth Formula

```
Chain executed successfully
    ↓
Pattern recorded in INDEX.md
    ↓
Pattern recognized as reusable?
    ├─ No  → Available as reference for future routing
    └─ Yes → Promoted to registered flow in FLOWS.md
              ↓
              Available as single invocation
              ↓
              Composes into larger flows
              ↓
              System capability grows
```

**The system that runs today is not the system that will run tomorrow. Tomorrow's system will be stronger — because today it was used.**

---

## Layer Interactions

Each layer feeds into others, is monitored by others, and evolves through specific mechanisms:

| Layer | Feeds Into | Monitored By | Evolved Through |
|-------|-----------|--------------|-----------------|
| **0: Memory** | Layer 1 (routing decisions) | — | Every chain execution appends to INDEX.md |
| **1: Routing** | Layer 2 (agent spawning) | Layer 6 (framework-health/) | flow-creation/, action-creation/ flows |
| **2: Agents** | Layer 4 (code changes) | Layer 3 (review/) | agent.md updates, agent-standards updates |
| **3: Contract** | Layer 4 (parser specs) | Layer 6 (harmony audit) | CONTRACT_EVOLUTION.md process |
| **4: Infrastructure** | Layer 5 (events), Layer 6 (monitoring) | Layer 6 (harmony detector) | Standard code-and-review/ flow |
| **5: Presentation** | Human (visual output) | Layer 6 (backwards audit) | Self-evolving UI system, component registry |
| **6: Harmony** | Layer 1 (remediation routing) | Itself (meta-monitoring) | backwards-harmony-audit/ flow |

**Read each row vertically:**

- **Memory:** Feeds routing decisions (I've seen this pattern before), monitored by nobody (it's the source of truth), evolved by every execution.
- **Routing:** Feeds agent spawning, monitored by harmony checks (are routing decisions valid?), evolved by creating new flows.
- **Agents:** Feeds code changes (agents write code), monitored by reviews (does code follow patterns?), evolved by updating agent.md files.
- **Contract:** Feeds parser implementations, monitored by harmony detector (do parsers match specs?), evolved deliberately through CONTRACT_EVOLUTION.md.
- **Infrastructure:** Feeds events to frontend and validation checks to harmony, monitored by harmony detector, evolved through normal code reviews.
- **Presentation:** Feeds human understanding, monitored by harmony's backwards audit (does UI expect what we broadcast?), evolved by the self-evolving UI system.
- **Harmony:** Feeds remediation routing, monitors itself (meta-aware), evolved by new audit flows as patterns emerge.

---

## Key Principles

### 1. The Orchestrator Coordinates, Agents Create

Layer 1 (Routing) never crosses into Layer 2 (Agents) implementation. The orchestrator compiles chains and spawns agents; it does not implement features. This separation is sacred because it allows agents to evolve independently.

### 2. Memory Is Not Optional

Every execution writes to Layer 0 (Memory). The system without memory is just a task runner, not a living system. A system that cannot learn is not alive.

### 3. Harmony Is the Immune System

Layer 6 (Harmony) exists to detect when layers drift out of sync. It does not fix things directly — it broadcasts violations, and Layer 1 routes to healing flows. This design allows the system to detect and heal problems automatically.

### 4. Evolution Is Built-In

Every layer has a mechanism for growth:
- **Layer 0:** Accumulates executions and learnings
- **Layer 1:** New flows are registered through flow-creation/
- **Layer 2:** New agents are created through action-creation/
- **Layer 3:** New formats are added through CONTRACT_EVOLUTION.md process
- **Layer 4:** New services and event types are added through code-and-review/
- **Layer 5:** New components and patterns emerge from self-evolving UI system
- **Layer 6:** New audit flows are registered as patterns are discovered

### 5. Two Universes, One System

Layer 4 deliberately splits into Events (for rendering) and Parsers (for monitoring). They serve different masters but protect the same contract. This split prevents the frontend from becoming tightly coupled to the orchestrator's output format.

### 6. Graceful Degradation

When parsing fails, the system does not crash. It degrades gracefully:
- Dashboard shows partial data, harmony violations appear
- Orchestrator can route to remediation
- System heals itself

This prevents cascading failures.

---

## The Two Universes (Layer 4 Deep Dive)

Understanding Layer 4's architectural split is crucial to understanding how ActionFlows stays in harmony:

### Universe A — Real-Time Events (Frontend-Facing)

```
Orchestrator Action Chain (backend):
  └─> Spawns Agent
      └─> Agent executes
          └─> Broadcasts StepStartedEvent (ws)
          └─> Broadcasts StepCompletedEvent (ws)
          └─> Broadcasts StepFailedEvent (ws)

Frontend Hook (react):
  └─> useChainEvents(chainId)
      └─> Opens WebSocket connection
      └─> Subscribes to event types
      └─> Updates local state (typed)
      └─> Components render state (never raw data)

Result: Live visualization, zero parsing, 100% type-safe
```

### Universe B — Monitoring (Contract-Facing)

```
Orchestrator Output (markdown):
  └─> Chain Compilation
      └─> Step Announcements
      └─> Step Completions

Backend Parser (ts):
  └─> parseChainCompilation(text)
  └─> parseStepAnnouncement(text)
  └─> Validates structure matches CONTRACT.md

Harmony Detector (service):
  └─> Compares parsed output to expected format
  └─> Detects mismatches
  └─> Broadcasts HarmonyViolationEvent

Result: Contract validation, drift detection, healing triggers
```

**Why This Split Matters:**
- If the orchestrator changes its output format, Universe B detects it immediately (harmony violation).
- The frontend continues working even if the orchestrator is broken (Universe A is independent).
- When Universe B detects a problem, it triggers Universe A to show violations in the harmony panel.

---

## See Also

- **HARMONY_SYSTEM.md** — Deep dive on how harmony monitoring works
- **CONTRACT_EVOLUTION.md** — Process for evolving contract formats
- **ORCHESTRATOR.md** — Routing and coordination rules
- **CONTEXTS.md** — Context routing table and triggers
- **FLOWS.md** — Flow registry with descriptions
- **ACTIONS.md** — Action catalog with agent descriptions
- **logs/INDEX.md** — Historical execution registry
- **LEARNINGS.md** — Session-discovered patterns and fixes

---

## Quick Start: Understanding the System

**For new contributors:**

1. **Start here:** Read this document (you are here)
2. **Understand harmony:** Read HARMONY_SYSTEM.md
3. **Learn the contract:** Skim CONTRACT.md (don't memorize, just know it exists)
4. **See it work:** Run `pnpm dev` and watch the dashboard while executing a chain
5. **Complete onboarding:** Run the onboarding/ flow, complete Module 9 (Harmony)

**For framework developers:**

1. **Understand routing:** Read ORCHESTRATOR.md completely
2. **Know the flows:** Study FLOWS.md and understand composition
3. **Learn agent patterns:** Read actions/_abstract/agent-standards/instructions.md
4. **Evolve the contract:** Follow CONTRACT_EVOLUTION.md for any format changes
5. **Monitor health:** Run `pnpm run harmony:check` regularly

---

## The Soul of the System

ActionFlows is built on a single insight: **A system that cannot learn is not alive.**

Every component of ActionFlows is designed to accumulate wisdom, detect problems, and heal itself. The 7 layers are not separate systems — they are one organism, with memory, nerves, and an immune system.

When you see a harmony violation in the dashboard, you are seeing the system's immune system at work. When you see a remediation flow execute automatically, you are seeing the system heal itself. When you read INDEX.md and see thousands of past executions, you are seeing the system's growing wisdom.

This is what a living system looks like.
