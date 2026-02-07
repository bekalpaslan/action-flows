# Implementation Plan: Session Window System (Full UI/UX Redesign)

## Overview

This plan details the implementation of a comprehensive Session Window system that transforms the ActionFlows Dashboard into a modern, cinematic real-time monitoring interface. The system features a collapsible sidebar for session management, a responsive tiled grid for session windows, agent-centric ReactFlow swimlane visualizations with full animations, context-aware quick-action bars, and dual-mode CLI integration. The implementation is structured into 3 phases to manage complexity and ensure incremental progress.

**Key Architecture Principles:**
- Shared types define the contract for session window states, flow node metadata, and animation triggers
- Backend API provides session aggregation and enrichment endpoints
- Frontend components leverage existing WebSocket infrastructure for real-time updates
- Dual-layer data sourcing: ActionFlows events (primary) + Stream-JSON parsing (fallback)
- Progressive enhancement: basic functionality first, then animations and advanced features

---

## Phase 1: Foundation (Types + Backend + Layout)

### Step 1.1: Define Session Window Shared Types
**Package:** packages/shared/
**Files to create:**
- `packages/shared/src/sessionWindows.ts`

**Changes:**
1. Create new file `sessionWindows.ts` with interfaces:
   - `SessionWindowState` - tracks expanded/collapsed state, full-screen mode, followed status
   - `SessionWindowConfig` - user preferences (layout, animation settings, quick actions)
   - `FlowNodeMetadata` - extended metadata for ReactFlow nodes (animation state, swimlane position, parallel group)
   - `FlowEdgeMetadata` - extended metadata for ReactFlow edges (data labels, animation progress, active state)
   - `QuickActionDefinition` - configurable quick-action button definitions
   - `SessionLifecycleState` - enum: Created, Active, Paused, WaitingForInput, Ended
   - `SessionWindowLayout` - layout information for grid positioning

2. Export all new types from `packages/shared/src/index.ts`

**Depends on:** Nothing

**Why:** Type definitions establish the contract between backend and frontend, enabling parallel development of subsequent steps.

---

### Step 1.2: Extend Backend Session API
**Package:** packages/backend/
**Files to modify:**
- `packages/backend/src/routes/sessions.ts`

**Files to create:**
- `packages/backend/src/routes/sessionWindows.ts`

**Changes:**
1. Create new route file `sessionWindows.ts`:
   - `GET /api/session-windows` - returns aggregated session data for all followed sessions (includes session + currentChain + enriched metadata)
   - `GET /api/session-windows/:id` - returns enriched session window data for a specific session
   - `POST /api/session-windows/:id/follow` - marks session as followed
   - `DELETE /api/session-windows/:id/follow` - unmarks session as followed
   - `PUT /api/session-windows/:id/config` - updates user config for session window (layout preferences, quick actions)

2. Modify `sessions.ts`:
   - Add enrichment logic to include flow visualization metadata (parallel groups, swimlane assignments)
   - Add endpoint `GET /api/sessions/:id/flow-graph` - returns ReactFlow-compatible node/edge data structure

3. Mount new routes in `packages/backend/src/index.ts`

**Depends on:** Step 1.1 (shared types)

**Why:** Backend API provides enriched session data and user preferences persistence, reducing frontend complexity.

---

### Step 1.3: Create Session Window Storage Layer
**Package:** packages/backend/
**Files to modify:**
- `packages/backend/src/storage/memory.ts`
- `packages/backend/src/storage/redis.ts`
- `packages/backend/src/storage/index.ts`

**Changes:**
1. Extend `MemoryStorage` class:
   - Add `followedSessions: Set<SessionId>`
   - Add `sessionWindowConfigs: Map<SessionId, SessionWindowConfig>`
   - Add methods: `followSession()`, `unfollowSession()`, `getFollowedSessions()`, `setSessionWindowConfig()`, `getSessionWindowConfig()`

2. Extend `RedisStorage` class with same methods (Redis keys: `followed:{sessionId}`, `sw-config:{sessionId}`)

3. Update storage interface in `index.ts` to include new methods

**Depends on:** Step 1.1 (shared types), Step 1.2 (API design)

