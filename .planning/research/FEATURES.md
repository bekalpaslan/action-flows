# Feature Landscape

**Domain:** Agentic personal OS / AI-native IDE / agent orchestration dashboard
**Researched:** 2026-04-01
**Research mode:** Ecosystem survey
**Overall confidence:** HIGH (corroborated across 15+ products and multiple analyst sources)

## Ecosystem Context

The agentic IDE / personal OS space has exploded in 2025-2026. The competitive landscape now includes:

- **IDE-native agents:** Cursor (2M+ users, $2B ARR), Windsurf (acquired by Cognition for $250M), VS Code Copilot (4.7M paid users), Google Antigravity, AWS Kiro
- **Terminal-first agents:** Claude Code, Warp 2.0, OpenAI Codex CLI
- **Cloud agent platforms:** Cursor Background Agents, OpenAI Codex App, Devin
- **Orchestration dashboards:** CrewAI AMP, LangSmith Studio, Flowise, Langflow

ActionFlows Dashboard sits at a unique intersection: it is an **orchestration-first** dashboard (not an editor fork) with **persistent per-workbench agent sessions**, a **pipeline visualizer**, and a **neural validation layer**. The closest analogues are Warp 2.0's agent management panel, Google Antigravity's multi-agent manager, and CrewAI's Agent Management Platform -- but none combine workbench-scoped sessions, design system enforcement, and self-healing flows in one product.

---

## Table Stakes

Features users expect. Missing any of these makes the product feel broken or incomplete compared to the 2026 baseline.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Persistent agent sessions** | Every competitor (Cursor, Windsurf, Claude Code, Antigravity) persists conversation context. Agents that forget between sessions are the #1 developer frustration (RedMonk 2025 survey). | High | Claude Code remote sessions with `--resume`. Backend maps workbench ID to session ID. Must survive app restarts and machine reboots. |
| **3-panel resizable layout** | Standard IDE pattern (sidebar + workspace + panel). Cursor, VS Code, Windsurf, Warp all use this. Users have deep muscle memory. | Medium | `react-resizable-panels` v4. Min/max constraints, collapse support, keyboard resize for a11y. |
| **Real-time pipeline visualization** | Agents working invisibly creates anxiety. Every orchestration platform (CrewAI, LangSmith, Warp) provides execution visibility. Warp calls it the "control tower." | Medium | `@xyflow/react` v12 with custom nodes. Data-driven from chain execution events via WebSocket. Two node shapes: rounded rectangles (steps) and diamonds (decision gates). |
| **Multi-agent status dashboard** | Warp's Agent Management Panel, Cursor's Background Agent list, and Antigravity's Agent Manager all show which agents are running, their progress, and allow pause/resume. RedMonk lists this as a top-5 developer want. | Medium | `SubagentStart`/`SubagentStop` hooks feed into a status registry. Show agent name, workbench, status (idle/running/blocked/complete), elapsed time. |
| **Chat panel per workbench** | Per-context chat is table stakes (Antigravity, Windsurf, VS Code Copilot all scope chat to context). A single global chat would feel like a downgrade. | Medium | Each workbench renders its own chat panel backed by its own Claude session. Expandable session history per workbench. |
| **Interactive tool call rendering** | Cursor renders tool calls as interactive UI elements. Claude's `AskUserQuestion` should render as radio buttons, option cards, checkboxes -- not plain text. | High | Parse tool call JSON from Agent SDK stream, render as component library elements. Capture selection, feed back as tool response. |
| **Command palette / keyboard navigation** | Power users expect keyboard-driven workflow. Every IDE (Cursor, VS Code, Windsurf) has Cmd+K / Cmd+P / Cmd+Shift+P. | Medium | `cmdk` v1 for command palette. Radix provides keyboard support in all primitives. |
| **Checkpoint / rollback system** | RedMonk's #9 most-wanted feature. When agents modify many files autonomously, users need instant revert capability. Cursor, Claude Code (`/rewind`), and VS Code all provide this. | Medium | Leverage Claude Code's built-in checkpoint system. UI shows checkpoint timeline. Developers have converged: "rolling back saves tokens vs. trying to fix broken state." |
| **Human-in-the-loop approval gates** | RedMonk's #8 most-wanted. Users want configurable approval before destructive operations. Risk-based escalation: low-risk auto-approves, high-risk requires human OK. | Medium | Map to Claude Code's permission system. Per-workbench autonomy levels. Critical: approval gates must not block entire pipeline -- only the specific action. |
| **MCP server integration** | RedMonk's #4 most-wanted. Users assume seamless integration with external tools (Slack, GitHub, databases) via MCP. Every major IDE (VS Code, Cursor, Kiro, Warp, Antigravity) supports MCP. | Low | Claude Code natively supports MCP. UI shows connected MCP servers per workbench. Configuration panel in Settings workbench. |
| **Session history & search** | Users need to find past conversations and decisions. Windsurf's Memories, Antigravity's Knowledge Artifacts, and every chat-based tool provides history. | Low | Agent SDK `listSessions()` + `getSessionMessages()`. Searchable history UI in each workbench's chat panel. |
| **Design token system** | Visual consistency is the core value proposition ("Agents build with the same components humans see"). Every serious design system (Material, Radix, Shadcn) uses tokens. | Medium | Design tokens enforced across all workbenches. Component library is the only way agents build UI. Tokens cover color, spacing, typography, elevation, animation. |
| **Toast / notification system** | Session connect/disconnect, agent completion, errors, validation results. Basic UX hygiene. | Low | `sonner` v2. Wire to WebSocket events. Categorize: info, success, warning, error. |
| **Settings panel** | Configuration, preferences, system health. Every product has one. | Low | Standard CRUD UI. Workbench-specific settings + global settings. |
| **Workbench switching** | Navigate between the 7 default workbenches via sidebar. | Low | Sidebar navigation with state management for active workbench. |

