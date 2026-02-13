# ActionFlows Dashboard: The Five Threads Roadmap

**Last Updated:** 2026-02-13
**Status:** Living Document

---

## Vision Statement

ActionFlows Dashboard today is a living universe where a human orchestrator coordinates agents to reshape codebases. When all five threads are complete, it becomes something larger: a **multi-surface, capability-aware, community-powered creative platform** where software is built through conversation from any device, where dashboard panels are programmable tools the brain can wield, where agents have personalities that match their purpose, where chains produce living visual artifacts alongside code, and where the community shares proven patterns through a public flow registry.

The orchestrator no longer sits behind a single Electron window -- it is reachable from Slack, from the terminal, from VS Code, from a phone. The dashboard is no longer a passive viewer -- it is an active participant, offering its panels as capabilities the orchestrator invokes. Agents are no longer faceless workers -- they are characters with distinct voices, speeds, and risk tolerances. The universe grows not just through the creator's work, but through an ecosystem of shared flows installed with a single click.

This is the transition from "IDE with an AI brain" to "living software universe accessible from everywhere."

---

## The Five Threads

The roadmap is organized into five parallel capability threads, each inspired by OpenClaw's architectural patterns:

| Thread | Name | Purpose |
|--------|------|---------|
| **Thread 1** | Multi-Surface Orchestration | Reach the orchestrator from Slack, CLI, VS Code, mobile -- not just Electron |
| **Thread 2** | Node Architecture (Capabilities) | Dashboard panels become invokable tools the orchestrator can wield |
| **Thread 3** | FlowHub | Community flow registry -- install proven patterns with one click |
| **Thread 4** | Live Canvas | Agents produce living visual artifacts (dashboards, diagrams, timelines) |
| **Thread 5** | Agent Personalities | Agents have character -- bold, cautious, curious, skeptical, decisive |

---

## Phased Execution Plan

### Phase 0: The Bedrock
**Tagline:** *"Before the universe expands, the ground must hold."*

**Purpose:** Establish the technical foundations that all five threads depend on.

**Deliverables:**
1. **Correlation ID infrastructure** -- Add `correlationId?: string` to WebSocket message protocol (shared types + ws handler). Enables request/response patterns required by Thread 2 (capability invocation) and Thread 1 (surface routing).
2. **`BaseEvent` surface field** -- Add optional `surfaceId?: SurfaceId` field to `BaseEvent` interface. Non-breaking, defaults to `'electron'`.
3. **User-scoped broadcast filtering** -- Extend `ClientInfo` to filter broadcasts by `userId` when in multi-user mode. Prevents session leakage across surfaces.
4. **Shared type scaffold** -- Create five new type files as empty-but-typed stubs:
   - `packages/shared/src/surfaceTypes.ts`
   - `packages/shared/src/capabilityTypes.ts`
   - `packages/shared/src/flowHubTypes.ts`
   - `packages/shared/src/artifactTypes.ts`
   - `packages/shared/src/agentTypes.ts`

**Estimated Scope:**
- Modified files: 4
- New files: 5
- Total: ~9 files, ~200 lines of new code

**Success Criteria:**
- `pnpm type-check` passes
- `pnpm test` passes (no regressions)
- WebSocket messages can optionally include `correlationId` and `surfaceId`
- Existing Electron dashboard behavior is unchanged

**Risk Factors:** Low. All changes are optional fields and additive types.

---

### Phase 1: The Awakening
**Tagline:** *"The panels open their eyes. The universe learns to see itself."*

**Threads Included:** Thread 2 (Node Architecture) + Thread 5 (Agent Personalities) foundation

**Rationale:** Thread 2 is the FOUNDATION -- all other threads depend on it. Thread 5's foundation (personality types and parsing) is low-risk, zero-dependency work that can run in parallel.

#### Thread 2: Node Architecture (Primary)

**Deliverables:**
1. **Capability type system** (`packages/shared/src/capabilityTypes.ts`)
   - `Capability` interface with id, name, description, provider, schemas, invokable flag
   - `CapabilityId` branded type (e.g., `'dashboard.terminal.execute'`)
   - Capability invocation/result/error message types
   - JSON Schema references for input/output validation