**Why:** Storage layer provides persistence for followed sessions and user preferences.

---

### Step 1.4: Create Collapsible Sidebar Component
**Package:** packages/app/
**Files to create:**
- `packages/app/src/components/SessionWindowSidebar/SessionWindowSidebar.tsx`
- `packages/app/src/components/SessionWindowSidebar/SessionWindowSidebar.css`
- `packages/app/src/components/SessionWindowSidebar/SessionItem.tsx`
- `packages/app/src/components/SessionWindowSidebar/UserGroup.tsx`

**Changes:**
1. Create `SessionWindowSidebar.tsx` - main sidebar component:
   - Collapsible left sidebar (~280px when expanded, ~50px when collapsed)
   - Collapse toggle button
   - User groups (expandable/collapsible)
   - Session list per user
   - "Follow" toggle button per session
   - Status indicators (active/paused/waiting/ended)
   - CLI indicator badge

2. Create `SessionItem.tsx` - individual session list item:
   - Session name (truncated)
   - Status badge
   - CLI indicator
   - Follow button
   - Double-click to add to grid

3. Create `UserGroup.tsx` - collapsible user group:
   - User avatar + name
   - Expand/collapse toggle
   - Session count badge

**Depends on:** Step 1.1 (shared types)

**Why:** Sidebar provides the primary navigation and session discovery interface.

---

### Step 1.5: Create Session Window Grid Layout
**Package:** packages/app/
**Files to create:**
- `packages/app/src/components/SessionWindowGrid/SessionWindowGrid.tsx`
- `packages/app/src/components/SessionWindowGrid/SessionWindowGrid.css`
- `packages/app/src/components/SessionWindowGrid/SessionWindowTile.tsx`

**Changes:**
1. Create `SessionWindowGrid.tsx` - responsive grid container:
   - CSS Grid layout with responsive columns
   - 1 session = full width, 2 = side-by-side, 3-4 = 2x2, 5+ = scrollable grid
   - Empty state when no sessions followed
   - Grid item positioning logic

2. Create `SessionWindowTile.tsx` - individual session tile:
   - Header bar (session name, status badge, CLI indicator, expand/collapse buttons)
   - Collapsed state: card with summary info
   - Expanded state: split layout (flow viz 4/5 + CLI terminal 1/5)
   - Full-screen mode toggle (double-click or button)
   - Remove from grid button

**Depends on:** Step 1.1 (shared types), Step 1.4 (sidebar for followed sessions)

**Why:** Grid layout provides the main workspace for monitoring multiple sessions simultaneously.

---

### Step 1.6: Create Session Window Hook
**Package:** packages/app/
**Files to create:**
- `packages/app/src/hooks/useSessionWindows.ts`

**Changes:**
1. Create `useSessionWindows.ts` hook:
   - Fetch followed sessions from `/api/session-windows`
   - Subscribe to WebSocket events for followed sessions
   - Provide methods: `followSession()`, `unfollowSession()`, `updateConfig()`
   - Manage local state for grid layout and tile states
   - Handle full-screen mode toggling

**Depends on:** Step 1.1 (shared types), Step 1.2 (backend API)

**Why:** Centralized hook simplifies state management and provides a clean API for components.

---

### Step 1.7: Update AppContent to Use Session Window Layout
**Package:** packages/app/
**Files to modify:**
- `packages/app/src/components/AppContent.tsx`

**Changes:**
1. Replace current `UserSidebar` + `SplitPaneLayout` with:
   - `SessionWindowSidebar` (left sidebar)
   - `SessionWindowGrid` (main area)

2. Wire up `useSessionWindows` hook

3. Keep existing file explorer, code editor, and terminal components (integrate later)

**Depends on:** Step 1.4 (sidebar), Step 1.5 (grid), Step 1.6 (hook)

**Why:** Integrates the new layout into the main app, providing the foundation for Phase 2.

---

## Phase 2: Flow Visualization + Animations

### Step 2.1: Create Swimlane Layout Algorithm
**Package:** packages/app/
**Files to create:**
- `packages/app/src/utils/swimlaneLayout.ts`