---

## Differentiators

Features that set ActionFlows apart. Not expected by the market, but create competitive advantage. These are where the "agentic personal OS" identity lives.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Neural validation layer** | NO competitor has automated, agent-driven design system enforcement at the infrastructure level. Cursor, Windsurf, and Copilot produce whatever CSS/HTML the model generates. ActionFlows validates agent output against design system rules before rendering. This is the single biggest differentiator. | High | Claude Code hooks (`PreToolUse`/`PostToolUse`) validate agent file edits against component library rules. Prompt-based hooks evaluate compliance automatically. |
| **`/btw` violation signaling** | Non-blocking violation feedback to agents. Agent decides fix priority (critical = fix now, non-critical = note for future heal pass). No competitor has this feedback loop where the system tells the agent it made a mistake in-band. | Medium | Hook detects violation, sends `/btw` to active session. Agent incorporates feedback without breaking current task. Healing outcome writes to learnings (prevents recurrence). |
| **Self-healing flows** | Validation failure triggers automated fix, which triggers re-validation, creating a closed-loop quality system. Snyk Agent Fix does this for security vulnerabilities, but no IDE does it for design system compliance. | High | Hook chain: PostToolUse detects violation -> `/btw` to agent -> agent fixes -> PostToolUse re-validates. Needs loop detection to prevent infinite fix cycles. |
| **Spec-driven development** | Kiro pioneered specs as first-class citizens. ActionFlows can go further: flows are pre-defined specs that agents execute. The flow registry IS the spec system, and it is versionable, composable, and self-documenting. | Medium | Existing actionflows framework already has actions (atomic specs) and flows (composed specs). Surface these in UI as executable blueprints, not just instructions. |
| **Flow management as first-class UI** | No agentic IDE surfaces reusable workflows as a browseable, composable library. Cursor has no concept of "flows." Claude Code has skills but no visual management. ActionFlows can make flows discoverable, composable, and executable from the dashboard. | Medium | Flow browser already exists in codebase (`FlowBrowser` component). Enhance: per-workbench flow listing, flow composition UI, flow execution from dashboard, archived flow harvesting. |
| **Workbench-scoped agent personality** | Each workbench has its own agent context, rules, and behavioral constraints. The Review workbench agent is strict; the Explore agent is curious; the PM agent thinks in milestones. No competitor scopes agent behavior to workspace context. | Medium | Steering files per workbench. Each session gets its own CLAUDE.md-equivalent with workbench-specific rules, personality, and tool permissions. |
| **Custom workbench creation** | Users define their own workbenches beyond the 7 defaults. Antigravity's Skills and Claude's Skills are per-command; ActionFlows' workbenches are per-domain, persistent environments. | Medium | Dynamic workbench registry. Each new workbench gets its own session, pipeline view, chat panel, and flow registry. |
| **Studio workbench (live preview)** | Agents materialize UI components in real-time, visible as they build. No competitor shows a live render of what the agent is constructing. Warp shows code; ActionFlows shows the result. | High | Hot reload preview using Vite HMR. Agent writes component, live preview renders it in the Studio workbench. Storybook integration for component isolation. |
| **Skills per workbench** | Claude Code has global skills. ActionFlows scopes skills to workbenches -- Review skills vs. PM skills vs. Work skills. Context-appropriate tooling. | Medium | Claude Code skills system as foundation. Namespace skills to workbench. UI for skill management in each workbench. |
| **Scheduled tasks (cron)** | Recurring automation: health checks, nightly reviews, morning briefings, deploy monitors. Codex is building "Automations" for this. Claude Code already supports cron natively. | Low | Claude Code cron capability. UI shows scheduled tasks per workbench with status, next run time, and history. |
| **Agent teams (cross-workbench)** | Parallel agents across workbenches for coordinated tasks. Cursor Background Agents and Antigravity's Agent Manager do parallel agents, but neither ties them to domain-specific workbenches with shared context. | High | Multiple concurrent Agent SDK sessions with shared context. Coordination protocol needed. Warp does this with their multi-threading panel. |
| **Session forking** | Branch a conversation to explore alternatives without losing the original. Git-like branching for agent conversations. | Low | Agent SDK `forkSession: true` option. UI shows fork point in session history tree. |
| **Learning persistence** | Antigravity stores learned preferences in `.gemini/antigravity/brain/`. ActionFlows has `LEARNINGS.md` already. Surface learning in UI and make it searchable across workbenches. | Medium | Existing LEARNINGS.md system. Add UI: learning browser, search, per-workbench filtering. Make learnings feed back into agent context for future sessions. |