2. **Capability registry service** (`packages/backend/src/services/capabilityRegistry.ts`)
   - Register/unregister capabilities
   - List capabilities with filtering (by provider, by online status)
   - Invoke capability (route to provider, await response via correlation ID)
   - Track capability availability (online/offline/degraded)

3. **Capability REST endpoints** (`packages/backend/src/routes/capabilities.ts`)
   - `GET /api/capabilities` -- List all registered capabilities
   - `GET /api/capabilities/:capId` -- Get capability details
   - `POST /api/capabilities/:capId/invoke` -- Invoke a capability (HTTP fallback)

4. **WebSocket capability protocol** (extend `packages/backend/src/ws/handler.ts`)
   - `capability:register` -- Client announces capabilities at connect
   - `capability:invoke` -- Server requests capability execution
   - `capability:result` -- Client returns result (matched by correlationId)
   - `capability:error` -- Client reports failure

5. **Dashboard capability provider** (`packages/app/src/capabilities/DashboardCapabilityProvider.tsx`)
   - React context wrapping the app
   - Registers dashboard capabilities with backend at startup via WebSocket
   - Listens for `capability:invoke` events, routes to component, returns result
   - Initial capabilities: `dashboard.cosmic-map.state`, `dashboard.terminal.execute`

6. **Tool-as-capability wrappers** (one per existing tool)
   - `packages/app/src/components/Tools/EditorTool/capability.ts`
   - `packages/app/src/components/Tools/CanvasTool/capability.ts`
   - `packages/app/src/components/Tools/CoverageTool/capability.ts`

7. **MCP capability tools** (`packages/mcp-server/src/capabilities.ts`)
   - `list_capabilities` tool -- Returns available capabilities
   - `invoke_capability` tool -- Calls a capability by ID

#### Thread 5: Agent Personalities (Foundation)

**Deliverables:**
1. **Agent personality types** (`packages/shared/src/agentTypes.ts`)
   - `AgentPersonality` interface (tone, speed, risk, communication style)
   - `AgentMetadata` interface (actionType, personality, preferred model, estimated duration)

2. **Personality parser service** (`packages/backend/src/services/personalityParser.ts`)
   - Parse `## Personality` section from agent.md files
   - Cache parsed personalities in memory
   - Fallback to `'balanced'` personality if section missing

3. **Personality badge component** (`packages/app/src/components/PersonalityBadge.tsx`)
   - Visual indicator for agent personality traits
   - Color-coded: bold=orange, cautious=blue, curious=teal, skeptical=purple, decisive=red

4. **Agent.md personality annotations** (extend 4-6 existing agent.md files)
   - Add `## Personality` metadata section to: code/backend, code/frontend, review, analyze, brainstorm, audit agent files

**Estimated Scope:**
- Thread 2: ~12 new files, ~1500 lines
- Thread 5 foundation: ~4 new files + 6 modified files, ~400 lines
- Total: ~16 new files, 6 modified files, ~1900 lines

**Success Criteria:**
- Orchestrator (via MCP) can call `list_capabilities` and see dashboard capabilities
- Orchestrator can call `invoke_capability('dashboard.cosmic-map.state')` and receive current map state
- Agent personality metadata is parseable from agent.md files
- PersonalityBadge renders in SquadPanel alongside agent cards
- E2E test: Invoke a capability via MCP, verify response

**Risk Factors:** Medium. Capability invocation introduces request/response over WebSocket -- needs solid error handling and timeout logic.

---

### Phase 2: The Expansion
**Tagline:** *"The universe reaches beyond its borders. New voices, new visions."*

**Threads Included:** Thread 1 (Multi-Surface) + Thread 4 (Live Canvas) + Thread 5 (Agent Personalities completion)

**Rationale:** With the capability layer in place (Phase 1), three threads can now advance in parallel. This is the highest-parallelism phase.