**Changes:**
1. Create layout utility with functions:
   - `assignSwimlanes(chain: Chain): Map<StepNumber, number>` - assigns each step to a swimlane based on action type
   - `groupStepsByChain(chain: Chain): ChainGroup[]` - groups steps into logical chains/swimlanes
   - `calculateNodePositions(steps: ChainStep[], swimlanes: Map<StepNumber, number>): NodePosition[]` - calculates x,y coordinates for ReactFlow nodes
   - `calculateSwimlaneEdges(steps: ChainStep[]): EdgeDefinition[]` - generates edge definitions with data flow labels

2. Swimlane grouping strategy:
   - One swimlane per action type (plan/, code/, review/, test/, etc.)
   - Steps flow left-to-right within swimlane
   - Parallel steps stacked vertically in same x-position
   - Edges drawn between swimlanes for dependencies

**Depends on:** Step 1.1 (shared types)

**Why:** Swimlane layout provides an intuitive, agent-centric visualization of complex execution flows.

---

### Step 2.2: Create Animated Flow Node Component
**Package:** packages/app/
**Files to create:**
- `packages/app/src/components/FlowVisualization/AnimatedStepNode.tsx`
- `packages/app/src/components/FlowVisualization/AnimatedStepNode.css`

**Changes:**
1. Create `AnimatedStepNode.tsx` - custom ReactFlow node:
   - Compact card design (action name + status icon)
   - Animation states:
     - **Pending:** Gray, slide-in from right animation on mount
     - **Running:** Blue with spinner, subtle pulse animation
     - **Completed:** Green checkmark, shrink animation
     - **Failed:** Red X, shake animation
   - Click handler to open step inspector
   - Tooltip showing step description

2. CSS animations:
   - `@keyframes slideIn` - slide from right
   - `@keyframes pulse` - subtle scale pulse
   - `@keyframes shrink` - scale down slightly
   - `@keyframes shake` - horizontal shake

**Depends on:** Step 1.1 (shared types)

**Why:** Animated nodes provide cinematic visual feedback and make flow state changes immediately apparent.

---

### Step 2.3: Create Animated Flow Edge Component
**Package:** packages/app/
**Files to create:**
- `packages/app/src/components/FlowVisualization/AnimatedFlowEdge.tsx`
- `packages/app/src/components/FlowVisualization/AnimatedFlowEdge.css`

**Changes:**
1. Create `AnimatedFlowEdge.tsx` - custom ReactFlow edge:
   - Data flow labels (e.g., "plan.md", "code changes")
   - Animation effects:
     - **Active execution:** Traveling dots/particles along edge
     - **Completed edge:** Solid line with color based on status
     - **Inactive edge:** Dashed gray line
   - Edge highlights when corresponding step is running

2. CSS animations:
   - `@keyframes travelDots` - animated dots traveling along edge path
   - Edge color transitions based on state

**Depends on:** Step 1.1 (shared types)

**Why:** Animated edges visualize data flow and execution progress between steps.

---

### Step 2.4: Create Flow Visualization Container
**Package:** packages/app/
**Files to create:**
- `packages/app/src/components/FlowVisualization/FlowVisualization.tsx`
- `packages/app/src/components/FlowVisualization/FlowVisualization.css`
- `packages/app/src/components/FlowVisualization/SwimlaneBackground.tsx`

**Changes:**
1. Create `FlowVisualization.tsx` - ReactFlow container:
   - Use custom node type (`AnimatedStepNode`)
   - Use custom edge type (`AnimatedFlowEdge`)
   - Integrate `swimlaneLayout` utility
   - Handle node click events (open step inspector)
   - Auto-fit view on chain changes
   - Controls, MiniMap, Background

2. Create `SwimlaneBackground.tsx` - custom background:
   - Horizontal swimlane dividers with labels
   - Swimlane labels (action names)

3. Handle chain recompile animations:
   - Detect chain recompilation via WebSocket events
   - Fade out old pending nodes
   - Disconnect old edges
   - Slide in new nodes
   - Draw new edges with animation

**Depends on:** Step 2.1 (swimlane layout), Step 2.2 (animated nodes), Step 2.3 (animated edges)