---

## Anti-Features

Features to explicitly NOT build. Either harmful, redundant, over-complex, or counter to the product's philosophy.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Raw CSS editor for agents** | Breaks design system enforcement. Any escape hatch undermines the component library constraint. This is the core value proposition -- consistency is enforced infrastructure, not a guideline. | Agents use component library + design tokens exclusively. Validation hooks reject raw CSS. |
| **Custom AI model switching UI** | Fractures the experience. Cursor's multi-model pricing confusion alienated users. Claude Code handles model selection internally. Adding model switchers invites comparison shopping in the UI instead of getting work done. | Use Claude Code's built-in model management. The agent is Claude; the model is an implementation detail. |
| **Web-hosted SaaS deployment** | Agent SDK requires Claude Code CLI on the local machine. Sessions persist to local disk. Hosting remotely breaks the architecture. Codex cloud works because OpenAI controls the backend; ActionFlows doesn't. | Electron desktop app is the primary distribution. Web mode is for UI development only. |
| **Real-time collaborative editing** | Multi-user editing of the same workbench adds massive complexity (CRDT, OT, conflict resolution). The product is a personal OS, not Google Docs. | Single-user per installation. Multiple workbenches provide parallelism within one user's workflow. |
| **Plugin/extension marketplace** | Premature ecosystem play. Cursor and VS Code have plugin ecosystems because they have millions of users. Building marketplace infrastructure before PMF is wasted effort. | MCP server configuration per workbench covers extensibility needs. Skills provide user-customization. Marketplace can come later if traction warrants it. |
| **Chat window visual redesign (this phase)** | Explicitly deferred in PROJECT.md to future phase (Figma forthcoming). Designing chat UI without final designs will create throwaway work. | Use component library defaults for chat rendering. Redesign when Figma designs are ready. |
| **VS Code fork / editor integration** | Being "yet another VS Code fork" puts ActionFlows in direct competition with Cursor (2M users, $2B ARR) and Windsurf. The product's identity is the orchestration layer, not the editor. | Integrate with Claude Code CLI which already works in any editor. ActionFlows is the orchestration dashboard, not the editor. |
| **Autonomous agent with no human oversight** | Fully autonomous agents scare developers (Stack Overflow 2025 survey: 84% use AI but most don't trust it). Skipping human-in-the-loop creates liability and erodes trust. | Configurable autonomy levels per workbench and per task type. Default to human-in-the-loop with opt-in to higher autonomy as trust builds. |
| **Agent-generated arbitrary UI outside component library** | If agents can generate arbitrary React components, design consistency is impossible to enforce at scale. | Agents compose from the component library only. New components go through the Studio workbench and design validation before entering the library. |

---

## Feature Dependencies

```
FOUNDATION LAYER (must come first):
  Design Tokens + Component Library
    -> Pipeline Visualizer (nodes use components)
    -> Chat Panel (messages use components)
    -> All Workbench Pages (compose from library)
    -> Interactive Tool Call Rendering (renders as components)
    -> Neural Validation Layer (validates against component library)

  3-Panel Resizable Layout
    -> Workbench Switching (sidebar contains navigation)
    -> Chat Panel (right panel hosts chat)
    -> Pipeline Visualizer (top of workspace area)

AGENT LAYER (requires foundation):
  Claude Code Session Integration
    -> Chat Panel (chat backed by session)
    -> Pipeline Visualizer (session events drive nodes)
    -> Agent Status Dashboard (SubagentStart/Stop)
    -> Session History (per-workbench history)
    -> Checkpoint/Rollback (session checkpoints)
    -> Session Forking (branch conversations)

  Claude Code Hooks Integration
    -> Neural Validation (hooks trigger validation)
    -> Pipeline Visualizer (SubagentStart/Stop hooks)
    -> /btw Violation Signaling (hooks detect violations)

ORCHESTRATION LAYER (requires agent layer):
  Neural Validation -> Self-Healing Flows (validation triggers fix)
  Neural Validation -> /btw Signaling (violations feed back to agent)
  Workbench Switching -> Custom Workbench Creation (extends registry)
  Agent Status Dashboard -> Agent Teams (multi-agent coordination)
  Claude Code Sessions -> Agent Teams (multiple concurrent sessions)
  Flow Management -> Spec-Driven Development (flows ARE specs)
  Skills System -> Per-Workbench Skills (namespace to workbench)
  Scheduled Tasks -> Cron UI (per-workbench task management)

EXPERIENCE LAYER (enhances everything):
  Learning Persistence -> Self-Healing Flows (learnings prevent recurrence)
  Learning Persistence -> Agent Personality (learnings refine behavior)
  Studio Workbench -> Component Library (new components enter via Studio)
  Permission System -> All Agent Actions (gates control autonomy)
```

---

## MVP Recommendation

**Phase 1: Foundation** -- Get the layout and component library right.
1. **Design token system + component library** -- Everything depends on this. Agents need components before they can build anything.
2. **3-panel resizable layout** -- Shell that everything lives in.
3. **Workbench switching** -- Basic navigation between 7 defaults.
4. **Settings panel** -- Configuration baseline.

**Phase 2: Agent Integration** -- Make agents real.
1. **Persistent agent sessions per workbench** -- The core value proposition.
2. **Chat panel per workbench** -- User interacts with agents here.
3. **Pipeline visualizer** -- Shows what agents are doing.
4. **Agent status dashboard** -- Which agents are running, their state.
5. **Interactive tool call rendering** -- AskUserQuestion as rich UI.
6. **Toast/notification system** -- Agent events surface to user.

**Phase 3: Intelligence** -- The differentiators.
1. **Neural validation layer** -- Design system enforcement via hooks.
2. **`/btw` violation signaling** -- Feedback loop to agents.
3. **Checkpoint/rollback** -- Safety net for agent actions.
4. **Human-in-the-loop approval gates** -- Trust controls.
5. **Flow management UI** -- Surface existing flows as executable blueprints.

**Phase 4: Power Features** -- The "personal OS" experience.
1. **Self-healing flows** -- Closed-loop quality.
2. **Skills per workbench** -- User-created reusable commands.
3. **Scheduled tasks UI** -- Cron management.
4. **Custom workbench creation** -- User-defined domains.
5. **Session forking** -- Conversation branching.
6. **Learning persistence UI** -- Searchable system memory.

**Defer indefinitely:**
- **Agent teams**: Requires multi-session coordination protocol. Build single-session experience first. Revisit when single-agent workflows are proven.
- **Studio workbench**: Complex live preview infrastructure. Ship other workbenches first. Needs Vite HMR integration and component isolation story.
- **Chat window redesign**: Explicitly deferred per PROJECT.md. Wait for Figma designs.

---

## Competitive Feature Matrix

| Feature | ActionFlows | Cursor | Windsurf | Claude Code | Antigravity | Warp 2.0 | Kiro |
|---------|:-----------:|:------:|:--------:|:-----------:|:-----------:|:--------:|:----:|
| Persistent sessions | Planned | Yes | Yes | Yes | Yes | Yes | Yes |
| Pipeline visualization | Planned | No | No | No | No | Partial | No |
| Multi-agent dashboard | Planned | Partial | No | No | Yes | Yes | No |
| Design system enforcement | Planned | No | No | No | No | No | No |
| Self-healing validation | Planned | No | No | No | No | No | No |
| Per-workbench agent scoping | Planned | No | No | No | No | No | No |
| Flow/spec management UI | Planned | No | No | No | No | No | Yes |
| Background agents | Defer | Yes | Yes | Yes | Yes | Yes | Yes |
| Skills/reusable workflows | Planned | No | Partial | Yes | Yes | No | Partial |
| Checkpoint/rollback | Planned | Yes | Partial | Yes | Partial | Partial | No |
| MCP integration | Planned | Yes | Yes | Yes | Yes | Yes | Yes |
| Custom workspaces | Planned | No | No | No | Partial | No | No |

**ActionFlows' unique position:** The only product combining pipeline visualization + design system enforcement + self-healing validation + workbench-scoped agents in one dashboard. Competitors are either editors (Cursor, Windsurf, Kiro) or terminals (Claude Code, Warp) -- ActionFlows is an orchestration layer that sits above both.

---

## Sources

### Primary Research (analyst reports & surveys)
- [RedMonk: 10 Things Developers Want from Agentic IDEs (2025)](https://redmonk.com/kholterhoff/2025/12/22/10-things-developers-want-from-their-agentic-ides-in-2025/) -- HIGH confidence
- [Stack Overflow 2025 Developer Survey: AI section](https://survey.stackoverflow.co/2025/ai) -- HIGH confidence
- [DataCamp: The 13 Best Agentic IDEs in 2026](https://www.datacamp.com/blog/best-agentic-ide) -- MEDIUM confidence

### Product-specific (official sources)
- [Cursor: Background Agents](https://cursor.com/blog/scaling-agents) -- HIGH confidence
- [Google Antigravity: Official intro](https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/) -- HIGH confidence
- [AWS Kiro: Specs and Hooks docs](https://kiro.dev/docs/hooks/) -- HIGH confidence
- [Warp 2.0: Agentic Development Environment](https://www.warp.dev/blog/reimagining-coding-agentic-development-environment) -- HIGH confidence
- [OpenAI Codex: Introducing the Codex App](https://openai.com/index/introducing-the-codex-app/) -- HIGH confidence
- [VS Code Copilot: Agent Mode](https://code.visualstudio.com/docs/copilot/agents/overview) -- HIGH confidence
- [Claude Code: Subagents](https://code.claude.com/docs/en/sub-agents) -- HIGH confidence
- [Anthropic: Enabling Claude Code to work more autonomously](https://www.anthropic.com/news/enabling-claude-code-to-work-more-autonomously) -- HIGH confidence

### Architecture & patterns
- [Multi-Agent Dashboard Dev Guide (2026)](https://letsblogitup.dev/articles/building-multi-agent-dashboards-for-2026-a-develop/) -- MEDIUM confidence
- [Windsurf Context Management Guide](https://datalakehousehub.com/blog/2026-03-context-management-windsurf/) -- MEDIUM confidence
- [AI-Driven Design System Governance](https://www.stldigital.tech/blog/ai-as-a-design-system-governor-enforcing-architectural-consistency/) -- MEDIUM confidence
- [Persistent Memory for AI Coding Agents (Medium)](https://medium.com/@sourabh.node/persistent-memory-for-ai-coding-agents-an-engineering-blueprint-for-cross-session-continuity-999136960877) -- LOW confidence

### Market context
- [Deloitte: AI Agent Orchestration](https://www.deloitte.com/us/en/insights/industry/technology/technology-media-and-telecom-predictions/2026/ai-agent-orchestration.html) -- HIGH confidence
- [StackOne: 120+ Agentic AI Tools (2026)](https://www.stackone.com/blog/ai-agent-tools-landscape-2026/) -- MEDIUM confidence
- [Fluid.ai: Agentic OS](https://www.fluid.ai/blog/agentic-operating-system) -- MEDIUM confidence

---
*Feature landscape for: Agentic personal OS dashboard*
*Researched: 2026-04-01*