#### Sub-phase 2A: Multi-Surface Orchestration (Thread 1)

**Deliverables:**
1. **Surface type system** (`packages/shared/src/surfaceTypes.ts`)
   - `SurfaceId` type: `'electron' | 'slack' | 'cli' | 'vscode' | 'mobile'`
   - `SurfaceConfig` interface (id, label, icon, capabilities list)
   - `SurfaceMessage` interface (surfaceId, sessionId, content, messageType)

2. **Surface manager service** (`packages/backend/src/services/surfaceManager.ts`)
   - Register/unregister surfaces per session
   - Route input from any surface to orchestrator
   - Broadcast orchestrator output to all surfaces subscribed to session
   - Track active surfaces per session

3. **Surface adapter base class + Slack adapter** (`packages/backend/src/surfaces/`)
   - `BaseSurfaceAdapter.ts` -- Abstract adapter with translate-in/translate-out pattern
   - `SlackAdapter.ts` -- Slack Bot API integration (slash commands, message events, thread replies)
   - Slack webhook routes (`packages/backend/src/routes/surfaces/slack.ts`)

4. **CLI adapter** (`packages/backend/src/surfaces/CLIAdapter.ts`)
   - Wraps existing `claudeCliManager.ts`
   - Adds surface identification to CLI sessions

5. **VS Code adapter stub** (`packages/backend/src/surfaces/VSCodeAdapter.ts`)
   - HTTP-based adapter for future VS Code extension
   - Routes (`packages/backend/src/routes/surfaces/vscode.ts`)

6. **Mobile adapter stub** (`packages/backend/src/surfaces/MobileAdapter.ts`)
   - REST API wrapper for mobile apps
   - Routes (`packages/backend/src/routes/surfaces/mobile.ts`)

7. **Session input endpoint** (extend `packages/backend/src/routes/sessions.ts`)
   - `POST /api/sessions/:sessionId/input-from-surface` -- Non-WebSocket input path

#### Sub-phase 2B: Live Canvas (Thread 4)

**Deliverables:**
1. **Artifact type system** (`packages/shared/src/artifactTypes.ts`)
   - `Artifact` interface (id, sessionId, chainId, stepNumber, type, content, data, updatedAt)
   - Artifact types: `'html' | 'markdown' | 'svg' | 'mermaid' | 'react'`
   - `ArtifactId` branded type

2. **Artifact storage service** (`packages/backend/src/services/artifactStorage.ts`)
   - CRUD for artifacts (Memory/Redis storage)
   - Session/chain association
   - Artifact lifecycle (create, update, archive)

3. **Artifact parser service** (`packages/backend/src/services/artifactParser.ts`)
   - Parse agent output for `<!-- ARTIFACT_START -->` / `<!-- ARTIFACT_END -->` markers
   - Extract artifact content, assign ID, store in artifactStorage
   - Return artifact ID for embedding in step results

4. **Artifact REST endpoints** (`packages/backend/src/routes/artifacts.ts`)
   - `POST /api/artifacts` -- Store artifact
   - `GET /api/artifacts/:artifactId` -- Retrieve artifact
   - `PUT /api/artifacts/:artifactId` -- Update artifact data

5. **Artifact renderer component** (`packages/app/src/components/ArtifactRenderer.tsx`)
   - Renders artifacts by type (HTML in sandboxed iframe, Markdown via renderer, SVG direct, Mermaid via mermaid.js)
   - DOMPurify sanitization for HTML artifacts
   - Iframe sandbox: `sandbox="allow-scripts"` (no `allow-same-origin`)

6. **Canvas artifact hooks**
   - `packages/app/src/hooks/useCanvasArtifact.ts` -- Artifact lifecycle management
   - `packages/app/src/hooks/useArtifactData.ts` -- Live data binding via WebSocket

7. **Canvas capability** (`packages/app/src/capabilities/canvasCapability.ts`)
   - Exposes `dashboard.canvas.render-artifact` capability (uses Phase 1 capability layer)