**Why:** Container orchestrates the complete flow visualization with all animation logic.

---

### Step 2.5: Integrate Flow Visualization into Session Window Tile
**Package:** packages/app/
**Files to modify:**
- `packages/app/src/components/SessionWindowGrid/SessionWindowTile.tsx`

**Changes:**
1. Add split layout to expanded tile:
   - Left 4/5: `FlowVisualization` component
   - Right 1/5: `ClaudeCliTerminal` component (if CLI session attached)

2. Handle tile resize events and propagate to ReactFlow

3. Add step inspector side panel (slide in from right on node click)

**Depends on:** Step 2.4 (flow visualization container), Step 1.5 (session window tile)

**Why:** Integrates the flow visualization into the main session monitoring interface.

---

### Step 2.6: Create Flow Animation Event Handler
**Package:** packages/app/
**Files to create:**
- `packages/app/src/hooks/useFlowAnimations.ts`

**Changes:**
1. Create `useFlowAnimations.ts` hook:
   - Listen for WebSocket events: `step:spawned`, `step:started`, `step:completed`, `step:failed`, `chain:compiled`
   - Trigger node animations based on events
   - Trigger edge animations based on events
   - Handle chain recompilation animation sequence
   - Manage animation queue to prevent overwhelming UI

2. Animation timing coordination:
   - Stagger node animations when multiple steps spawn simultaneously
   - Coordinate edge animations with node state changes

**Depends on:** Step 2.2 (animated nodes), Step 2.3 (animated edges), Step 2.4 (flow visualization)

**Why:** Centralized animation logic ensures smooth, coordinated visual updates.

---

## Phase 3: Quick-Action Bar + Lifecycle

### Step 3.1: Create Quick-Action Bar Component
**Package:** packages/app/
**Files to create:**
- `packages/app/src/components/QuickActionBar/QuickActionBar.tsx`
- `packages/app/src/components/QuickActionBar/QuickActionBar.css`
- `packages/app/src/components/QuickActionBar/QuickActionButton.tsx`

**Changes:**
1. Create `QuickActionBar.tsx` - bottom bar on session tile:
   - Context-aware button display (hides irrelevant actions)
   - Manual input field (always present)
   - Highlight/pulse animation when session enters waiting-for-input state

2. Create `QuickActionButton.tsx` - individual action button:
   - Icon + label
   - Click handler sends input to session
   - Loading state while input is being sent

3. Context detection logic:
   - Parse terminal output / last Claude message
   - Detect common patterns (y/n, 1-5, file path, etc.)
   - Show relevant quick actions based on detected context

**Depends on:** Step 1.1 (shared types), Step 1.6 (session window hook)

**Why:** Quick-action bar reduces manual input overhead and speeds up common workflows.

---

### Step 3.2: Create Context Pattern Matcher
**Package:** packages/app/
**Files to create:**
- `packages/app/src/utils/contextPatternMatcher.ts`

**Changes:**
1. Create pattern matching utility:
   - `detectPromptType(output: string): PromptType` - detects binary, text, choice, etc.
   - `extractQuickResponses(output: string): string[]` - extracts suggested responses from Claude output
   - `patternMatchers: PatternMatcher[]` - array of regex patterns for common prompts

2. Common patterns:
   - Binary (yes/no, y/n)
   - Choice (1-5, a-e)
   - File path request
   - Confirmation prompts
   - Chain approval

**Depends on:** Step 1.1 (shared types)

**Why:** Pattern matching enables intelligent quick-action suggestions without ActionFlows events.

---

### Step 3.3: Create Session Lifecycle State Machine
**Package:** packages/app/
**Files to create:**
- `packages/app/src/utils/sessionLifecycle.ts`

**Changes:**
1. Create state machine utility:
   - `SessionLifecycleStateMachine` class
   - States: Created, Active, Paused, WaitingForInput, Ended
   - Transitions: start, pause, resume, waitForInput, receiveInput, end
   - Event handlers for state transitions
   - Auto-archive logic for ended sessions (configurable delay)

