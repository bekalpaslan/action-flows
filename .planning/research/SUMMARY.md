# Project Research Summary

**Project:** ActionFlows Dashboard
**Domain:** Agentic personal OS dashboard (brownfield evolution of React+Express+Electron monorepo)
**Researched:** 2026-04-01
**Confidence:** HIGH

## Executive Summary

ActionFlows Dashboard is evolving from a cosmic-themed orchestration visualizer into a workbench-based agentic personal OS. The research surveyed the 2026 agentic IDE landscape (Cursor, Windsurf, Claude Code, Google Antigravity, Warp 2.0, Kiro, OpenAI Codex, CrewAI, and others), audited the existing codebase for brownfield constraints, and identified the libraries, architecture, features, and pitfalls that shape the build plan. The product occupies a unique position: it is an orchestration dashboard, not an editor fork or terminal. No competitor combines pipeline visualization, design system enforcement via neural validation, and workbench-scoped persistent agent sessions in one product. That combination is the core value proposition.

The recommended approach is a four-layer build: Foundation (layout + design system), Agent Integration (Claude sessions + chat + pipeline), Intelligence (hooks-based validation + safety controls), and Power Features (self-healing, skills, cron, custom workbenches). All required technologies are mature and production-ready -- no experimental or unproven libraries. The most important architectural decision is that the backend is the sole owner of Claude Code sessions via `@anthropic-ai/claude-agent-sdk`, the frontend communicates exclusively through WebSocket, and Claude Code hooks provide the nervous system for validation and lifecycle events. This is a local-first desktop architecture; the Agent SDK requires Claude Code CLI on the same machine.

The top risks are: (1) token budget explosion from running 7+ persistent sessions simultaneously -- mitigated by lazy session activation with only the active workbench holding a live session; (2) silent session disconnection -- mitigated by health monitoring and a session resurrection layer that uses local conversation logs as the source of truth; (3) design system bypass by AI-generated code -- mitigated by PreToolUse/PostToolUse hook validation against a machine-readable component manifest; (4) neural validation infinite loops -- mitigated by a circuit breaker pattern (max 2 repair attempts, then escalate to human); and (5) the brownfield UI rewrite trap -- mitigated by accepting that the frontend component tree is a rebuild (not a migration), while preserving the backend, shared types, WebSocket infrastructure, and actionflows framework.

## Key Findings

### Recommended Stack

The existing monorepo (React 18.2, Vite 6.2, Express 4.18, Electron 35, TypeScript 5.3) stays intact. Research identified ~20 packages to add across four capability areas. All versions were verified via `npm view` on 2026-04-01. See `.planning/research/STACK.md` for full details.

**Core technologies:**
- `@anthropic-ai/claude-agent-sdk` 0.2.89: Persistent Claude sessions per workbench -- official SDK with `resume`, `forkSession`, streaming, and session lifecycle management. Backend-only install.
- `@xyflow/react` 12.10.2: Pipeline visualizer upgrade -- replaces deprecated `reactflow` 11. Better TypeScript, named exports, `node.measured` dimensions.
- `tailwindcss` 4.2.2 + `@tailwindcss/vite` 4.2.2: Design system enforcement -- CSS-first config, `@theme` directive maps to existing CSS custom properties. Additive adoption, not a rewrite.
- `zustand` 5.0.12: Client-side state management -- separate stores per domain (pipeline, session, UI). Lightweight, TypeScript-native, replaces ad-hoc React state.
- `react-resizable-panels` 4.8.0: IDE-like 3-panel layout -- sidebar + workspace + chat. Collapse/snap support, keyboard resize.
- Radix UI primitives (11 packages): Unstyled, accessible dialog/tabs/tooltip/dropdown/etc. -- styled with Tailwind, composed via CVA variants.
- `class-variance-authority` 0.7.1 + `clsx` 2.1.1 + `tailwind-merge` 3.5.0: The component styling triad -- type-safe variants, conditional classes, conflict resolution.
- `lucide-react` 1.7.0 + `sonner` 2.0.7: Icons and toast notifications -- standard companions for Tailwind-based design systems.

**Critical version requirement:** Tailwind CSS v4 and `@tailwindcss/vite` must be the same version (4.2.2). The Vite plugin replaces the legacy PostCSS-based setup entirely.