8. **Agent artifact helpers** (`.claude/actionflows/actions/_abstract/artifact-helpers/`)
   - `instructions.md` -- Guide for agents on producing artifacts
   - `templates/dashboard.html` -- Dashboard template
   - `templates/diagram.svg` -- Diagram template

9. **Contract extension** -- Add Format 19 (Artifact Output) to CONTRACT.md

#### Sub-phase 2C: Agent Personalities Completion (Thread 5)

**Deliverables:**
1. **Personality-based routing** (extend `packages/backend/src/routing/contextRouter.ts`)
   - Consider personality preference when selecting agents
   - User preference integration

2. **User personality preferences** (`packages/backend/src/routes/preferences.ts`)
   - `GET /api/preferences/personality` -- Get preferences
   - `PUT /api/preferences/personality` -- Update preferences

3. **Model selector service** (`packages/backend/src/services/modelSelector.ts`)
   - Select prompt phrasing based on personality
   - Track performance metrics per personality

4. **Personality-aware cosmic map** (extend `packages/app/src/components/CosmicMap/RegionStar.tsx`)
   - Star visual style reflects dominant personality
   - Work (warm orange glow), Review (cool purple), Explore (curious blue shimmer)

5. **Agent character card extension** (extend `packages/app/src/components/SquadPanel/AgentCharacterCard.tsx`)
   - Show PersonalityBadge inline with agent avatar
   - Tooltip with personality breakdown

6. **Orchestrator personality injection** (extend spawn prompt patterns)
   - Orchestrator includes personality metadata in agent spawn prompts

**Estimated Scope (entire Phase 2):**
- Sub-phase 2A: ~10 new files, 3 modified, ~1200 lines
- Sub-phase 2B: ~10 new files, 2 modified, ~1400 lines
- Sub-phase 2C: ~3 new files, 4 modified, ~600 lines
- Total: ~23 new files, 9 modified, ~3200 lines

**Success Criteria:**
- Slack bot can send a message that triggers an ActionFlows chain and receives the response in the same Slack thread
- An agent can produce an HTML artifact that renders live in the Canvas panel
- Agent personality badges appear on the squad panel and cosmic map stars
- User can set personality preferences via API

**Risk Factors:**
- Thread 1 (Medium-High): Slack API integration requires external service account, OAuth setup, webhook configuration
- Thread 4 (Medium): XSS risk from agent-generated HTML. Mitigation: DOMPurify + iframe sandboxing + CSP headers
- Thread 5 (Low): Pure metadata and UI enhancements

---

### Phase 3: The Convergence
**Tagline:** *"The universe opens its gates. What was built for one becomes a gift to many."*

**Threads Included:** Thread 3 (FlowHub)

**Rationale:** FlowHub is the capstone thread. It depends (hard) on Thread 2 (flows reference capabilities) and benefits (soft) from Thread 1 (flows can specify surface requirements) and Thread 5 (flows carry personality metadata).

#### Sub-phase 3A: Local FlowHub Infrastructure

**Deliverables:**
1. **FlowHub type system** (`packages/shared/src/flowHubTypes.ts`)
   - `FlowHubEntry` interface (flowId, name, description, author, version, downloads, rating, source, URLs)
   - `FlowHubFlowId` branded type
   - `FlowManifest` interface (flow definition + agent file references + capability requirements + surface requirements + personality metadata)

2. **Flow installer service** (`packages/backend/src/services/flowInstaller.ts`)
   - Download flow manifest from a URL
   - Extract and write agent.md files to `.claude/actionflows/actions/`
   - Append flow entry to `.claude/actionflows/FLOWS.md` with `[Source: FlowHub]` marker
   - Broadcast `RegistryChangedEvent` after installation
   - Validate flow manifest schema (Zod)
   - Verify capability requirements against local registry

3. **Flow publisher service** (`packages/backend/src/services/flowPublisher.ts`)
   - Read local flow definition
   - Package agent.md files + manifest into publishable format
   - Generate shareable manifest URL