2. State-based UI updates:
   - Badge color and label based on state
   - Visual indicators (pulse animation on WaitingForInput)
   - Disable/enable quick actions based on state

**Depends on:** Step 1.1 (shared types)

**Why:** Explicit state machine ensures consistent lifecycle handling across all session windows.

---

### Step 3.4: Create Session Archive System
**Package:** packages/app/
**Files to create:**
- `packages/app/src/hooks/useSessionArchive.ts`
- `packages/app/src/components/SessionArchive/SessionArchive.tsx`

**Changes:**
1. Create `useSessionArchive.ts` hook:
   - Auto-archive ended sessions after configurable delay (default: 60 seconds)
   - Store archived sessions in local storage
   - Provide methods: `getArchivedSessions()`, `restoreSession()`, `deleteArchive()`

2. Create `SessionArchive.tsx` component:
   - Modal or slide-out panel
   - List of archived sessions
   - Restore button (re-adds to followed grid)
   - Delete button (removes from archive)

**Depends on:** Step 1.1 (shared types), Step 3.3 (lifecycle state machine)

**Why:** Archive system prevents clutter while preserving access to historical sessions.

---

### Step 3.5: Create Settings Panel for Quick Actions
**Package:** packages/app/
**Files to create:**
- `packages/app/src/components/Settings/QuickActionSettings.tsx`
- `packages/app/src/components/Settings/QuickActionSettings.css`

**Changes:**
1. Create `QuickActionSettings.tsx` - settings panel:
   - Add/edit/delete global quick action presets
   - Configure action icon, label, and input value
   - Enable/disable context-aware filtering
   - Save preferences to backend (`PUT /api/session-windows/:id/config`)

2. Quick action preset editor:
   - Input field for action label
   - Input field for action value (what gets sent to CLI)
   - Icon picker

**Depends on:** Step 1.1 (shared types), Step 1.2 (backend API), Step 3.1 (quick-action bar)

**Why:** User-configurable quick actions enable personalized workflows.

---

### Step 3.6: Integrate CLI Binding Modes
**Package:** packages/app/
**Files to modify:**
- `packages/app/src/components/SessionWindowGrid/SessionWindowTile.tsx`
- `packages/app/src/hooks/useSessionWindows.ts`

**Changes:**
1. Modify `SessionWindowTile.tsx`:
   - Add CLI mode toggle: "Attached to session" vs "Standalone"
   - Attached mode: CLI terminal shown in right 1/5 of tile, bound to session
   - Standalone mode: CLI terminal detached, shown as overlay (current implementation)

2. Modify `useSessionWindows.ts`:
   - Add CLI binding state tracking
   - Provide methods: `attachCliToSession()`, `detachCliFromSession()`

3. Handle CLI lifecycle:
   - Attach CLI to session when session enters WaitingForInput state (optional, user preference)
   - Show CLI indicator badge on session when CLI is attached

**Depends on:** Step 1.6 (session window hook), Step 1.5 (session window tile)

**Why:** Dual-mode CLI binding provides flexibility for different workflows.

---

### Step 3.7: Add Dual-Layer Data Source (Stream-JSON Fallback)
**Package:** packages/app/
**Files to create:**
- `packages/app/src/utils/streamJsonParser.ts`
- `packages/app/src/hooks/useStreamJsonEnrichment.ts`

**Changes:**
1. Create `streamJsonParser.ts`:
   - Parse Claude CLI stream-JSON output
   - Map `tool_use` blocks to chain steps
   - Map `tool_result` blocks to step completions
   - Detect Task spawns and map to chains
   - Extract metadata (action names, durations, etc.)

2. Create `useStreamJsonEnrichment.ts` hook:
   - Listen for `claude-cli:output` events
   - Parse stream-JSON content
   - Enrich session/chain/step data with parsed metadata
   - Fallback when ActionFlows events not available

3. Integration:
   - Primary data source: ActionFlows events (chain:compiled, step:spawned, etc.)
   - Secondary data source: Stream-JSON parser (when ActionFlows events missing)
   - Merge both sources for complete picture

**Depends on:** Step 1.1 (shared types), Step 1.6 (session window hook)

