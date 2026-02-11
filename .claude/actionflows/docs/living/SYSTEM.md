# The Living System

> The practical guide to how ActionFlows works as a living organism.
> For how it FEELS, see cosmic/MODEL.md. For how it's BUILT, see docs/architecture/.

---

## Overview

ActionFlows is productivity software that evolves through use. It's not traditional task automation—it's a collaborative system where you express intentions, a brain (orchestrator) compiles plans, and hands (agents) execute them. The software learns from every execution, growing smarter with each session.

**The Physics-Brain-Will-Hands Model:**

- **Physics** (the code) is the underlying reality—imperfect, mutable, the laws governing the system.
- **Brain** (the orchestrator) understands these laws and can rewrite them when needed.
- **Will** (you, the human) expresses intention—the force that sets everything in motion.
- **Hands** (agents) execute work within the physics, carrying out the brain's decisions.

This document describes how the system operates, grows, and heals itself. It's the bridge between the cosmic metaphor (how it feels) and the technical implementation (how it's built).

### Entity Mapping

| Cosmic Name | Living System Name | Code Name | Purpose |
|-------------|-------------------|-----------|---------|
| Stars | Workbenches | `StarId` type, `Stars/` folder | Specialized work surfaces on the cosmic map |
| Tools | Tools | `ToolId` type, `Tools/` folder | Embedded capabilities inside workbenches |
| Moons | Data Sources | `MoonOrbit` interface | External feeds orbiting workbenches |
| Gates | Checkpoints | `GateCheckpoint` interface | Contract enforcement points between workbenches |
| Sparks | Agents | `SparkParticle` interface | Self-contained executors visible while active |
| The Void | Harmony | `HarmonySpace` type, `Harmony/` folder | The health layer—space between workbenches |

---

## The Four Natural Laws

Every system has governing principles. This one has four operational laws:

### 1. Software = Physics

The code is the raw underlying reality. Software is not certain or reliable—it's physics that can be buggy, inconsistent, surprising. Just like real physics before we understood it. This system treats code as mutable laws, not sacred text.

### 2. Orchestrator = Brain

The intelligence that understands the physics and has the power to change them. The orchestrator doesn't just coordinate—it actively reshapes the system's laws when needed. When code needs fixing, the brain rewrites the physics.

### 3. Human = Will

The prompt. The intention. The force that sets everything in motion. Humans don't code directly—they express will, and the brain reshapes physics through agents.

### 4. Agents = Hands

The executors that work within the physics. They carry out the brain's decisions and transform the code according to the will. Agents are the limbs through which the brain acts on the system.

**These are operational principles, not metaphors.** The system actually works this way: human expresses intent → brain compiles a chain → agents execute steps → code changes. The physics evolves.

---

## Workbenches (Stars)

### What They Are

Workbenches are the primary work surfaces of the system. Each is specialized for a type of work—analyzing code, building features, reviewing changes, managing projects. They appear as glowing regions on the cosmic map and have functional interiors where real work happens.

### The Eight Framework Defaults

Every ActionFlows instance starts with eight foundational workbenches:

1. **WORK** (The Hearth) — Your active sessions, ongoing chains, conversation history
2. **MAINTENANCE** (The Observatory) — System health monitoring, status dashboards
3. **EXPLORE** (The Cartographer's Table) — Codebase navigation, file exploration
4. **REVIEW** (The Tribunal) — Code reviews, approval workflows, quality gates
5. **SETTINGS** (The Loom) — Configuration, preferences, backend connections
6. **PM** (The War Table) — Project management, task tracking, roadmaps
7. **ARCHIVE** (The Vault) — Historical sessions, completed work, searchable memory
8. **RESPECT** (The Guardian) — Spatial rules, layout constraints, boundary monitoring

Users can create custom workbenches beyond these eight. Each custom workbench is a new star on the cosmic map.

### How They Work

- **Organization:** Each workbench has a unique ID, configuration, interior view, and state
- **Navigation:** Zoom in on a star → enter its interior. Zoom out → return to the cosmic map
- **State Signaling:** A workbench's visual state on the map (color, glow, animation) communicates its internal condition before you enter. MAINTENANCE glows amber when degraded. REVIEW brightens when PRs pile up.
- **In the cosmic model:** Stars — glowing regions in space
- **In code:** `StarId` type (e.g., `'work'`, `'maintenance'`), `Stars/` component folder

### Growth Behavior

Workbenches that get more use accumulate richer state. Your WORK interior fills with conversation threads. ARCHIVE grows deeper with historical sessions. The system tracks usage and adapts accordingly—workbenches you ignore remain minimal; workbenches you rely on become information-dense.

---

## Tools (Embedded Capabilities)

### What They Are

Tools are reusable UI components embedded inside workbench interiors. They are NOT workbenches—they don't appear on the cosmic map, can't be navigated to directly, and don't have their own external state. They're instruments used within the work surfaces.

### Framework Default Tools

1. **Editor** — Code editing capability (Monaco-based)
2. **Canvas** — Live preview playground for visual rendering
3. **Coverage** — Contract compliance visualization, reads gate logs

### Attachment Model

Any workbench can embed any tool. WORK might embed the Editor to let you edit session notes. EXPLORE might embed the Editor to read files. A custom visualization workbench might embed the Canvas for live rendering. Tools are multi-use instruments, not destinations.

- **In the cosmic model:** Tools — embedded capabilities, not visible as separate bodies
- **In code:** `ToolId` type (e.g., `'editor'`, `'canvas'`), `Tools/` component folder

---

## Data Sources (Moons)

### What They Are

Data sources are external feeds that provide information to workbenches. They're visible as orbiting bodies on the cosmic map—each moon circles its parent star, showing connectivity at a glance.

### Examples

- **External APIs** — A moon pulling data from GitHub, Slack, or analytics services
- **Log Feeds** — Real-time log streams from backend services
- **Databases** — Query results from external databases
- **File Watchers** — Filesystem change notifications

A workbench's moons tell you what information it's consuming without entering the interior.

- **In the cosmic model:** Moons — orbiting bodies
- **In code:** `MoonOrbit` interface, `CosmicMap/MoonOrbit.tsx` component

---

## Checkpoints (Gates)

### What They Are

Checkpoints are contract enforcement points where data flows between workbenches. Every time work crosses a boundary—a chain compilation passing from the brain to agents, a review result returning—it passes through a gate.

### How They Work

- **Data Flow:** Gates validate that the work passing through conforms to the contract (format, structure, completeness)
- **Trace Accumulation:** Every crossing leaves a trace in the gate log, preserved in Harmony
- **Visible on Map:** Gates appear as checkpoints on the cosmic map, positioned at workbench boundaries

Gates are infrastructure—you don't enter them like workbenches, but you can inspect them from Harmony's workbench.

- **In the cosmic model:** Gates — checkpoints in space
- **In code:** `GateCheckpoint` interface, `CosmicMap/GateCheckpoint.tsx` component

---

## Agents (Sparks)

### What They Are

Agents are self-contained executors with clear missions. Each reads its own `agent.md` file to understand its constraints, output format, and operational rules. Agents know nothing of each other—complete isolation.

### Lifecycle

1. **Spawned by brain** — The orchestrator compiles a chain and spawns agents for each step
2. **Execute work** — Each agent performs its task (analyze code, write implementation, review changes)
3. **Complete and vanish** — When work finishes, the agent disappears. No persistent state.

While active, agents are visible in the cosmic space as moving particles—sparks carrying signals between workbenches.

### Agent Isolation

This is a core design principle. Each agent reads only its own `agent.md`. The brain provides task, context, and component inputs—no ad-hoc instructions. This isolation lets agents evolve independently. New agent types can be created without affecting existing ones.

- **In the cosmic model:** Sparks — moving particles of light
- **In code:** `SparkParticle` interface, `actions/*/agent.md` definitions

---

## Harmony (The Health Layer)

### What It Is

Harmony is the system-wide health monitoring and healing layer. It's NOT a workbench in the traditional sense—it's the space between all workbenches. But it has a workbench view (click empty space on the cosmic map) for viewing gate logs and violations.

### What Harmony Does

- **Detection:** `harmonyDetector.ts` monitors contract compliance across all gates. When output formats drift from specs, harmony detects it.
- **Routing:** Violations broadcast via WebSocket. The brain reads the violation and routes to a remediation flow.
- **Healing:** Agents execute the fix (update parser, fix output format, sync contract). The system heals itself.
- **Memory:** Every healing cycle writes to `LEARNINGS.md`, so the same mistake doesn't recur.

### Harmony's Workbench

Click on empty space between stars and the cosmic map dissolves into Harmony's interior. You see:
- Gate logs (traces of all data flows)
- Contract violations (where the rules broke)
- Compliance dashboards (system-wide health)

When everything is healthy, you never notice Harmony. When something breaks, the space between stars flickers, calling you to investigate.

- **In the cosmic model:** The Void — the background, the terrain
- **In code:** `HarmonySpace` type, `Harmony/` folder, `harmonyDetector.ts` service

---

## How the System Routes

### Request Reception

You type a message into the Command Center (the input field at the bottom of the cosmic map). The brain receives your intention.

### Context Scoring

The brain extracts keywords from your message and scores them against 6 routable contexts:
- **work** — "implement", "build", "create feature"
- **maintenance** — "fix bug", "refactor", "optimize"
- **explore** — "explore", "investigate", "how does"
- **review** — "review", "audit", "check quality"
- **settings** — "configure", "create flow", "add agent"
- **pm** — "plan", "roadmap", "what's next"

Two contexts are auto-target (archive, harmony). One is manual-only (editor).

The highest-scoring context wins. See `CONTEXTS.md` for the full routing table.

### Chain Compilation

Once the brain knows the context, it compiles a chain—a sequence of agent steps. It consults memory first:
- `INDEX.md` — Has this been solved before? Reuse that pattern.
- `LEARNINGS.md` — What mistakes were made? Avoid them.
- `FLOWS.md` — Is there a registered flow for this? Use it.

If no flow matches, the brain composes an ad-hoc chain from atomic actions in `ACTIONS.md`.

### Execution

The brain presents the chain for approval. Once approved, agents spawn and execute. Results flow back through gates, Harmony monitors compliance, and the cycle completes.

**Reference:** Read `ORCHESTRATOR.md` for full routing rules, `CONTEXTS.md` for trigger lists, `FLOWS.md` for reusable patterns.

---

## How the System Grows

The system evolves on two timescales.

### Per-Interaction Growth

After every chain completes:
- Colors shift on the cosmic map
- Traces accumulate on connections (paths that carry more work grow brighter)
- Workbench state enriches (conversation history, cached results)
- The cosmos you see after a day of work looks different from the one you saw that morning

This is the visualization of learning. The software adapts in real time.

### Long-Arc Growth

Over weeks and months:
- **Ad-hoc chains become flows** — When the brain composes the same pattern 3+ times, it's promoted to `FLOWS.md`. What required manual composition becomes a one-step invocation.
- **New workbenches emerge** — Custom stars appear on the map when usage triggers readiness. The system detects "this user needs a specialized space for X" and materializes it.
- **Memory accumulates** — `INDEX.md` grows with execution history. `LEARNINGS.md` catalogs root causes and fixes. The brain gets smarter.
- **Fog of war lifts** — Undiscovered capabilities reveal when you're ready for them. Contextual emergence, not feature unlock gates.

**The system you use today is not the system you'll use next month. It will have evolved—because you used it.**

---

## How the System Heals

The healing cycle is a closed loop: detect → route → fix → remember.

### The Healing Cycle

```
  Harmony detects drift          Brain pathfinds             Agents execute fix
  (Layer 6: Harmony)         →   (Layer 1: Routing)      →   (Layer 2: Agents)
         |                              |                            |
         v                              v                            v
  Violation broadcast           Routes to remediation         code-and-review/ flow
  (HarmonyViolationEvent)       (reads FLOWS.md)              (updates parsers, specs)
                                                                     |
                                                                     v
                                                              Memory records
                                                              (LEARNINGS.md update)
                                                                     |
                                                                     v
                                                              Next session starts
                                                              with this wisdom
```

### Real Example (2026-02-09)

On 2026-02-09, a backwards harmony audit detected that `harmonyDetector.ts` had broken support for 12 of 17 contract formats. The `useChainEvents` hook was dead code, and the `StepSkippedEvent` was missing from the event stream.

The terrain had dimmed. Harmony broadcast violations. The brain routed to a remediation flow. Sparks carried the repair. All three issues were fixed in the same session. The terrain brightened. The system healed itself.

This is not aspirational—it happened, and the learnings are recorded in `LEARNINGS.md` entry L008.

### Graceful Degradation

When parsing fails (orchestrator outputs malformed markdown, frontend can't parse it), the system doesn't crash:
1. Dashboard shows partial view (what it could parse)
2. Harmony violation surfaces ("format drift detected")
3. Brain routes to remediation
4. Agents fix the issue
5. Next session benefits from the fix

No cascading failures. Resilience is built in.

---

## The Operational Layers

The cosmic entities described above are implemented through several operational layers:

| Living System Entity | Implemented By | Key Files |
|---------------------|---------------|-----------|
| **Workbenches** | React components, StarId type system | `Stars/*.tsx`, `workbenchTypes.ts` |
| **Tools** | Embedded React components, ToolId type | `Tools/*/*.tsx` |
| **Data Sources** | MoonOrbit interface (planned), data fetching | `CosmicMap/MoonOrbit.tsx` |
| **Checkpoints** | GateCheckpoint interface, validation logic | `CosmicMap/GateCheckpoint.tsx` |
| **Agents** | Agent.md definitions, spawn system | `actions/*/agent.md` |
| **Harmony** | harmonyDetector service, HarmonySpace type | `Harmony/`, `harmonyDetector.ts` |
| **Memory** | Markdown registry files | `logs/INDEX.md`, `LEARNINGS.md` |
| **Routing** | Orchestrator rules, context scoring | `ORCHESTRATOR.md`, `CONTEXTS.md`, `contextRouter.ts` |
| **Contract** | Format specs, parser functions | `CONTRACT.md`, `packages/shared/src/contract/` |

### How Layers Interact

- **Memory feeds Routing** — Before compiling chains, the brain consults `INDEX.md` and `LEARNINGS.md`
- **Routing spawns Agents** — Brain decides which agents to spawn per step
- **Agents transform Physics** — Code changes happen through agent execution
- **Contract enforces Checkpoints** — Gates validate all inter-workbench data flows
- **Harmony monitors everything** — Detects drift across all layers
- **Routing receives violations** — Brain routes to remediation flows when Harmony detects issues

Every layer has a growth mechanism:
- Memory accumulates (INDEX.md grows)
- Routing registers new flows (FLOWS.md evolves)
- Agents spawn new types (new `agent.md` files created)
- Contract versions formats (CONTRACT_VERSION increments)
- Harmony creates new audit flows (backwards-harmony-audit/ was born from a learning)

---

## User Sovereignty

Everything is mutable. Full sovereignty. No asterisks.

ActionFlows is open source. Forking and evolving is not just permitted—it is the highest expression of the system's own thesis. A system that believes in evolution does not exempt itself from evolution.

### The Five-Layer Sovereignty Model

| Layer | What it is | Mutable? |
|-------|-----------|----------|
| Platform | The ability to have evolving productivity software | Yes — and if you evolve this, you've proven the thesis |
| Template | The creator's proof-of-concept system | Yes — fork it, gut it, reshape it |
| Philosophy | Chains, harmony, sin test, contracts | Yes — swap for any paradigm |
| Physics | The code, UI, features | Yes — you can change everything |
| Experience | Learnings, flows, evolution | Yes — each user's journey is unique |

You can modify the physics (UI, workbenches, features), change the philosophy (replace chains with any orchestration model), reshape the template, and even evolve the platform concept itself. This is open source software—the product is not a protected codebase, it is an idea: that productivity software should learn from use and grow alongside its users. Ideas spread through adoption and mutation, not immutability.

The only thing that defeats the purpose is stagnation. Nobody using it. Nobody forking it. Nobody evolving it. That is death. Everything else—every fork, every mutation, every radical reimagining—proves the thesis.

### Inference Plus Override

The framework infers relationships between workbenches from usage patterns. Connections form automatically when work flows between areas. But you can always override: rearrange the topology, create new workbenches, delete connections. Spatial control, not configuration files.

### Structured Graph Schema

The cosmic map requires a formal data model—nodes (workbenches), edges (connections), metadata (discovery state, traces, health). This is the single source of truth for UI rendering. When you reshape the cosmos, this schema updates. When the brain produces new connections, this schema updates. One graph, one truth.

---

## See Also

### Primary Documentation
- **cosmic/MODEL.md** — How it FEELS. The metaphor, the navigation, the experience.
- **living/HARMONY.md** — Deep dive on how harmony monitoring and healing works.
- **docs/architecture/** — Technical implementation details for developers.

### Orchestration Rules
- **ORCHESTRATOR.md** — Brain behavior rules, decision gates, routing logic.
- **CONTEXTS.md** — Context routing table with triggers and scoring.
- **FLOWS.md** — Flow registry with descriptions and composition patterns.
- **ACTIONS.md** — Action catalog with agent descriptions.

### Memory Files
- **logs/INDEX.md** — Historical execution registry (every chain logged).
- **LEARNINGS.md** — Session-discovered patterns, root causes, fixes.

### Contracts & Evolution
- **CONTRACT.md** — Formal specification of 17 output formats.
- **docs/architecture/CONTRACT_EVOLUTION.md** — Process for evolving contract formats.

---

## Quick Start: Using the System

### For New Explorers

1. **Launch the app** — Watch the Big Bang. See the cosmos ignite from your first work.
2. **Navigate the cosmic map** — Click workbenches (stars) to enter their interiors. Zoom out to return to the universe view.
3. **Use the Command Center** — Type intentions into the input field at the bottom. Watch the brain compile chains and dispatch agents.
4. **Observe the terrain** — Notice how connections between workbenches shift color. Harmony is always watching.

### For Coders/Power Users

1. **Complete onboarding** — Run the `onboarding/` flow. Complete Module 9 (Harmony) for full context.
2. **Understand harmony** — Read `living/HARMONY.md` to learn what the terrain between workbenches means.
3. **Learn the contract** — Skim `CONTRACT.md`. Know it exists, know what gates enforce.

### For Framework Developers

1. **Understand routing** — Read `ORCHESTRATOR.md` completely. This is the brain's source code.
2. **Know the flows** — Study `FLOWS.md` and understand composition patterns.
3. **Learn agent patterns** — Read `actions/_abstract/agent-standards/instructions.md`.
4. **Evolve the contract** — Follow `CONTRACT_EVOLUTION.md` for any format changes.
5. **Monitor health** — Run `pnpm run harmony:check` regularly.

---

**A system that cannot learn is not alive. This one learns with every session, every chain, every mistake, every discovery. You and the system grow together.**