4. **FlowHub REST endpoints** (`packages/backend/src/routes/flowHub.ts`)
   - `GET /api/flow-hub/flows` -- Browse flows (local cache + remote if available)
   - `GET /api/flow-hub/flows/:flowId` -- Flow details
   - `POST /api/flow-hub/flows/:flowId/install` -- Install flow locally
   - `POST /api/flow-hub/flows/:flowId/publish` -- Publish flow

5. **Registry extension** (extend `packages/backend/src/routes/registry.ts`)
   - Add `source: 'local' | 'flow-hub'` field to registry entries
   - `POST /api/registry/install-from-hub` endpoint

#### Sub-phase 3B: FlowHub Browser UI

**Deliverables:**
1. **FlowHub browser component** (`packages/app/src/components/FlowHub/FlowHubBrowser.tsx`)
   - Grid view of available flows (local + FlowHub)
   - Filter by category, search by keyword
   - Sort by downloads, rating, recency

2. **Flow card component** (`packages/app/src/components/FlowHub/FlowCard.tsx`)
   - Preview card: name, description, author, version, rating, install button
   - Visual indicator for installed vs. available
   - Capability requirement badges
   - Personality metadata display

3. **Flow details component** (`packages/app/src/components/FlowHub/FlowDetails.tsx`)
   - Full flow description, usage examples, agent list
   - Install/uninstall button
   - Version history
   - Dependency check (warns if required capabilities are missing)

4. **Install flow dialog** (`packages/app/src/components/FlowHub/InstallFlowDialog.tsx`)
   - Confirmation before install
   - Shows what will be written (agent.md files, FLOWS.md entry)
   - Security warning for external flows: `[External Source]` marker

5. **Settings integration** (extend `packages/app/src/components/Stars/SettingsStar.tsx`)
   - Add "FlowHub" tab to settings workbench
   - FlowHub browser embedded in tab

#### Sub-phase 3C: FlowHub API Client (Remote Registry)

**Deliverables:**
1. **FlowHub API client** (`packages/backend/src/services/flowHubClient.ts`)
   - Fetch flows from remote FlowHub API
   - Cache responses locally (Redis/Memory with TTL)
   - API key authentication for publishing
   - Rate limiting and error handling

2. **Flow signature verification**
   - GPG signature validation for published flows
   - `[Verified Author]` badge in UI for signed flows
   - Reject unsigned flows in "strict mode"

3. **Cosmic map integration** (extend CosmicMap)
   - New regions materialize when FlowHub flows are installed
   - Visual distinction between local and FlowHub-sourced regions

**Estimated Scope:**
- Sub-phase 3A: ~5 new files, 2 modified, ~800 lines
- Sub-phase 3B: ~5 new files, 1 modified, ~1000 lines
- Sub-phase 3C: ~2 new files, 2 modified, ~500 lines
- Total: ~12 new files, 5 modified, ~2300 lines

**Success Criteria:**
- User can install a flow from a manifest URL, and it appears in FLOWS.md and the registry browser
- User can browse available flows in the FlowHub tab within Settings
- Installed FlowHub flows execute identically to local flows
- Flow manifest validation catches malformed or incompatible flows
- Cosmic map shows new regions for installed flows

**Risk Factors:**
- High: Security. FlowHub flows execute in the same environment as local flows. Malicious agent.md files could exfiltrate data or destroy files.
  - Mitigation Phase 1: Curated flows only (manual security review before publishing)
  - Mitigation Phase 2: Community moderation + GPG flow signatures
  - Mitigation Phase 3: Sandboxed agent execution (Docker, see Future Enhancements)

---

### Phase 4: The Polishing
**Tagline:** *"The universe shines. Every edge refined, every connection deepened."*

**Threads Included:** Cross-thread integration, quality hardening, documentation

**Rationale:** After all five threads are individually complete, this phase weaves them together.

**Deliverables:**

1. **Cross-thread integration testing**
   - E2E test: Slack message triggers chain with personality-aware agent that produces a canvas artifact, visible from Electron dashboard
   - E2E test: Install FlowHub flow that requires canvas capability, verify it works
   - E2E test: CLI surface invokes dashboard capability, receives result