**What to avoid:** `reactflow` (deprecated), `@anthropic-ai/claude-code` (renamed), `styled-components`/Emotion (CSS-in-JS runtime overhead), MUI (opinionated styling fights custom design system), Redux (unnecessary ceremony), `@anthropic-ai/sdk` (raw API, lacks Claude Code's tool system).

### Expected Features

The feature landscape was surveyed across 15+ competing products and validated against the RedMonk 2025 developer survey and Stack Overflow 2025 AI section. See `.planning/research/FEATURES.md` for the full competitive matrix.

**Must have (table stakes -- 16 features):**
- Persistent agent sessions per workbench -- #1 developer frustration when agents forget context
- 3-panel resizable layout -- standard IDE muscle memory
- Real-time pipeline visualization -- agents working invisibly creates user anxiety
- Multi-agent status dashboard -- which agents are running, their progress, pause/resume
- Chat panel per workbench -- scoped conversation, not a single global chat
- Interactive tool call rendering -- AskUserQuestion as radio buttons/cards, not plain text
- Command palette + keyboard navigation -- power user expectation
- Checkpoint/rollback system -- instant revert when agents modify many files
- Human-in-the-loop approval gates -- risk-based escalation for destructive operations
- MCP server integration -- assumed seamless external tool connectivity
- Session history and search -- find past conversations and decisions
- Design token system -- visual consistency is the core value proposition
- Toast/notification system -- agent events surface to user
- Settings panel, workbench switching, command palette

**Should have (differentiators -- 13 features):**
- Neural validation layer -- NO competitor has automated design system enforcement at the infrastructure level. This is the single biggest differentiator.
- `/btw` violation signaling -- non-blocking feedback loop to agents. Unique.
- Self-healing flows -- closed-loop quality: validate, signal, fix, re-validate
- Spec-driven development -- flows as executable specs, not just instructions
- Flow management as first-class UI -- browseable, composable flow library
- Workbench-scoped agent personality -- Review agent is strict, Explore agent is curious
- Custom workbench creation -- user-defined domains beyond 7 defaults
- Per-workbench skills, scheduled tasks, session forking, learning persistence UI

**Defer to v2+:**
- Agent teams (cross-workbench parallel agents) -- requires multi-session coordination protocol that does not exist yet
- Studio workbench (live preview) -- complex Vite HMR integration; ship other workbenches first
- Chat window visual redesign -- explicitly deferred per PROJECT.md pending Figma designs

### Architecture Approach

The system follows a local-first, session-per-workbench architecture with three tiers: the Express backend as the brain (session management via Agent SDK, hook handling, workbench registry, WebSocket hub), the React frontend as the face (3-panel layout, pipeline visualization, chat panels, component library), and Claude Code hooks as the nervous system (validation, lifecycle events, compliance enforcement). See `.planning/research/ARCHITECTURE.md` for data flow diagrams and code patterns.

**Major components:**
1. **SessionManager** (backend) -- creates, resumes, streams Claude sessions. Maps workbenchId to sessionId. Handles lifecycle: create, resume, fork, close. Sole owner of Agent SDK calls.
2. **HookHandler** (backend) -- receives HTTP POST from Claude Code hooks. Processes validation results, lifecycle events. Routes to SessionManager (feedback) and WebSocket Hub (broadcast).
3. **WorkbenchRegistry** (backend) -- manages workbench definitions (7 defaults + custom). Tracks workbench-session mapping.
4. **WebSocket Hub** (backend) -- multiplexes real-time events to frontend. Channels per workbench for scoped messaging. Single multiplexed connection, not per-component.
5. **PipelineStore / SessionStore / UIStore** (frontend, zustand) -- separate stores per domain. Pipeline holds ReactFlow nodes/edges keyed by workbenchId. Session tracks connection state and chat history. UI tracks active workbench, panel sizes, sidebar state.
6. **Component Library** (frontend) -- Radix primitives + Tailwind + CVA. The single source of truth for all visual elements. Agents compose from this library exclusively.

**Key patterns to follow:**
- Store-per-domain (zustand slices, not monolithic store) -- different update frequencies need different stores
- Component library as infrastructure -- every UI element via CVA variants, never raw CSS
- Hook-driven pipeline updates -- no polling; hooks push lifecycle events through WebSocket
- Session resume on reconnect -- `resume` option with `persistSession: true`, not new sessions

### Critical Pitfalls

17 pitfalls were identified (5 critical, 6 moderate, 6 minor). See `.planning/research/PITFALLS.md` for full analysis with prevention and detection strategies.

1. **Token budget explosion (P1)** -- 7+ persistent sessions drain the 5-hour token quota at unsustainable rates. Prevention: lazy activation pool where only the active workbench has a live session; configurable session count (1 shared / 3 pool / 7 dedicated); token budget dashboard.
2. **Silent session disconnection (P2)** -- Remote sessions drop with no recovery signal. Prevention: session health monitor with heartbeat-based detection (<30s latency); session resurrection layer using local JSONL logs as source of truth; explicit health indicator in chat panel.
3. **Design system bypass by agents (P3)** -- LLMs generate raw CSS/inline styles instead of using component library. Prevention: PreToolUse allowlist hooks block unauthorized patterns; machine-readable component manifest injected into agent context; PostToolUse linter hook validates every file write.
4. **Neural validation infinite loop (P4)** -- Validation/fix/re-validation cycle never converges. Prevention: circuit breaker (max 2 repair attempts); separate deterministic checks (fast, free) from probabilistic checks (expensive); severity-based `/btw` signals (only CRITICAL triggers auto-repair).
5. **Big-bang rewrite disguised as migration (P5)** -- The cosmic-themed frontend cannot incrementally morph into workbench layout. Prevention: accept the frontend is a rebuild; create clean `src/workbenches/` alongside `src/components/`; harvest reusable logic (hooks, contexts, WebSocket); feature flag `LEGACY_UI=true` with hard removal deadline.

## Implications for Roadmap

Based on combined research across all four files, the following phase structure is recommended. The ordering is driven by the dependency graph from FEATURES.md, the architectural patterns from ARCHITECTURE.md, and the phase-specific warnings from PITFALLS.md.

### Phase 0: Technical Debt (Pre-work)
**Rationale:** PITFALLS.md P14 warns that agents will copy whatever TypeScript patterns they see. The codebase has 150+ type errors. If agents start generating code against a broken type system, branded types get bypassed and `as any` proliferates. This must be fixed before any agent-generated code enters the codebase.
**Delivers:** Clean TypeScript compilation, branded type usage patterns that agents can imitate, baseline for type-check CI gate.
**Addresses features:** None directly -- this is debt cleanup that enables everything else.
**Avoids pitfalls:** P14 (TypeScript type erosion).

### Phase 1: Foundation -- Layout + Design System + Infrastructure
**Rationale:** FEATURES.md dependency graph shows that every feature (pipeline viz, chat panel, agent status, neural validation) depends on the component library and layout structure. ARCHITECTURE.md establishes that the component library is infrastructure, not decoration. PITFALLS.md P5 says the build-vs-rebuild decision must be made and committed to before any frontend work begins. P6 says WebSocket architecture must be designed before workbench features. P16 says Windows file locking must be handled in foundation.
**Delivers:** 3-panel resizable layout, Tailwind v4 integration with existing CSS tokens, component library skeleton (Button, Card, Dialog, Tabs, Tooltip, etc.), sidebar navigation for 7 default workbenches, settings panel, singleton WebSocket connection manager, `cn()` utility.
**Addresses features:** 3-panel layout, design tokens, component library, workbench switching, settings panel, command palette skeleton.
**Avoids pitfalls:** P5 (big-bang rewrite -- accept rebuild, set up clean directory structure), P6 (WebSocket proliferation -- singleton multiplexed connection), P16 (Windows file locking -- LF enforcement, read-only non-exclusive access).

### Phase 2: Agent Integration -- Sessions + Chat + Pipeline
**Rationale:** ARCHITECTURE.md shows that the SessionManager, WebSocket Hub, and PipelineStore form the core runtime. FEATURES.md lists persistent sessions as the #1 table-stakes feature. PITFALLS.md P1, P2, P9, and P17 all target this phase -- session lifecycle is the highest-risk area and must be built with resilience from day one.
**Delivers:** SessionManager service (backend), per-workbench Claude sessions with lazy activation, chat panel per workbench, pipeline visualizer with custom nodes (steps + decision gates), agent status dashboard, toast notifications, interactive tool call rendering, session history.
**Addresses features:** Persistent sessions, chat per workbench, pipeline visualization, agent status dashboard, interactive tool calls, notifications, session history, checkpoint/rollback (via Agent SDK).
**Avoids pitfalls:** P1 (token explosion -- lazy activation, only active workbench has live session), P2 (silent disconnects -- health monitor, resurrection layer), P7 (ReactFlow re-render cascade -- zustand state, batched updates, memoized handlers), P8 (JSONL fragility -- migrate to `--output-format stream-json` and `SubagentStart`/`SubagentStop` hooks), P9 (Electron process leaks -- ProcessManager class with AbortController cleanup), P13 (workbench state bleed -- key-based remounting, scoped CSS), P17 (stdout/stderr corruption -- line-by-line parsing with error recovery).

### Phase 3: Intelligence -- Neural Validation + Safety Controls
**Rationale:** FEATURES.md identifies neural validation as the single biggest competitive differentiator. ARCHITECTURE.md shows it depends on the hook system + component library being stable. PITFALLS.md P3, P4, P10, P11, and P15 all apply here -- this is the second-highest-risk area. Critically, P4 warns that validation must come AFTER the design system is stable: validating against a moving target guarantees false positives.
**Delivers:** Hook configuration (`.claude/settings.json`), validation endpoints (Express routes), PreToolUse allowlist checks, PostToolUse design system compliance linting, `/btw` violation signaling with severity levels, human-in-the-loop approval gates, flow management UI, MCP server configuration panel.
**Addresses features:** Neural validation layer, `/btw` signaling, approval gates, flow management UI, MCP integration panel, command palette enhancements.
**Avoids pitfalls:** P3 (design bypass -- PreToolUse allowlist, component manifest, PostToolUse linter), P4 (infinite loop -- circuit breaker at 2 attempts, deterministic-first validation, severity-based repair), P10 (/btw injection -- nonce/token system, rate limiting, source attribution logging), P11 (hook performance -- scoped matchers on Write/Edit/MultiEdit only, fast local PreToolUse checks, 5s HTTP timeout), P15 (AskUserQuestion schema drift -- adapter layer with fallback to plain text).

### Phase 4: Power Features -- Customization + Automation
**Rationale:** FEATURES.md shows these features build on top of all prior layers. They enhance the experience but do not define the core product. Self-healing flows require stable neural validation (Phase 3). Custom workbenches require stable workbench switching (Phase 1). Skills per workbench require stable session management (Phase 2).
**Delivers:** Self-healing flow engine (validate -> signal -> fix -> re-validate), per-workbench skills management, scheduled tasks (cron) UI, custom workbench creation, session forking UI, learning persistence browser.
**Addresses features:** Self-healing flows, per-workbench skills, scheduled tasks, custom workbenches, session forking, learning persistence UI, spec-driven development, workbench-scoped agent personality.
**Avoids pitfalls:** P4 (self-healing loop detection -- track repair success rates, downgrade low-success violations to manual review), P12 (context amnesia -- per-workbench persistent memory files written to disk after every significant action).

### Phase Ordering Rationale

- **Phase 0 before Phase 1** because agents imitate whatever TypeScript patterns exist in the codebase. Fixing type errors creates a clean baseline.
- **Phase 1 before Phase 2** because the component library is the UI vocabulary for everything. Chat panels, pipeline nodes, agent status cards -- all composed from the library. Building them without the library means building them twice.
- **Phase 2 before Phase 3** because neural validation validates agent output. Agents must be running and producing output before validation makes sense. Also, the hook endpoints need to know what the component library looks like (from Phase 1) to validate against it.
- **Phase 3 before Phase 4** because self-healing flows are the signature Phase 4 feature, and they require the validation infrastructure (hooks, `/btw`, circuit breaker) from Phase 3. Building self-healing without validation is building a body without a nervous system.
- **Each phase delivers testable, demonstrable value.** Phase 1: users see the new layout. Phase 2: users interact with agents. Phase 3: agents produce consistent UI. Phase 4: the system maintains itself.

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 2 (Agent Integration):** The Agent SDK `streamInput()` for multi-turn conversations needs hands-on testing. Session persistence across Electron restarts on Windows is undocumented territory. The `resume` option's behavior after machine reboots needs validation -- PITFALLS.md P2 documents that reboots produce new session IDs. The exact WebSocket message format from Agent SDK streaming needs profiling for the frontend adapter.
- **Phase 3 (Neural Validation):** Hook latency impact on agent workflow needs benchmarking. The cost tradeoff between `command` hooks (fast, structural) vs `prompt` hooks (expensive, semantic) needs real-world measurement. The `/btw` injection path -- how a hook result becomes a message in an active Agent SDK session -- is not documented in official sources and needs investigation.

**Phases with standard patterns (skip deeper research):**
- **Phase 0 (Tech Debt):** Standard TypeScript cleanup. Well-understood patterns.
- **Phase 1 (Foundation):** Tailwind v4, Radix UI, CVA, react-resizable-panels -- all have extensive documentation and established patterns. The shadcn/ui community provides battle-tested component implementations to reference. Only the Tailwind v4 `@theme` integration with existing CSS vars might need minor experimentation.
- **Phase 4 (Power Features):** Builds on proven Phase 2-3 infrastructure. Self-healing loop detection is the main novel element and can be prototyped with simple counters and timeout logic.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages verified via `npm view` on 2026-04-01. Official docs consulted for API details. Agent SDK, ReactFlow v12, Tailwind v4 all have comprehensive documentation. |
| Features | HIGH | Surveyed 15+ competing products. Table stakes validated by RedMonk 2025 and Stack Overflow 2025 surveys. Competitive matrix confirms ActionFlows' unique differentiators. |
| Architecture | HIGH | Local-first session-per-workbench pattern is well-established in Claude Code ecosystem. Component boundaries are clean and well-documented. |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls (P1-P5) are well-sourced with documented issues and real-world reports. Moderate pitfalls (P6-P11) are based on established patterns plus inference from docs. Some Windows-specific issues (P16) and Agent SDK edge cases (P17) need validation during implementation. |

**Overall confidence:** HIGH

### Gaps to Address

- **Agent SDK V2 interface stability:** The `unstable_v2_createSession` / `unstable_v2_resumeSession` methods are in preview. API may change before implementation. Monitor the Agent SDK changelog during Phase 2.
- **AskUserQuestion tool call schema:** Rendering as interactive UI requires understanding the exact JSON payload structure. No public schema documentation found. Need to capture real payloads during Phase 2 development and build an adapter layer with graceful fallback.
- **Tailwind CSS v4 + Electron build pipeline:** Tailwind v4's Vite plugin has not been explicitly verified with electron-builder. Electron uses Chromium so CSS features should work, but the build chain (Vite plugin -> electron-builder -> asar packaging) needs end-to-end testing in Phase 1.
- **Storybook 10 + Tailwind v4:** Need to verify the Storybook Vite builder correctly processes `@tailwindcss/vite`. May need framework-specific configuration. Lower priority -- Storybook is a development tool, not a shipping feature.
- **`/btw` injection path:** The exact mechanism for delivering a hook validation result as a `/btw` message into an active Agent SDK session is not documented. The hook can return `additionalContext` which Claude Code feeds back to the agent, but whether this integrates with the `/btw` command specifically needs investigation. May need to use the `additionalContext` field directly rather than the `/btw` command.
- **Competitive landscape velocity:** Cursor Background Agents, Codex Automations, and Antigravity Skills all launched in Q1 2026. The feature gap that makes ActionFlows unique (design system enforcement + neural validation) could narrow if competitors adopt similar approaches. Monitor quarterly.

## Sources

### Primary (HIGH confidence)
- [Agent SDK TypeScript Reference](https://platform.claude.com/docs/en/agent-sdk/typescript) -- session management, query options, streaming, AgentDefinition
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) -- hook events, handler types, matchers, output schema
- [Agent SDK Migration Guide](https://platform.claude.com/docs/en/agent-sdk/migration-guide) -- package rename from claude-code to claude-agent-sdk
- [ReactFlow v12 Migration Guide](https://reactflow.dev/learn/troubleshooting/migrate-to-v12) -- v11 to v12 migration, package rename
- [Tailwind CSS v4 Release + Theme Docs](https://tailwindcss.com/blog/tailwindcss-v4) -- CSS-first config, `@theme` directive, Vite plugin
- [CVA Documentation](https://cva.style/docs) -- variant API, compound variants
- [RedMonk: 10 Things Developers Want from Agentic IDEs](https://redmonk.com/kholterhoff/2025/12/22/10-things-developers-want-from-their-agentic-ides-in-2025/) -- feature expectations
- [Stack Overflow 2025 Developer Survey: AI](https://survey.stackoverflow.co/2025/ai) -- trust levels, adoption patterns
- All product-specific sources (Cursor, Antigravity, Kiro, Warp, Codex, VS Code Copilot) -- official blogs and docs

### Secondary (MEDIUM confidence)
- [DataCamp: Best Agentic IDEs 2026](https://www.datacamp.com/blog/best-agentic-ide) -- competitive landscape overview
- [Multi-Agent Dashboard Dev Guide 2026](https://letsblogitup.dev/articles/building-multi-agent-dashboards-for-2026-a-develop/) -- architecture patterns
- [Design Systems + AI: MCP as Unlock (Figma Blog)](https://www.figma.com/blog/design-systems-ai-mcp/) -- design token AI accessibility
- [ReactFlow Performance Guide](https://reactflow.dev/learn/advanced-use/performance) -- memoization, viewport rendering
- [WebSocket Best Practices](https://websocket.org/guides/best-practices/) -- connection management patterns

### Tertiary (LOW confidence -- needs validation)
- Agent SDK `streamInput()` multi-turn behavior -- documented but untested in multi-session desktop context
- Session persistence across Windows reboots -- inferred from GitHub issues, not officially documented
- Hook-to-`/btw` integration path -- architectural inference, no documented implementation

---
*Research completed: 2026-04-01*
*Ready for roadmap: yes*