**Why:** Dual-layer data sourcing ensures session windows work with both ActionFlows-enabled and standard Claude CLI sessions.

---

### Step 3.8: Add Full-Screen Toggle and Keyboard Shortcuts
**Package:** packages/app/
**Files to modify:**
- `packages/app/src/components/SessionWindowGrid/SessionWindowTile.tsx`
- `packages/app/src/hooks/useKeyboardShortcuts.ts` (create if not exists)

**Changes:**
1. Modify `SessionWindowTile.tsx`:
   - Add double-click handler to toggle full-screen mode
   - Add full-screen toggle button in tile header
   - Full-screen mode: tile expands to cover entire grid area, z-index elevated

2. Create `useKeyboardShortcuts.ts` hook:
   - Register shortcuts: `Esc` to exit full-screen, `F` to toggle full-screen on selected tile
   - Register shortcuts: `1-9` to focus specific session tile
   - Register shortcuts: `Tab` to cycle between tiles

**Depends on:** Step 1.5 (session window tile)

**Why:** Full-screen mode and keyboard shortcuts improve power user workflows.

---

## Dependency Graph

```
Phase 1 (Foundation):
  Step 1.1 (Shared Types)
    ├─> Step 1.2 (Backend API)
    │     └─> Step 1.3 (Storage Layer)
    ├─> Step 1.4 (Sidebar Component)
    ├─> Step 1.5 (Grid Layout)
    └─> Step 1.6 (Session Window Hook)
          └─> Step 1.7 (AppContent Integration)

Phase 2 (Flow Visualization + Animations):
  Step 2.1 (Swimlane Layout) [depends on 1.1]
    └─> Step 2.2 (Animated Nodes) [depends on 1.1]
    └─> Step 2.3 (Animated Edges) [depends on 1.1]
          └─> Step 2.4 (Flow Visualization Container)
                └─> Step 2.5 (Integrate into Tile) [depends on 1.5]
                └─> Step 2.6 (Animation Event Handler)

Phase 3 (Quick-Action Bar + Lifecycle):
  Step 3.1 (Quick-Action Bar) [depends on 1.1, 1.6]
  Step 3.2 (Pattern Matcher) [depends on 1.1]
  Step 3.3 (Lifecycle State Machine) [depends on 1.1]
    └─> Step 3.4 (Archive System)
  Step 3.5 (Settings Panel) [depends on 1.1, 1.2, 3.1]
  Step 3.6 (CLI Binding) [depends on 1.5, 1.6]
  Step 3.7 (Stream-JSON Fallback) [depends on 1.1, 1.6]
  Step 3.8 (Full-Screen + Shortcuts) [depends on 1.5]
```

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| ReactFlow performance with 50+ nodes | High - UI lag on complex chains | Implement virtualization, limit visible nodes, use `memo` aggressively |
| Animation timing coordination complexity | Medium - animations may feel janky | Use centralized animation queue, stagger animations, test with real data |
| Websocket event flooding on rapid step updates | High - UI freeze or lag | Throttle/debounce updates, batch state changes, use requestAnimationFrame |
| Stream-JSON parsing ambiguity | Medium - incorrect chain/step mapping | Implement robust pattern matching, fallback to heuristics, log parse failures |
| Storage layer migration for Redis | Low - existing Redis storage may need new keys | Add migration script, test with both MemoryStorage and Redis |
| Breaking changes to existing components | Medium - AppContent, SessionPane currently used | Keep old components temporarily, feature flag new UI, gradual migration |
| Full-screen mode z-index conflicts | Low - potential overlap with modals | Use high z-index (999), portal for full-screen overlay |
| Context pattern matching false positives | Medium - incorrect quick actions shown | Start conservative (low false positive rate), add user feedback loop to improve patterns |
| CLI binding lifecycle edge cases | Medium - CLI attach/detach timing issues | Explicit state machine for CLI lifecycle, robust error handling |
| Large grid (10+ sessions) performance | High - excessive DOM nodes and WebSocket subscriptions | Warn user, limit max followed sessions (e.g., 8), lazy-load off-screen tiles |

---

## Verification