2. **Unified surface dashboard** (new component in CosmicMap or status bar)
   - Shows all connected surfaces per session (Slack connected, CLI connected, Electron active)
   - Surface activity feed (which surface last sent input)

3. **FlowHub flow with capability + personality requirements**
   - Publish a sample flow that specifies: requires `dashboard.canvas.render-artifact` capability, uses `bold` personality, works from Slack surface
   - Installer validates all requirements before install

4. **Performance optimization**
   - Capability invocation latency benchmarking (<100ms target for local capabilities)
   - Artifact rendering performance (large HTML artifacts, many concurrent artifacts)
   - Surface adapter connection pooling (Slack API rate limits)

5. **Security audit**
   - Full review of artifact sandboxing (iframe CSP, DOMPurify config)
   - FlowHub flow signature verification end-to-end test
   - Multi-surface session isolation verification
   - XSS testing on Canvas artifacts

6. **Documentation**
   - User guide: "Connecting Surfaces" (Slack, CLI, VS Code)
   - Developer guide: "Creating Capabilities" (how to expose new dashboard capabilities)
   - Developer guide: "Publishing to FlowHub" (how to share flows)
   - Developer guide: "Agent Personality Guide" (how to define personality metadata)
   - Developer guide: "Creating Artifacts" (how agents produce visual outputs)

**Estimated Scope:**
- ~5 new files, ~15 modified files, ~1500 lines
- Documentation: ~5 new docs

**Success Criteria:**
- All cross-thread E2E tests pass
- Capability invocation latency < 100ms for local capabilities
- Security audit produces no critical or high findings
- Documentation covers all five threads for both users and developers

**Risk Factors:** Medium. Cross-thread integration bugs that only manifest when threads interact.

---

## Milestone Map

```
TIMELINE (estimated)

Phase 0          Phase 1                    Phase 2                        Phase 3              Phase 4
The Bedrock      The Awakening              The Expansion                  The Convergence      The Polishing

|--- P0 ---|-------- P1 ----------|------------- P2 -------------------|------ P3 ---------|--- P4 ---|

            Thread 2               Thread 1                              Thread 3
            Node Architecture      Multi-Surface                         FlowHub
            [================]     [=============================]       [================]

            Thread 5 (foundation)  Thread 4
            [======]               Live Canvas
                                   [=============================]

                                   Thread 5 (completion)
                                   [==============]

CRITICAL PATH:

  P0 ──> Thread 2 ──> Thread 1 ──────────────> Thread 3 ──> P4
           |                                      ^
           |           Thread 4 ─────────────────┘
           |           Thread 5 ─────────────────┘
           └──> Thread 5 (foundation)

PARALLEL TRACKS:

  Track A: Thread 2 ──> Thread 1 ──> Thread 3
  Track B: Thread 2 ──> Thread 4 ──────────┘
  Track C: Thread 5 (foundation) ──> Thread 5 (completion) ──> Thread 3

COMPONENT COUNTS:

  Phase 0:  9 files  (~200 LOC)     [Infrastructure]
  Phase 1: 22 files  (~1900 LOC)    [Capability + Personality types]
  Phase 2: 32 files  (~3200 LOC)    [Surfaces + Canvas + Personality UI]
  Phase 3: 17 files  (~2300 LOC)    [FlowHub full stack]
  Phase 4: 20 files  (~1500 LOC)    [Integration + Polish]
  ──────────────────────────────
  TOTAL:  ~100 files (~9100 LOC)
```

---

## Future Enhancements

Three capabilities were identified during ideation but parked for later evaluation. Here is where they naturally slot into the roadmap:

### ACP Bridge (Agent Communication Protocol)

**What:** Standardized protocol for agent-to-agent communication, enabling ActionFlows agents to collaborate with agents from other ACP-compatible systems.

**Natural Slot:** After Phase 1, alongside Phase 2A (Multi-Surface)

