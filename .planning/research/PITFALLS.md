# Domain Pitfalls

**Domain:** Agentic Personal OS Dashboard (multi-session Claude Code orchestration, design system enforcement, real-time pipeline visualization, neural validation/healing, brownfield UI migration)
**Researched:** 2026-04-01 (updated with deep-dive on session economics, design enforcement, and migration strategy)

---

## Critical Pitfalls

Mistakes that cause rewrites, runaway costs, or architectural dead ends.

---

### Pitfall 1: Token Budget Explosion from Persistent Multi-Session Architecture

**What goes wrong:** The system design calls for 7+ persistent Claude Code sessions (one per workbench). Each session maintains its own context window. Agent Teams already consume ~7x more tokens than single sessions because each teammate maintains an isolated context window. Running 7 persistent workbench sessions simultaneously -- even if most are idle -- drains the 5-hour token quota at an unsustainable rate. Users on Pro plans (~44K tokens/window) will exhaust their quota in minutes; even Max20 users (~220K tokens/window) will hit weekly limits within days of normal use.

**Why it happens:** The "one persistent session per workbench" model sounds elegant but ignores Claude Code's billing model. Token consumption is per-session, not per-interaction. Idle sessions still accumulate overhead from heartbeats, context refreshes on resume, and auto-compaction cycles. The March 2026 prompt-caching regression made this worse -- users reported burning entire 5-hour limits in under 90 minutes with a single active session.

**Consequences:**
- Product becomes unusable for anyone below Max20 plan (~$200/month)
- User frustration drives abandonment; the core value proposition (persistent agents) becomes the core cost problem
- Forces architectural retreat to on-demand sessions, invalidating much of the UI design

**Prevention:**
- Implement a session pool with lazy activation: only the active workbench has a live Claude session. Background workbenches suspend to disk (conversation state + CLAUDE.md context) and resume on focus
- Add a token budget dashboard in the Settings workbench showing consumption per workbench, projected burn rate, and remaining quota
- Design the architecture so session count is configurable (1 shared session, 3 pools, 7 dedicated) -- let users choose their cost/responsiveness tradeoff
- Use `--resume` for session reconnection rather than spawning new sessions on every app restart

**Detection (warning signs):**
- Users report hitting rate limits within first hour of use
- Token consumption metrics show idle sessions consuming > 5% of active session budget
- Session resume calls fail frequently, forcing expensive new session creation

**Phase mapping:** Must be addressed in Phase 1 (Foundation/Infrastructure). Session lifecycle is the backbone; getting it wrong means rebuilding everything that depends on it.

---

### Pitfall 2: Claude Code Remote Session Fragility and Silent Disconnection