### Phase 1 (Foundation)
- [ ] Type check passes across all packages (pnpm type-check)
- [ ] Backend API endpoints return expected data structures (manual testing with curl/Postman)
- [ ] Sidebar renders user list with sessions
- [ ] Sidebar collapse/expand works correctly
- [ ] Grid renders followed sessions in correct layout (1, 2, 3, 4, 5+ sessions)
- [ ] Follow/unfollow functionality updates grid in real-time
- [ ] WebSocket connection established and events received

### Phase 2 (Flow Visualization + Animations)
- [ ] Swimlane layout renders correctly for chains with 5-20 steps
- [ ] Node animations trigger on correct events (spawned, started, completed, failed)
- [ ] Edge animations show data flow when steps execute
- [ ] Chain recompilation animates smoothly (fade out old, slide in new)
- [ ] Step inspector opens on node click and displays metadata
- [ ] Performance acceptable with 50+ nodes (60 FPS)

### Phase 3 (Quick-Action Bar + Lifecycle)
- [ ] Quick-action bar shows context-aware buttons
- [ ] Manual input field sends input to session successfully
- [ ] Session lifecycle state transitions work correctly (Created → Active → WaitingForInput → Active → Ended)
- [ ] Ended sessions auto-archive after delay
- [ ] Archive panel shows archived sessions and restore works
- [ ] Settings panel saves quick action presets
- [ ] CLI attached mode shows terminal in session tile
- [ ] Stream-JSON parsing enriches session data when ActionFlows events unavailable
- [ ] Full-screen toggle works correctly (double-click and button)
- [ ] Keyboard shortcuts work (Esc, F, 1-9, Tab)

### End-to-End
- [ ] User can follow multiple sessions and monitor them simultaneously
- [ ] Real-time updates from WebSocket reflect in UI within 500ms
- [ ] Quick actions successfully send input and session responds
- [ ] Lifecycle transitions trigger appropriate UI changes
- [ ] Performance acceptable with 4 active sessions, each with 20+ steps
- [ ] No memory leaks after 10+ follow/unfollow cycles
- [ ] No console errors or warnings during normal operation

---

## Post-Implementation Notes

### Potential Optimizations (Future)
- Virtual scrolling for large session lists in sidebar
- WebWorker for Stream-JSON parsing (offload from main thread)
- Canvas-based rendering for flow visualization (if ReactFlow performance insufficient)
- WebGL particle system for edge animations (more performant than CSS)

### Future Enhancements (Out of Scope)
- Multi-user collaboration (shared session windows)
- Session snapshots/bookmarks (save flow state at specific point in time)
- Replay mode (step-by-step replay of completed sessions)
- Flow diff view (compare two sessions side-by-side)
- Export flow visualization as image/video

---

## Implementation Order Summary

**Phase 1 (Foundation):** 1.1 → 1.2 → 1.3 → (1.4, 1.5 parallel) → 1.6 → 1.7
**Phase 2 (Flow Viz):** 2.1 → (2.2, 2.3 parallel) → 2.4 → 2.5 → 2.6
**Phase 3 (Actions + Lifecycle):** (3.1, 3.2, 3.3 parallel) → 3.4 → 3.5 → (3.6, 3.7, 3.8 parallel)

**Estimated Effort:**
- Phase 1: 3-4 days (foundation is critical, needs careful design)
- Phase 2: 4-5 days (animations require iteration and polish)
- Phase 3: 3-4 days (many independent features, can parallelize)
- **Total: 10-13 days** (assuming single developer, full-time)

---

## Learnings

**Issue:** None — this is a planning task, execution has not begun.

**Root Cause:** N/A

**Suggestion:** N/A

**[FRESH EYE]** During codebase exploration, I discovered that the project already has comprehensive WebSocket infrastructure, ReactFlow integration, and Claude CLI subprocess spawning. The existing `ChainDAG` component provides a solid foundation for the swimlane visualization — we should reuse its layout logic and extend it rather than building from scratch. Additionally, the existing `useClaudeCliSessions` hook handles CLI lifecycle well, so the CLI binding feature (Step 3.6) should integrate with this existing system rather than reimplementing.