**Rationale:** ACP is essentially another "surface" -- an external agent system is a surface that sends structured input and receives structured output. The surface adapter pattern from Thread 1 provides the exact architecture needed.

**Integration Approach:**
- Create `ACPAdapter.ts` following the `BaseSurfaceAdapter` pattern
- ACP messages translate to ActionFlows events, and vice versa
- An ACP-connected agent appears as a "surface" in the session
- The capability layer (Thread 2) exposes ActionFlows capabilities to ACP agents

**Estimated Additional Scope:** ~3 new files, ~500 lines

---

### Voice Wake ("Hey ActionFlows")

**What:** Voice-activated interaction with the orchestrator. Speak intentions, hear responses. Ambient computing for software development.

**Natural Slot:** After Phase 2A (Multi-Surface), as a new surface adapter

**Rationale:** Voice is another surface. Once the multi-surface architecture is in place, voice becomes a surface adapter that translates speech-to-text input into ActionFlows events, and text-to-speech output back to the user.

**Integration Approach:**
- Create `VoiceAdapter.ts` in `packages/backend/src/surfaces/`
- Uses Web Speech API (browser) or Whisper API (backend) for speech-to-text
- Uses browser SpeechSynthesis or ElevenLabs API for text-to-speech
- Surface capability: `'text'` only (voice doesn't support markdown, HTML, or interactive)
- Wake word detection runs locally in Electron (no cloud dependency for privacy)

**Estimated Additional Scope:** ~4 new files, ~800 lines (excluding external API integration)

**Dependencies:** Phase 2A (multi-surface architecture), plus external speech API access

---

### Docker Sandboxing (Isolated Agent Execution)

**What:** Run FlowHub agents in isolated Docker containers with limited file system access, network restrictions, and resource quotas. Defense-in-depth for untrusted flows.

**Natural Slot:** After Phase 3 (FlowHub), as a FlowHub security enhancement

**Rationale:** Docker sandboxing is a Phase 3 security graduation. Phase 3 launches with curated flows only (manual security review). Docker sandboxing enables Phase 3 to graduate to community-submitted flows with automated security boundaries.

**Integration Approach:**
- Create `packages/backend/src/services/sandboxRunner.ts` -- Docker container lifecycle management
- FlowHub flows marked `sandboxed: true` execute inside containers
- Container image: Minimal Node.js + Claude CLI, no network access by default
- File system: Bind-mount only the session's working directory (read-write) and actionflows config (read-only)
- Resource limits: CPU quota, memory limit, execution timeout
- Flow installer checks for `sandboxed` flag and warns user about resource requirements

**Estimated Additional Scope:** ~3 new files, ~600 lines, Docker infrastructure setup

**Dependencies:** Phase 3 (FlowHub), Docker Engine available on host

---

## The North Star

### The Fully Realized ActionFlows Universe

Close your eyes and imagine.

You wake up. Your phone buzzes -- a Slack notification. An agent in your ActionFlows universe detected a production anomaly overnight. It compiled a chain, executed a diagnosis, and produced a visual artifact: a live dashboard showing the error rate spike, the affected endpoints, and a proposed fix. All of this happened while you slept, triggered by a webhook surface you connected last month.

You open Slack and type: "Show me the fix." The orchestrator -- the same brain that manages your entire codebase -- routes your request through the Slack surface, invokes the `dashboard.canvas.render-artifact` capability on your Electron desktop (which was left open), and the artifact appears on your screen at home while a summary appears in your Slack thread. You review it from your phone during breakfast.

"Apply the fix," you say. The orchestrator compiles a chain: code agent (bold personality, fast), review agent (skeptical personality, thorough), commit agent. The code agent produces the patch AND a visual diff artifact showing what changed. The review agent scrutinizes it with its characteristic thoroughness, flags one edge case, and the code agent addresses it. The commit lands. The anomaly dashboard updates in real-time -- error rate dropping.

At your desk, you open VS Code. The ActionFlows extension is connected as another surface. You type in the command palette: "ActionFlows: Install flow 'incident-response' from FlowHub." The flow installs -- three new agent.md files, a custom personality for the triage agent (cautious, detail-oriented), and a canvas template for incident timelines. Your cosmic map in the Electron dashboard shimmers -- a new star materializes in the Maintenance region.

A colleague messages you: "Can you share that e2e testing flow?" You publish it to FlowHub in one click. Within days, fifty teams have installed it. One of them improves the flow and publishes a fork. You install the improvement. The ecosystem grows.

By afternoon, you are brainstorming a new feature. The explore agent -- curious, lateral-thinking -- produces a Mermaid diagram artifact showing three architectural options. You drag artifacts between canvas panels, comparing approaches side by side. "I like option B," you say into your microphone (voice wake is on). The orchestrator hears, compiles a chain, and the work agent (bold, decisive) starts building.

You check your phone one last time before dinner. A notification: "Chain completed. 14 files created, 3 tests added, all passing. Artifact: architecture diagram updated." You open the artifact in your mobile browser -- a clean, interactive SVG showing the new feature integrated into the system architecture.

This is ActionFlows realized:

- **One brain, infinite surfaces.** The orchestrator is reachable from everywhere. Your intent flows in from any device, any channel, any moment of inspiration.

- **Dashboard as participant, not observer.** Panels are not passive displays -- they are tools the brain wields. The terminal executes, the canvas renders, the map navigates, the editor writes. The dashboard is the orchestrator's body.

- **Agents with character.** You know your agents like you know your team. The bold one ships fast. The skeptical one catches bugs. The curious one finds unexpected solutions. You choose the right personality for the right job, or let the system learn your preferences.

- **Code that shows itself.** Chains do not just produce invisible file changes -- they produce living artifacts. Dashboards, diagrams, timelines, diffs. The work becomes visible, tangible, shareable.

- **A universe that grows from community.** Your flows are not yours alone. FlowHub turns proven patterns into shared infrastructure. Install a testing flow from a team in Tokyo. Publish your deployment flow for a startup in Berlin. The ecosystem compounds.

- **Full sovereignty.** Every layer -- the surface adapters, the capability runtime, the flow registry, the canvas renderer, the personality engine -- is open source, MIT licensed, and designed to be modified. This is YOUR universe. The defaults are the creator's gift; the evolution is yours.

The universe is not built. It grows. And it grows from every direction at once.

---

## How to Contribute

This roadmap is a living document. Contributions are welcome across all phases:

### For Developers

- **Phase 0-1 contributors:** Start with capability infrastructure and personality types. These are the foundations everything else builds on.
- **Phase 2 contributors:** Choose a thread that matches your interest:
  - Thread 1 (Multi-Surface): Experience with Slack API, WebSocket protocols, or mobile development
  - Thread 4 (Live Canvas): Experience with iframe sandboxing, XSS prevention, or data visualization
  - Thread 5 (Personalities): Experience with metadata parsing, UI components, or prompt engineering
- **Phase 3 contributors:** FlowHub requires full-stack skills (backend registry, frontend browser, security review)
- **Phase 4 contributors:** Integration testing, performance optimization, documentation writing

### For Flow Creators

- Start creating flows now using the existing flow registry (`.claude/actionflows/FLOWS.md`)
- Document your flows thoroughly -- they may become FlowHub candidates in Phase 3
- Experiment with agent personality combinations to discover effective patterns

### For Security Reviewers

- Phase 2 (Thread 4): Review artifact sandboxing implementation
- Phase 3: Review FlowHub flow validation and signature verification
- Future: Docker sandboxing implementation review

### Where to Start

1. **Read the planning document:** `.claude/actionflows/logs/plan/inspiration-roadmap_2026-02-13-20-27-41/plan.md`
2. **Check current progress:** Look for existing work in the relevant phase directories
3. **Pick a thread:** Choose the capability thread that excites you most
4. **Join the conversation:** Open issues or discussions about specific threads or phases

---

**This roadmap represents the evolution from "IDE with an AI brain" to "living software universe accessible from everywhere." Every contribution moves us closer to that North Star.**