**What goes wrong:** Remote Control sessions drop silently with no recovery. The mobile/web client becomes completely unresponsive -- messages don't go through and there's no indication on either side that the connection is dead (GitHub Issue #34255). When reconnection fails, session state can be lost. After container restarts, sessions have been documented to "forget" conversation history due to progress-message gaps in the resumed transcript chain. OAuth tokens expire after a couple of days, killing sessions entirely. Reboots produce new session IDs, breaking the persistent identity model.

**Why it happens:** Claude Code Remote Control is designed for a single user on a single device, not for a dashboard managing 7 concurrent persistent sessions. The auto-reconnection mechanism has documented bugs. The 10-minute network timeout is aggressive for a desktop app that may sleep. The session ID instability after reboots means your "persistent" session is a new session wearing the old one's name.

**Consequences:**
- Users see stale/dead chat panels and don't know their agent is disconnected
- Work in progress is lost when sessions silently die
- Session history fragmentation -- the same "workbench" has multiple disconnected session logs
- The promise of "survives app restarts, machine off" from PROJECT.md is undeliverable without significant resilience engineering

**Prevention:**
- Build a session health monitor that actively probes each session's liveness (not just connection state, but actual round-trip responsiveness)
- Implement a session resurrection layer: when a session dies, automatically start a new one and inject the last N turns + CLAUDE.md context as a bootstrap prompt
- Store conversation state locally (the JSONL logs the ConversationWatcher already reads) as the source of truth, not the remote session's memory
- Display explicit session health status in each workbench's chat panel (green/yellow/red indicator with last-response timestamp)
- Implement heartbeat-based disconnect detection with < 30 second detection latency

**Detection:**
- Chat panel shows "connected" but agent hasn't responded in > 60 seconds
- ConversationWatcher's JSONL log stops updating while session claims to be active
- User reports of "my agent is ignoring me"

**Phase mapping:** Phase 1 (Foundation). The session management layer must be resilient before building any UI that depends on it. Design the abstraction so the UI never talks directly to Claude Code sessions -- always through a session manager that handles resurrection transparently.

---

### Pitfall 3: Design System Bypass by AI-Generated Code (The "Vibe Coding" Trap)

**What goes wrong:** Agents are instructed to "use the component library" but LLMs don't have deterministic access to the component API surface. Without structural enforcement, agents will generate raw CSS, inline styles, ad-hoc HTML, or components that look correct but don't use the actual design system tokens/components. Over time, the UI becomes a patchwork of "almost right" components that are visually similar but structurally different. Design drift accelerates because each agent session starts with partial context about the component library.

**Why it happens:** LLMs generate code based on probabilistic pattern matching, not deterministic API lookup. Even with a component library in CLAUDE.md, the agent may:
1. Hallucinate component props that don't exist
2. Use raw CSS values instead of design tokens (e.g., `color: #3b82f6` instead of `var(--color-primary)`)
3. Create wrapper components that duplicate existing library components
4. Misremember component names or import paths between sessions

The Figma MCP approach (scanning codebases and outputting structured rules) helps, but it's a suggestion layer, not an enforcement layer. Without runtime or build-time validation, "agents compose from the component library" is a guideline, not a guarantee.

**Consequences:**
- UI inconsistency across workbenches (each agent "remembers" the design system differently)
- Growing technical debt from near-duplicate components
- Design token changes don't propagate (raw values are scattered throughout)
- The core value proposition ("consistency is enforced infrastructure") becomes a lie

**Prevention:**
- Build a component allowlist that PreToolUse hooks validate against -- if the agent tries to write a file containing `<div style=` or raw hex colors, the hook blocks the write with an error message pointing to the correct component/token
- Generate a machine-readable component manifest (JSON schema of every component, its props, and its design tokens) that gets injected into every agent's context via CLAUDE.md
- Implement a PostToolUse linter hook that runs after every file write, checking for: raw CSS values, inline styles, imports not from the component library, and unknown component names
- Use CSS custom properties (design tokens) exclusively -- never raw values -- and validate this in CI with a custom ESLint rule
- Add visual regression testing (Playwright + screenshot comparison) that catches drift even when structural checks pass
- Key insight from Figma Blog: give AI direct access to design tokens via MCP, not just documentation. MCP servers that scan the component library and output structured rules reduce hallucination significantly

**Detection:**
- Grep for raw hex colors, `px` values, or `style=` in agent-generated files
- Component count growing faster than feature count
- Design token coverage decreasing over time (ratio of token usage to raw values)
- Visual inconsistencies between workbenches that share the same UI patterns

**Phase mapping:** Phase 2 (Design System & Component Library). The enforcement infrastructure must exist before agents start building UI. The hook validation layer is useless without a well-defined component surface to validate against.

---

### Pitfall 4: Neural Validation Infinite Loop and Token Waste

**What goes wrong:** The neural validation layer (hooks + `/btw` signaling) creates a feedback loop: hook detects violation -> signals agent via `/btw` -> agent attempts fix -> fix triggers another hook check -> hook finds new violation in the fix -> signals agent again. In the worst case, the agent enters a repair loop that consumes tokens without converging on a valid state. Even in the moderate case, the agent "fixes" a cosmetic issue, introducing a functional regression, which triggers another validation cycle.

**Why it happens:** Prompt-based validation (using Claude to evaluate Claude's output) is inherently non-deterministic. The same output may pass validation on one invocation and fail on the next. When the fix itself is generated by the same LLM, there's no guarantee of convergence. The validation criteria may also be ambiguous -- "design system compliance" is fuzzy enough that two evaluation passes disagree. PostToolUse hooks cannot undo actions (the tool already executed), so the repair must be a new write, which triggers another PostToolUse check.

**Consequences:**
- Token budget burned on repair loops instead of productive work
- Agent becomes unresponsive to user while stuck in a validation/fix cycle
- Paradoxically, the "healing" system causes more instability than it prevents
- User trust erodes when they see the agent spinning on trivial fixes

**Prevention:**
- Implement a circuit breaker: maximum 2 healing attempts per violation. After 2 failures, log the violation and surface it to the user with a "manual review needed" flag, then move on
- Separate deterministic validation (linting, allowlist checks, regex patterns) from probabilistic validation (prompt-based evaluation). Use deterministic checks first -- they're free, fast, and consistent. Only escalate to prompt-based evaluation for ambiguous cases
- Make `/btw` signals categorized with severity: CRITICAL (must fix now, blocks rendering), WARNING (note for future), INFO (learning only). Only CRITICAL triggers automatic repair
- Track repair success rate per violation type. If a violation type has < 50% first-attempt fix rate, downgrade it from automatic repair to manual review
- Never let the validation agent and the repair agent be the same session -- self-referential loops are the highest risk
- Use PreToolUse (blocks before execution) for critical checks, not PostToolUse (fires after execution) -- catching errors before they happen is cheaper than fixing them after

**Detection:**
- Agent producing > 3 consecutive tool calls that are all file writes to the same file
- Token consumption spike without corresponding feature output
- Validation pass rate decreasing over time (system getting stricter without getting better)
- User idle time increasing while agent is "working"

**Phase mapping:** Phase 3 or later (Neural Validation). This must come AFTER the design system and component library are stable. Validating against a moving target guarantees false positives.

---

### Pitfall 5: Brownfield Big-Bang UI Rewrite Disguised as "Incremental Migration"

**What goes wrong:** The project has ~100+ existing components (cosmic-themed), and the plan is to "strip cosmic map and replace with sidebar + 3-panel layout." Teams plan an "incremental" migration but in practice, because the new layout paradigm (3-panel + workbenches) is so fundamentally different from the old one (cosmic map + regions + stars), there's no meaningful incremental path. The first "small change" (replace cosmic map with sidebar) breaks every navigation pattern, rendering most existing components orphaned. The team ends up doing a big-bang rewrite while calling it incremental, getting the worst of both worlds: no clean architecture (carrying legacy patterns) and no stability (everything is changing at once).

**Why it happens:** The existing codebase is deeply coupled to the cosmic metaphor -- components like `CosmicBackground`, `LightBridgeEdge`, `SparkAnimation`, `MoonOrbit`, `BigBangAnimation`, `LiveRegion`, `GateCheckpoint`, `TraceRenderer` are not just styled differently, they're architecturally different from what a workbench-based 3-panel layout needs. The shared types and backend services can be preserved, but the frontend component tree needs a new root. Trying to gradually morph a CosmicMap into a Sidebar is like gradually turning a bicycle into a car.

**Consequences:**
- Months of "migration" work that's really two systems running in parallel, both broken
- Developer confusion about which components to use (old or new)
- Tests break across the board because the component hierarchy changes
- The actionflows framework (which is explicitly preserved) references UI components that no longer exist

**Prevention:**
- Accept the reality: the frontend UI layer is a rebuild, not a migration. The backend, shared types, WebSocket infrastructure, and actionflows framework are preserved. The React component tree from `App.tsx` down is new
- Create a clean `src/workbenches/` directory alongside the existing `src/components/`. New workbench pages are built fresh using the new component library. Old components are not imported into new ones
- Keep the old UI running on a feature flag (`LEGACY_UI=true`) during the transition so it remains a fallback
- Harvest reusable logic (hooks, contexts, utilities, WebSocket handling) from old components before deprecating them. The `useWebSocket` hook, `ConversationWatcher` integration, and session management logic are assets worth preserving
- Set a hard deadline for removing the legacy UI flag -- "dual mode" forever is worse than either approach alone
- Key lesson from Shopify and other major migrations: break into discrete phases that each deliver incremental value. Don't ship the new layout "all at once" -- ship sidebar first, then pipeline view, then workbench pages

**Detection:**
- New components importing from old component directories
- Increasing number of `// TODO: remove after migration` comments
- Feature flag still enabled 2+ phases after the rebuild "completed"
- Developer time split between fixing legacy components and building new ones

**Phase mapping:** Phase 1 (Foundation). The build-vs-rebuild decision must be made explicitly and committed to before any frontend work begins. Ambiguity here poisons every subsequent phase.

---

## Moderate Pitfalls

Mistakes that cause significant rework or performance degradation but don't require full architectural retreats.

---

### Pitfall 6: WebSocket Connection Proliferation in Electron

**What goes wrong:** With 7 workbenches each potentially needing real-time updates, the app opens multiple WebSocket connections. In the existing codebase, `useWebSocket` creates a connection per usage site. React re-renders (especially with ReactFlow) can inadvertently create duplicate connections. In Electron, the renderer process accumulates connections that aren't properly cleaned up, leading to zombie WebSocket connections that consume memory and file descriptors.

**Why it happens:** The existing `useWebSocket` hook stores the WebSocket in a `useRef` inside a component. If the component unmounts and remounts (tab switching in workbenches), a new connection is created without guaranteed cleanup of the old one. The `intentionalCloseRef` pattern helps but doesn't cover all edge cases (browser crashes, Electron process hangs). The polling fallback (after 3 failures) adds another resource to manage.

**Prevention:**
- Implement a singleton WebSocket connection manager at the module level (outside React's lifecycle). Components subscribe to channels, not connections
- Use a single multiplexed WebSocket connection for all workbenches, with message routing by workbench ID
- Implement connection reference counting -- only close when zero subscribers remain
- Add connection audit logging in development mode to detect leaks early
- Use exponential backoff for reconnection starting at 500ms, capping at ~2 minutes (10-15 retries max)

**Detection:**
- `chrome://inspect` shows growing WebSocket connection count
- Backend logs show multiple connections from the same client
- Memory usage in Electron main process grows monotonically during a session

**Phase mapping:** Phase 1 (Foundation). WebSocket architecture must be designed before building workbench-specific features.

---

### Pitfall 7: ReactFlow Pipeline Visualizer Re-render Cascade

**What goes wrong:** The pipeline visualizer receives real-time updates via WebSocket for chain execution progress. Each node state change (step started, step completed, decision gate result) triggers a ReactFlow node update. Without careful memoization, updating one node re-renders ALL nodes. With a chain of 20+ steps, this creates a cascade of re-renders on every WebSocket message, causing visible jank and dropped frames.

**Why it happens:** ReactFlow's `onNodesChange` handler is called frequently during any node state update. If the handler creates new object references (common with spread operators or inline callbacks), `React.memo` on custom nodes is defeated. Introducing an anonymous function to node props forces React to assign a new reference every render -- with 100 nodes, this means 99 unnecessary re-renders per drag operation. Storing node/edge state in React `useState` (instead of Zustand) makes this worse because every state update re-renders the entire component tree. Additionally, if WebSocket messages arrive faster than React can render (sub-second step transitions), updates queue up and cause frame drops.

**Prevention:**
- Use Zustand (not useState or Context) for ReactFlow node/edge state -- Zustand's selector pattern and `useShallow` prevents unnecessary re-renders
- Memoize ALL handler functions with `useCallback` and stable dependency arrays
- Declare custom node and edge components outside the parent component (never inline)
- Batch WebSocket updates: collect messages for 100ms before applying them to the graph state
- Implement `React.memo` with custom comparison on node components -- only re-render when that specific node's data changes
- For chains > 50 nodes, enable viewport-based rendering (only render visible nodes)

**Detection:**
- React DevTools Profiler shows > 60% of renders are wasted (props didn't change)
- Visible stutter when dragging/panning the pipeline view during active chain execution
- Browser performance tab shows layout thrashing during WebSocket message bursts

**Phase mapping:** Phase 2 (Pipeline Visualizer). Must be designed with performance constraints from the start -- retrofitting memoization into an existing ReactFlow implementation is painful.

---

### Pitfall 8: ConversationWatcher JSONL Parsing Fragility

**What goes wrong:** The ConversationWatcher reads Claude Code's JSONL conversation logs to detect gate passages and feed the pipeline visualizer. JSONL format is undocumented and internal to Claude Code. Format changes in any Claude Code update silently break the watcher. The watcher currently uses pattern matching against message content, which is brittle against prompt changes, model behavior changes, or output format evolution.

**Why it happens:** The ConversationWatcher is reverse-engineering Claude Code's internal log format. There's no stability guarantee. The gate detection regex patterns (G1-G14) match against natural language output from the orchestrator, which is inherently variable. Claude Code's `--output-format stream-json` provides a more stable contract, but the current implementation reads raw conversation logs instead.

**Prevention:**
- Migrate to `--output-format stream-json` (NDJSON) for session monitoring -- this is the official, supported output format
- Use `SubagentStart`/`SubagentStop` hooks for agent lifecycle tracking instead of parsing log content
- Maintain a JSONL schema version detector that warns when the log format changes unexpectedly
- Build the pipeline visualizer to degrade gracefully when events are missed (show "unknown status" rather than crash)
- Add integration tests that replay recorded JSONL files and verify gate detection accuracy

**Detection:**
- Gate detection accuracy dropping (events missed that should have been caught)
- ConversationWatcher throwing parse errors after Claude Code updates
- Pipeline visualizer showing stale states while the agent is clearly working

**Phase mapping:** Phase 2 (Pipeline Visualizer integration). Switch to official streaming JSON format during this phase rather than inheriting the current reverse-engineering approach.

---

### Pitfall 9: Electron Process Lifecycle Leaks with Multiple Claude Sessions

**What goes wrong:** The Electron main process spawns the backend as a child process via `fork()`. The plan adds Claude Code sessions (managed through the backend) on top of this. Event listeners on `stdout`, `stderr`, `error`, and `exit` are added to each child process without corresponding cleanup. If a session restarts (which happens frequently due to Pitfall 2), listeners accumulate. After several restart cycles, the main process has hundreds of zombie listeners, causing memory leaks and multiple handlers firing for the same events.

**Why it happens:** The existing code (`electron/main.ts:48-64`) already has this pattern for the backend process -- it adds listeners without cleanup. Scaling from 1 managed process to 8+ (backend + sessions) multiplies the problem. Electron's `win.close()` does not always release resources without proper `'closed'` event handling. Additionally, IPC listeners (`ipcMain.on`, `ipcRenderer.on`) accumulate across context reloads and are never removed.

**Prevention:**
- Implement a ProcessManager class that wraps child process lifecycle: spawn, attach listeners, and provide a `dispose()` method that removes all listeners and kills the process
- Use `AbortController` signals for listener cleanup -- when a session is being restarted, abort all existing listeners before attaching new ones
- Add a process audit in development mode that logs the number of active listeners per process
- Move Claude session management out of the Electron main process entirely -- run it in the backend (Node.js server) where it's easier to manage and not coupled to the desktop window lifecycle
- Use weak references for event listeners where applicable to allow garbage collection

**Detection:**
- Electron main process memory growing over time without corresponding feature usage
- Console logs showing duplicate handler invocations for a single event
- Process list showing orphaned Claude Code processes after app close

**Phase mapping:** Phase 1 (Foundation). Process lifecycle management must be solid before adding session management on top.

---

### Pitfall 10: `/btw` Signal Injection and Security Boundaries

**What goes wrong:** The `/btw` command is designed for the neural validation layer to signal violations to workbench agents. But `/btw` is a user-facing command that anyone (or any process with terminal access) can invoke. Without authentication or source verification, a compromised hook or malicious extension could inject false `/btw` signals, causing agents to "fix" things that aren't broken, or masking real violations by flooding the signal channel.

**Why it happens:** `/btw` piggybacks on Claude Code's existing infrastructure, which trusts all input from the same terminal session. There's no concept of "this /btw came from the validation layer" vs "this /btw came from a random process." CVE-2025-59536 demonstrated that untrusted repositories can trigger arbitrary shell commands. The security model assumes a single trusted user, not a multi-component system where hooks, agents, and user input share the same channel.

**Prevention:**
- Implement a nonce/token system: validation hooks include a signed token in `/btw` messages that agents verify before acting on them
- Rate-limit `/btw` signals per session: no more than N violations per minute to prevent flood attacks
- Log all `/btw` signals with source attribution (which hook, which file, which rule triggered it)
- Consider replacing `/btw` injection with a structured file-based signal (write violation to a known path, agent reads from that path) which is easier to audit and control

**Detection:**
- Unusual spike in `/btw` signals without corresponding code changes
- Agent performing "fixes" that the user didn't request and can't trace back to a validation rule
- Violation signals referencing files the agent didn't modify

**Phase mapping:** Phase 3 (Neural Validation). Must be designed into the signaling system from the start, not retrofitted.

---

### Pitfall 11: Hook Performance Penalty on Every Tool Invocation

**What goes wrong:** Neural validation hooks (PreToolUse/PostToolUse) fire on EVERY tool invocation -- every file read, every file write, every bash command. If hooks are not scoped carefully, a design system compliance check runs when the agent reads a config file, slowing everything down. HTTP-type hooks are especially expensive because they make a network round-trip to a validation endpoint.

**Why it happens:** Claude Code's hook system doesn't have fine-grained tool-name filtering at the config level (you can filter by `tool_name` in the matcher, but many teams use broad patterns). PostToolUse hooks can't undo actions, so developers add PreToolUse hooks "just in case." Each hook adds latency to every matching tool call. On complex chains with 50+ tool invocations, cumulative hook overhead becomes significant.

**Prevention:**
- Scope hooks narrowly: validation hooks should only match `Write`, `Edit`, `MultiEdit` tool names -- never `Read` or `Bash`
- Use fast local checks (regex, AST parsing) for PreToolUse, not HTTP calls to external services
- Set aggressive timeouts on HTTP hooks (5 seconds max)
- Profile hook execution time in development and set a budget (< 200ms per hook invocation)
- Use PostToolUse `async: true` for non-blocking checks that only need to log, not block

**Detection:**
- Agent feels slow despite no complex reasoning happening (the latency is in hooks, not in the model)
- Hook timeout errors in Claude Code logs
- Agent's "thinking time" increasing over the course of a session

**Phase mapping:** Phase 3 (Neural Validation). Design the hook architecture for minimal performance impact from the start.

---

## Minor Pitfalls

Issues that cause friction, bugs, or suboptimal UX but are recoverable without major rework.

---

### Pitfall 12: Context Window Amnesia Between Workbench Sessions

**What goes wrong:** When a workbench session auto-compacts (at ~83.5% of 200K tokens, or ~33K token buffer), it summarizes the conversation history. This summary loses specific details about component names, file paths, decision rationale, and in-progress work context. The agent "forgets" what it was working on and may repeat work, contradict earlier decisions, or ask questions it already answered.

**Prevention:**
- Implement per-workbench persistent memory files (like CLAUDE.md but workbench-scoped) that store: current task state, recent decisions, component names being worked on, and file paths modified
- Write critical context to disk (not just conversation memory) after every significant action
- Use the `/compact` command proactively with a custom instruction that prioritizes retaining technical specifics over conversation niceties
- For 1M context (Opus 4.6), auto-compaction triggers later, but the principle still applies -- disk is more reliable than context window

**Detection:**
- Agent asking questions about things it previously decided
- Repeated implementations of the same feature across compaction boundaries
- User frustration with "the agent forgot what we were doing"

**Phase mapping:** Phase 2+, ongoing. Gets worse as sessions get longer and more complex.

---

### Pitfall 13: Workbench Page State Bleed with Single-Page Architecture

**What goes wrong:** Each workbench renders its dedicated page in the content area. If workbenches share global state (React context, Redux store, or even CSS custom properties), switching workbenches causes state bleed. The PM workbench's filter settings appear in the Work workbench. The Studio workbench's preview CSS affects the main content area.

**Prevention:**
- Each workbench should be a self-contained React subtree with its own providers. Use key-based remounting (`<Workbench key={workbenchId}>`) to ensure clean state on switch
- Scope CSS using CSS Modules or a similar isolation strategy -- design tokens are global, but component styles are scoped
- Implement lazy loading per workbench to avoid loading all 7 workbenches at startup

**Detection:**
- State "leaking" between workbenches (filters, scroll positions, form values)
- CSS from one workbench affecting another
- Memory usage growing linearly with number of workbenches visited (no cleanup on switch)

**Phase mapping:** Phase 2 (Layout & Navigation).

---

### Pitfall 14: TypeScript Type Erosion from Agent-Generated Code

**What goes wrong:** The existing codebase already has 150+ type errors (from CONCERNS.md). Agents generating new code will either propagate these errors (by copying patterns from existing files) or introduce new `any` types and `as` casts to work around the existing type holes. The branded type system (SessionId, ChainId, StepId) gets bypassed because agents don't understand the brand pattern.

**Prevention:**
- Fix the critical TypeScript compilation errors BEFORE agents start generating code. Agents will copy whatever patterns they see
- Include branded type constructors (e.g., `brandedTypes.sessionId()`) explicitly in the component manifest that agents receive
- Add a PreToolUse hook that rejects file writes containing `as any` or `// @ts-ignore` without an approved exception comment
- Run `pnpm type-check` as a PostToolUse hook after every file write -- immediate feedback prevents accumulation

**Detection:**
- `pnpm type-check` error count increasing over time
- Grep for `as any`, `@ts-ignore`, `@ts-expect-error` showing growth
- Branded types being created with plain string literals instead of constructor functions

**Phase mapping:** Phase 0 (Pre-work / Technical Debt). Must be addressed before any agent starts generating code, or the type system becomes meaningless.

---

### Pitfall 15: AskUserQuestion Rendering Without Schema Stability

**What goes wrong:** PROJECT.md specifies rendering Claude's `AskUserQuestion` tool calls as interactive UI components (radio buttons, checkboxes, option cards). But AskUserQuestion's JSON schema is controlled by Claude Code, not by this project. If Claude Code changes the schema, the custom renderers break. Additionally, the tool response format must exactly match what Claude expects -- sending back a malformed response causes the session to error.

**Prevention:**
- Build the AskUserQuestion renderer as an adapter layer: parse Claude's schema into your own intermediate format, then render from that format. This isolates Claude Code schema changes from your UI components
- Maintain snapshot tests of known AskUserQuestion schema shapes from real Claude Code sessions
- Implement a fallback: if the schema is unrecognized, render it as plain text (the current behavior) rather than crashing
- Test the tool response roundtrip end-to-end: send a response, verify the agent received it correctly

**Detection:**
- Interactive UI components not rendering (falling back to text) after a Claude Code update
- Agent reporting "I didn't receive a valid response" after user interacts with the UI

**Phase mapping:** Phase 3 (Chat Panel / Agent Interaction).

---

### Pitfall 16: Session File Locking on Windows

**What goes wrong:** Claude Code writes session transcripts to JSONL files in `~/.claude/projects/`. On Windows (`core.autocrlf=true`), file locks can prevent multiple processes from reading/writing the same session file. The ConversationWatcher reads these files while Claude Code writes them. Resuming a session while another process holds a lock causes EBUSY errors.

**Prevention:**
- Ensure only one Agent SDK process per session ID at any time. The SessionManager must track active sessions and prevent duplicate spawns
- Open JSONL files in read-only, non-exclusive mode for the ConversationWatcher
- Enforce LF line endings for all regex-parsed files (`.gitattributes` with `text eol=lf`) -- CRLF breaks multiline regex patterns (existing learning L009)

**Detection:**
- EBUSY or EPERM errors in stderr when resuming sessions
- ConversationWatcher failing to read JSONL updates on Windows

**Phase mapping:** Phase 1 (Foundation). Windows-specific but affects the primary development platform.

---

### Pitfall 17: Agent SDK stdout/stderr Stream Corruption

**What goes wrong:** Agent SDK uses stdout for JSON message streaming and stderr for debug output. If stderr is not handled, debug messages appear as errors. If stdout parsing fails on a malformed line, the entire session stream breaks. Common CLI tools in hooks write errors to stdout by default instead of stderr.

**Prevention:**
- Always provide a `stderr` callback in Agent SDK options
- Parse stdout line-by-line with error recovery (skip malformed lines, log them, continue)
- Never assume every stdout line is valid JSON
- In hook scripts, explicitly redirect output to stderr (`command >&2`) so Claude receives error feedback correctly

**Detection:**
- Chat panel showing garbled messages or going silent
- JSON parse errors in the session bridge logs

**Phase mapping:** Phase 1 (Session Integration).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Session Lifecycle (Phase 1) | Token explosion (P1), Silent disconnects (P2), Process leaks (P9) | Lazy activation pool, health monitor, ProcessManager class |
| Build-vs-Rebuild Decision (Phase 1) | Big-bang rewrite trap (P5) | Accept frontend rebuild, preserve backend/shared/framework. Feature flag for legacy UI |
| WebSocket Infrastructure (Phase 1) | Connection proliferation (P6) | Singleton multiplexed connection, not per-component |
| Windows Compatibility (Phase 1) | File locking (P16), CRLF regex breaks | Read-only non-exclusive file access, LF enforcement in .gitattributes |
| Design System & Components (Phase 2) | Agent bypass (P3), Type erosion (P14) | PreToolUse allowlist hooks, machine-readable component manifest, fix existing type errors first |
| Pipeline Visualizer (Phase 2) | ReactFlow re-render cascade (P7), JSONL fragility (P8) | Zustand state, batched updates, migrate to stream-json |
| Layout & Navigation (Phase 2) | State bleed between workbenches (P13) | Key-based remounting, scoped CSS, lazy loading |
| Neural Validation (Phase 3) | Infinite loop (P4), Signal injection (P10), Hook performance (P11) | Circuit breaker (2 attempts max), deterministic-first validation, scoped hooks, nonce-signed /btw |
| Chat Panel / Agent UX (Phase 3) | AskUserQuestion schema drift (P15), Context amnesia (P12) | Adapter layer with fallback, per-workbench persistent memory files |
| Agent SDK Integration (Phase 1-2) | stdout/stderr corruption (P17) | Line-by-line parsing with error recovery, stderr callback |

---

## Sources

### Claude Code Sessions & Cost
- [Claude Code Remote Control Docs](https://code.claude.com/docs/en/remote-control)
- [Remote Control Reconnection Bug #34255](https://github.com/anthropics/claude-code/issues/34255)
- [Context Persistence Issue #2954](https://github.com/anthropics/claude-code/issues/2954)
- [Persistent Session Reboots Issue #29748](https://github.com/anthropics/claude-code/issues/29748)
- [Rate Limit Draining March 2026](https://www.roborhythms.com/claude-code-rate-limit-draining-march-2026/)
- [Claude Code Pricing 2026](https://www.verdent.ai/guides/claude-code-pricing-2026)
- [Claude Code Cost Management Docs](https://code.claude.com/docs/en/costs)
- [Context Window Management](https://www.mindstudio.ai/blog/claude-code-context-window-limit-management)
- [Claude Code 1M Context GA](https://claudefa.st/blog/guide/mechanics/1m-context-ga)
- [Context Buffer 33K-45K Problem](https://claudefa.st/blog/guide/mechanics/context-buffer-management)

### Hooks & Validation
- [Hooks Reference (Official)](https://code.claude.com/docs/en/hooks)
- [Hooks Production Patterns (Pixelmojo)](https://www.pixelmojo.io/blogs/claude-code-hooks-production-quality-ci-cd-patterns)
- [Hooks Guide 2026 (eesel)](https://www.eesel.ai/blog/hooks-in-claude-code)
- [Hook Control Flow (Steve Kinney)](https://stevekinney.com/courses/ai-development/claude-code-hook-control-flow)
- [Self-Healing Agent Pattern](https://dev.to/the_bookmaster/the-self-healing-agent-pattern-how-to-build-ai-systems-that-recover-from-failure-automatically-3945)
- [Self-Healing AI Systems (Arion Research)](https://www.arionresearch.com/blog/xh820vl36xy0pn9x1ril7d5nsx1wk9)

### Agent Communication & Teams
- [Agent Teams Guide (claudefast)](https://claudefa.st/blog/guide/agents/agent-teams)
- [Multi-Agent Systems Guide 2026](https://www.eesel.ai/blog/claude-code-multiple-agent-systems-complete-2026-guide)
- [Subagents Docs (Official)](https://code.claude.com/docs/en/sub-agents)
- [Multi-Agent Observability](https://github.com/disler/claude-code-hooks-multi-agent-observability)
- [Stream-JSON Chaining](https://github.com/ruvnet/ruflo/wiki/Stream-Chaining)

### Design System Enforcement
- [Design Tokens AI-Readable (Romina Kavcic)](https://learn.thedesignsystem.guide/p/design-tokens-that-ai-can-actually)
- [Design Systems + AI: MCP as Unlock (Figma Blog)](https://www.figma.com/blog/design-systems-ai-mcp/)
- [Code Rot vs Code Gen: AI-React Strategy](https://fullstacktechies.com/code-rot-vs-code-gen-ai-react-strategy/)
- [Agentic AI Autonomous Frontend Architectures](https://bryancode.dev/en/blog/the-rise-of-agentic-ai-building-autonomous-frontend-workflows-in-2026)

### ReactFlow & Performance
- [ReactFlow Performance Guide (Official)](https://reactflow.dev/learn/advanced-use/performance)
- [ReactFlow Optimization Guide (Synergy Codes)](https://www.synergycodes.com/blog/guide-to-optimize-react-flow-project-performance)
- [ReactFlow Re-render Issue #4983](https://github.com/xyflow/xyflow/issues/4983)

### WebSocket & Electron
- [WebSocket Best Practices (WebSocket.org)](https://websocket.org/guides/best-practices/)
- [WebSocket Reconnection Guide](https://websocket.org/guides/reconnection/)
- [Avoid Multiple WebSocket Connections in React](https://getstream.io/blog/websocket-connections-react/)
- [Electron Performance Docs](https://www.electronjs.org/docs/latest/tutorial/performance)
- [Electron Zombie Processes Issue #4817](https://github.com/electron/electron/issues/4817)

### Brownfield Migration
- [7 Key Brownfield Challenges (Utkrusht)](https://utkrusht.ai/blog/challenges-with-brownfield-development-codebases)
- [Modernising React App Lessons (Medium)](https://medium.com/eternalight-infotech/modernising-your-react-app-real-world-lessons-code-strategy-3e34c3806eb8)
- [Shopify React Native New Architecture Migration](https://shopify.engineering/react-native-new-architecture)

### Security
- [Remote Control Security Risks (Penligent)](https://www.penligent.ai/hackinglabs/claude-code-remote-control-security-risks-when-a-local-session-becomes-a-remote-execution-interface/)
- [Claude Code CVEs (The Hacker News)](https://thehackernews.com/2026/02/claude-code-flaws-allow-remote-code.html)

---

*Pitfalls audit: 2026-04-01 (comprehensive update with session economics, enforcement architecture, and migration strategy research)*
