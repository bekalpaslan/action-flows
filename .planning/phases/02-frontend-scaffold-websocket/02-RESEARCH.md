# Phase 2: Frontend Scaffold & WebSocket - Research

**Researched:** 2026-04-01
**Domain:** Frontend architecture rebuild (React 18 + Vite 6 + Electron 35), WebSocket multiplexing (ws 8.14), workbench shell scaffold
**Confidence:** HIGH

## Summary

Phase 2 performs a hard cutover: the entire cosmic-themed frontend (60+ components, 58 hooks, 15 contexts) is deleted and replaced with a clean workbench shell. A new multiplexed WebSocket layer replaces the existing session-centric WebSocket handler on both frontend and backend. The build pipeline (Vite dev server, Electron production build) must produce a working app with the new shell.

The scope is deliberately structural, not visual. No component library (Phase 3), no resize handles (Phase 4), no icons. The shell renders a 3-region fixed layout (sidebar 220px, workspace fluid, chat placeholder 300px), consumes existing design tokens from `design-tokens.css`, and demonstrates workbench switching and WebSocket multiplexing.

**Primary recommendation:** Delete frontend wholesale first, then build the new shell in a clean `src/workbenches/` directory. Rebuild both frontend and backend WebSocket with channel-per-workbench multiplexing. Use zustand for shell state management (not React contexts). Preserve backend services, shared types, Electron main process, and actionflows framework untouched.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Hard cutover -- no feature flags, no maintaining two UIs. Remove cosmic code entirely, build new workbench shell from scratch.
- **D-02:** Delete all cosmic components -- remove existing `src/components/` entirely. Create new `src/workbenches/` directory structure. Git history preserves old code if needed.
- **D-03:** Start fresh on hooks and contexts -- delete all 58 hooks and 15 contexts. Rebuild only what's needed as workbench features require them. No carryover from cosmic codebase.
- **D-04:** Channel-per-workbench multiplexing -- single WebSocket connection, messages tagged with `workbenchId`. Each workbench subscribes to its channel. Clean separation, easy to filter.
- **D-05:** Rebuild both frontend and backend WebSocket -- new WebSocket hub on backend with proper channel management. Clean contract between frontend and backend. Existing ws handler replaced.

### Claude's Discretion
- Directory structure within `src/workbenches/` -- how to organize the shell, shared layouts, per-workbench pages
- WebSocket message envelope format (JSON structure, channel naming, subscription protocol)
- Which Electron main process changes are needed (if any) for the new frontend
- How to handle the 177 pre-existing frontend TS errors (they disappear with the delete, but new code must compile clean)
- State management approach for the shell (React context vs zustand -- research will inform this)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-03 | Single WebSocket connection multiplexed across all workbenches (replaces per-component connections) | WebSocket Architecture section covers the multiplexed hub pattern, message envelope format, and channel subscription protocol. Backend ws/ directory rebuild documented. |
| FOUND-04 | Frontend rebuilt as clean workbench architecture (preserve backend, shared types, actionflows framework) | Architecture Patterns section covers directory structure, deletion scope, what stays vs what goes. Standard Stack section covers zustand for state management. |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

- **Build & Deploy:** Rebuild and redeploy after code changes
- **Commit style:** Conventional commits (feat:, fix:, refactor:, docs:, test:, chore:)
- **Co-author:** Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
- **Test framework:** Vitest 4.0 + happy-dom (frontend), Vitest (backend)
- **Type safety:** `pnpm type-check` must pass -- strict TypeScript, no `as any`
- **Monorepo:** pnpm workspaces, packages at `packages/app/`, `packages/backend/`, `packages/shared/`
- **Path alias:** `@/*` maps to `src/*` in frontend (tsconfig.json + vite.config.ts)
- **Branded types:** Use `brandedTypes.*` constructors, never raw string casts
- **Subagent instruction:** Skip post-task automation (CLAUDE.md global rules), follow agent.md instead

---

## Standard Stack

### Core (already installed -- no new dependencies for Phase 2)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| React | 18.2.0 | UI framework | Installed in packages/app |
| Vite | 6.2.0 | Build tool + dev server | Installed in packages/app |
| TypeScript | 5.4.x | Type checking | Installed |
| ws | 8.14.2 | Backend WebSocket server | Installed in packages/backend |
| Electron | 35.7.5 | Desktop app runtime | Installed in packages/app |
| @afw/shared | workspace:* | Shared types (branded strings, events) | Workspace package |

### New Dependency (Phase 2)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | 5.0.12 | Shell state management (active workbench, connection status, UI state) | Lightweight, zero-boilerplate, TypeScript-native store. Avoids the 12-deep Context provider pyramid the old codebase had. Selector pattern prevents unnecessary re-renders. Standard choice for React 2025-2026 apps needing shared state without Redux ceremony. |

**Version verified:** `npm view zustand version` returns 5.0.12 (confirmed 2026-04-01).

### Alternatives Considered

| Instead of | Could Use | Why Not for Phase 2 |
|------------|-----------|---------------------|
| zustand | React Context | The old codebase had 15 nested context providers, causing provider hell and re-render cascades. Zustand stores are module-scoped singletons -- no provider tree needed. The selector pattern (`useStore(s => s.field)`) prevents components from re-rendering when unrelated state changes. |
| zustand | Jotai | Jotai's atomic model is better for fine-grained form state. Phase 2 needs centralized stores (active workbench, WebSocket connection, UI state) where zustand's store model maps naturally. |
| Single zustand store | Multiple stores | Per ARCHITECTURE.md recommendation: separate stores per domain (UIStore, WebSocketStore) to isolate update frequencies and prevent cascading re-renders. |

### Installation

```bash
cd packages/app
pnpm add zustand@^5.0.12
```

---

## Architecture Patterns

### Recommended Directory Structure (after deletion)

```
packages/app/src/
  main.tsx                          # Entry point (rewritten, simplified)
  App.tsx                           # Root component (rewritten, minimal)
  index.css                         # Global reset (preserved, import updated)
  styles/
    design-tokens.css               # PRESERVED -- design token system
    design-tokens-guide.css         # PRESERVED -- token documentation
  workbenches/
    shell/
      AppShell.tsx                  # Root 3-region layout (sidebar, workspace, chat placeholder)
      AppShell.css                  # Shell layout styles using design tokens
    sidebar/
      SidebarPlaceholder.tsx        # 7-workbench navigation list
      SidebarPlaceholder.css        # Sidebar styles
    workspace/
      WorkspaceArea.tsx             # Active workbench content (renders placeholder per workbench)
      WorkspaceArea.css             # Workspace styles
    chat/
      ChatPlaceholder.tsx           # Right panel placeholder ("Chat panel -- Phase 7")
      ChatPlaceholder.css           # Chat placeholder styles
    pages/                          # Per-workbench placeholder pages
      WorkPage.tsx
      ExplorePage.tsx
      ReviewPage.tsx
      PMPage.tsx
      SettingsPage.tsx
      ArchivePage.tsx
      StudioPage.tsx
  stores/
    uiStore.ts                      # Active workbench, sidebar collapse
    wsStore.ts                      # Connection status, channel subscriptions
  hooks/
    useWebSocket.ts                 # Singleton multiplexed WebSocket hook
  lib/
    ws-client.ts                    # WebSocket client class (module-level singleton, outside React)
    types.ts                        # Frontend-specific types (WorkbenchId, etc.)
  status/
    WebSocketStatus.tsx             # Connection indicator component
    WebSocketStatus.css             # Status styles
```

### What Gets Deleted

| Directory | Contents | Count |
|-----------|----------|-------|
| `packages/app/src/components/` | All cosmic-themed components (CosmicMap, Stars, ChainDAG, etc.) | 60+ components |
| `packages/app/src/hooks/` | All existing hooks (useWebSocket, useChainState, etc.) | 58 hooks |
| `packages/app/src/contexts/` | All existing contexts (WebSocketContext, SessionContext, etc.) | 15 contexts |
| `packages/app/src/stores/` | Any existing stores | All |
| `packages/app/src/contracts/` | Component contracts (cosmic-specific) | All |
| `packages/app/src/capabilities/` | Dashboard capability implementations (cosmic-specific) | All |
| `packages/app/src/systems/` | System integrations (cosmic-specific) | All |
| `packages/app/src/services/` | Frontend services (cosmic-specific) | All |
| `packages/app/src/config/` | Configuration (cosmic-specific) | All |
| `packages/app/src/data/` | Static data (cosmic-specific) | All |
| `packages/app/src/types/` | Frontend types (cosmic-specific) | All |
| `packages/app/src/styles/cosmic-tokens.css` | Cosmic-specific tokens | 1 file |
| `packages/app/src/styles/region-themes.css` | Cosmic region themes | 1 file |
| `packages/app/src/styles/ChainDemo.css` | Cosmic chain demo | 1 file |
| `packages/app/src/styles/ChainLiveMonitor.css` | Cosmic chain monitor | 1 file |
| `packages/app/src/styles/history-browser.css` | Cosmic history browser | 1 file |
| `packages/app/src/styles/animations/` | Cosmic animations | All |
| `packages/app/src/App.css` | Current app layout styles (cosmic) | 1 file |

### What Stays (MUST NOT be modified or deleted)

| Item | Location | Why |
|------|----------|-----|
| Design tokens | `packages/app/src/styles/design-tokens.css` | Phase 2 consumes these tokens. Phase 3 will bridge them to Tailwind. |
| Design tokens guide | `packages/app/src/styles/design-tokens-guide.css` | Documentation reference for token usage. |
| Electron main process | `packages/app/electron/main.ts` | No changes needed -- loads URL based on `isDev` flag. Vite dev URL (`http://localhost:5173`) and prod URL (`http://localhost:3001`) remain valid. |
| Electron preload | `packages/app/electron/preload.ts` | IPC channel contracts are app-agnostic. No cosmic dependencies. |
| Vite config | `packages/app/vite.config.ts` | Needs minor update: remove `reactflow` from `optimizeDeps.include` and remove cosmic-specific `manualChunks`. Core proxy config for `/api` and `/ws` stays. |
| TypeScript config | `packages/app/tsconfig.json` | Path alias `@/*` used by new code. No changes needed. |
| Backend (entire) | `packages/backend/src/` | Except `packages/backend/src/ws/` which is rebuilt. All routes, services, storage, middleware preserved. |
| Shared types | `packages/shared/src/` | Extended with new WebSocket message types if needed. |
| Actionflows framework | `.claude/actionflows/` | Preserved entirely. |
| Package configs | `package.json`, `tsconfig.json` (root) | Monorepo configuration preserved. |
| Test infrastructure | `packages/app/vitest.config.ts` | Test setup preserved, updated to remove cosmic mocks. |

### What Gets Rebuilt (Backend WebSocket)

The backend WebSocket layer at `packages/backend/src/ws/` is rebuilt to support channel-per-workbench multiplexing:

| File | Current Role | New Role |
|------|-------------|----------|
| `handler.ts` | Session-centric message routing (subscribe to sessionId) | Channel-per-workbench message routing (subscribe to workbenchId channels) |
| `clientRegistry.ts` | Tracks clients per sessionId | Tracks clients per workbenchId channel + legacy sessionId |
| (new) `hub.ts` | Does not exist | WebSocket hub: channel management, message routing, envelope validation |

**Key architectural change:** The current WebSocket routes messages by `sessionId` (one session = one conversation). The new system routes by `workbenchId` (one workbench = one workspace context). Session subscriptions will be re-added in Phase 6 when sessions are implemented. Phase 2 only needs workbench-level channel routing.

### Pattern: Module-Level WebSocket Singleton

**Confidence: HIGH** (verified pattern from project PITFALLS.md P6 and ARCHITECTURE.md)

The existing `useWebSocket` hook stores the WebSocket in a `useRef`, creating connection proliferation on unmount/remount. The new approach uses a module-level singleton class, outside React's lifecycle.

```typescript
// lib/ws-client.ts -- Module-level singleton, NOT a React hook
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
type MessageHandler = (envelope: WSEnvelope) => void;

class WSClient {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<MessageHandler>>();
  private status: ConnectionStatus = 'disconnected';
  private statusListeners = new Set<(s: ConnectionStatus) => void>();
  private reconnectTimer: number | null = null;
  private reconnectAttempt = 0;
  private readonly maxReconnectDelay = 30_000;

  connect(url: string): void { /* ... */ }
  disconnect(): void { /* ... */ }

  // Channel subscription
  subscribe(channel: string, handler: MessageHandler): () => void { /* returns unsubscribe fn */ }

  // Send message with workbench channel
  send(channel: string, type: string, payload: unknown): void { /* ... */ }

  // Status subscription for React components
  onStatusChange(listener: (s: ConnectionStatus) => void): () => void { /* ... */ }

  getStatus(): ConnectionStatus { return this.status; }
}

// Single instance -- imported by stores and hooks
export const wsClient = new WSClient();
```

React components access this via a thin hook or zustand store, but the WebSocket lifecycle is managed entirely outside React.

### Pattern: WebSocket Message Envelope

**Confidence: HIGH** (from CONTEXT.md D-04, Claude's discretion for format)

```typescript
// Shared between frontend and backend -- define in @afw/shared or locally

/** Every WebSocket message uses this envelope */
interface WSEnvelope {
  /** Channel = workbench ID (e.g., "work", "explore", "review") */
  channel: string;

  /** Message type within the channel */
  type: string;

  /** Payload specific to the message type */
  payload?: unknown;

  /** Server-assigned timestamp */
  ts?: string;
}

// Special channels
const SYSTEM_CHANNEL = '_system';  // connection status, errors, ping/pong
const BROADCAST_CHANNEL = '_all';  // messages to all workbenches
```

**Client-to-server messages:**
```typescript
// Subscribe to a workbench channel
{ channel: '_system', type: 'subscribe', payload: { workbenchId: 'work' } }

// Unsubscribe from a workbench channel
{ channel: '_system', type: 'unsubscribe', payload: { workbenchId: 'work' } }

// Ping (keepalive)
{ channel: '_system', type: 'ping' }
```

**Server-to-client messages:**
```typescript
// Subscription confirmed
{ channel: '_system', type: 'subscribed', payload: { workbenchId: 'work' } }

// Pong (keepalive response)
{ channel: '_system', type: 'pong' }

// Workbench-scoped event (future phases will use this for session events, pipeline updates, etc.)
{ channel: 'work', type: 'session:message', payload: { ... } }

// Broadcast to all (e.g., connection status)
{ channel: '_all', type: 'status', payload: { connected: true } }
```

### Pattern: Zustand Store Per Domain

**Confidence: HIGH** (from project ARCHITECTURE.md recommendation)

```typescript
// stores/uiStore.ts
import { create } from 'zustand';

type WorkbenchId = 'work' | 'explore' | 'review' | 'pm' | 'settings' | 'archive' | 'studio';

interface UIState {
  activeWorkbench: WorkbenchId;
  setActiveWorkbench: (id: WorkbenchId) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeWorkbench: 'work',
  setActiveWorkbench: (id) => set({ activeWorkbench: id }),
}));
```

```typescript
// stores/wsStore.ts
import { create } from 'zustand';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

interface WSState {
  status: ConnectionStatus;
  subscribedChannels: Set<string>;
  setStatus: (status: ConnectionStatus) => void;
  addChannel: (channel: string) => void;
  removeChannel: (channel: string) => void;
}

export const useWSStore = create<WSState>((set) => ({
  status: 'disconnected',
  subscribedChannels: new Set(),
  setStatus: (status) => set({ status }),
  addChannel: (channel) => set((s) => {
    const next = new Set(s.subscribedChannels);
    next.add(channel);
    return { subscribedChannels: next };
  }),
  removeChannel: (channel) => set((s) => {
    const next = new Set(s.subscribedChannels);
    next.delete(channel);
    return { subscribedChannels: next };
  }),
}));
```

### Anti-Patterns to Avoid

- **Provider pyramid:** The old codebase had 12 nested context providers in App.tsx. Zustand stores are module singletons -- no providers needed. The new App.tsx should have zero or minimal providers.
- **Per-component WebSocket connections:** The old `useWebSocket` hook created connections per usage site. The new `wsClient` is a module singleton -- components subscribe to channels, not connections.
- **Importing from deleted directories:** New code must NEVER import from `src/components/`, `src/hooks/` (old), or `src/contexts/`. These directories are deleted.
- **Inline styles or raw CSS values:** Even though Phase 2 uses plain CSS (not Tailwind), all values must reference design tokens (`var(--app-bg-primary)`, not `#0c1425`).
- **Workbench state bleed:** Each workbench page should use `key={workbenchId}` in the workspace area to force clean unmount/remount on switch (per PITFALLS.md P13).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| State management | Custom React context with useReducer | zustand store | Avoids provider hell, selector-based re-render prevention, zero boilerplate |
| WebSocket reconnection | Manual setTimeout retry logic | Structured reconnection in WSClient class with exponential backoff | The old useWebSocket had 370 lines of reconnection/polling logic. A clean class-based approach is simpler and testable. |
| CSS reset | Custom reset CSS | Preserve existing `index.css` reset | Already working, uses design tokens |
| Design tokens | New token definitions | Existing `design-tokens.css` (800+ lines) | Already comprehensive -- Phase 2 consumes, Phase 3 bridges to Tailwind |
| Workbench ID typing | String literals scattered in code | Union type `WorkbenchId` defined once | Type safety for the 7 default workbenches |

---

## Common Pitfalls

### Pitfall 1: Deleting Too Much or Too Little

**What goes wrong:** The deletion removes files that should be preserved (design tokens, Vite config, Electron files) or leaves orphan imports that cause build failures.

**Why it happens:** The `src/` directory has deep interdependencies. A naive `rm -rf src/components src/hooks src/contexts` misses files in `src/styles/` that reference cosmic tokens, or leaves `src/main.tsx` importing deleted modules.

**How to avoid:**
1. Delete directories in this exact order: `components/`, `hooks/`, `contexts/`, `stores/`, `contracts/`, `capabilities/`, `systems/`, `services/`, `config/`, `data/`, `types/`
2. Delete specific style files: `cosmic-tokens.css`, `region-themes.css`, `ChainDemo.css`, `ChainLiveMonitor.css`, `history-browser.css`, `animations/`
3. Delete `App.css` (cosmic layout)
4. PRESERVE: `design-tokens.css`, `design-tokens-guide.css`, `index.css`, `styles/themes/` (if token imports are needed)
5. Rewrite `main.tsx` and `App.tsx` from scratch
6. After deletion, run `pnpm type-check` in packages/app -- it should show zero errors (nothing to compile yet) or only errors from the new code being written

**Warning signs:** `pnpm build` fails with "Cannot find module" errors referencing deleted paths.

### Pitfall 2: Backend WebSocket Regression

**What goes wrong:** Rebuilding the WebSocket handler breaks existing backend services that broadcast events (fileWatcher, sparkBroadcaster, harmonyDetector, etc.). These services call `clientRegistry.broadcastToSession()` which depends on the current session-subscription model.

**Why it happens:** The backend `index.ts` has 20+ broadcast function wiring points (`setBroadcastFunction`, `broadcastToSession`, etc.) that depend on the current clientRegistry API.

**How to avoid:**
1. The new WebSocket hub must maintain backward compatibility with `broadcastToSession(sessionId, message)` during Phase 2. Session-level routing is preserved alongside the new workbench channel routing.
2. Add `broadcastToChannel(channelId, message)` as a NEW method -- do not remove the existing session broadcast methods.
3. Test that `POST /api/sessions` and other existing REST endpoints still work after the WebSocket rebuild.

**Warning signs:** Backend services silently fail to broadcast events. No errors but no WebSocket messages reaching clients.

### Pitfall 3: Electron Main Process Assumes Specific Frontend Structure

**What goes wrong:** The Electron main process fails to load the new frontend because the build output structure changed, or the production static file serving breaks.

**Why it happens:** The Electron main process (`electron/main.ts`) loads `http://localhost:5173` in dev and `http://localhost:3001` in production (where backend serves static files). The `electron-builder` config packages `dist/` as `app-dist/`. If Vite build output changes (different entry point, missing `index.html`), the app shows a blank screen.

**How to avoid:**
1. Keep `packages/app/index.html` as the Vite entry point -- the new `main.tsx` is still the script entry
2. Do NOT change the Vite build output directory (`dist/`)
3. The Electron main process needs zero changes -- it loads URLs, not file paths
4. Test with `pnpm dev:app` (Vite dev server on 5173) AND `pnpm build` (production Electron build) separately

**Warning signs:** Blank white screen in Electron window. Dev tools console shows 404 for `main.tsx` or `index.html`.

### Pitfall 4: Vite Config Leftover References

**What goes wrong:** The Vite config references deleted packages (`reactflow` in `optimizeDeps`, cosmic chunk splitting in `manualChunks`) causing build warnings or errors.

**Why it happens:** `vite.config.ts` has `optimizeDeps.include: ['reactflow']` and `manualChunks` that reference `/CosmicMap/` and `cosmic` patterns. After deletion, these become dead code that may cause build warnings.

**How to avoid:**
1. Remove `reactflow` from `optimizeDeps.include` (it's not used anymore in Phase 2)
2. Remove cosmic-specific `manualChunks` entries
3. Keep the `@` path alias, server port, and proxy configuration unchanged
4. Keep the react plugin and electron plugin unchanged

**Warning signs:** Vite build warnings about unresolved chunks. Larger-than-expected bundle sizes.

### Pitfall 5: WebSocket Authentication Regression

**What goes wrong:** The new WebSocket hub drops the existing API key validation that the current handler performs on every message.

**Why it happens:** The existing `handler.ts` has per-message API key validation via `clientRegistry.validateApiKey()` and rate limiting via `clientRegistry.checkRateLimit()`. A clean rewrite may omit these security features.

**How to avoid:** The new hub must carry forward:
1. API key validation at upgrade time (`server.on('upgrade', ...)` in index.ts)
2. Per-message API key validation (re-check on each message)
3. Rate limiting per client (50 messages/second)
4. Max client capacity (1000 connections)
5. Session ownership validation (for future session subscriptions)

**Warning signs:** WebSocket connects without authentication. No rate limiting on messages.

---

## Code Examples

### New main.tsx (simplified entry point)

```typescript
// packages/app/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/design-tokens.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### New App.tsx (no provider pyramid)

```typescript
// packages/app/src/App.tsx
import { AppShell } from './workbenches/shell/AppShell';

function App() {
  return <AppShell />;
}

export default App;
```

### AppShell 3-Region Layout

```css
/* workbenches/shell/AppShell.css */
.app-shell {
  display: grid;
  grid-template-columns: 220px 1fr 300px;
  height: 100vh;
  background: var(--app-bg-primary);
  color: var(--text-primary);
  font-family: var(--font-sans);
  gap: var(--gap, 0);
}
```

```tsx
// workbenches/shell/AppShell.tsx
import { useUIStore } from '../../stores/uiStore';
import { SidebarPlaceholder } from '../sidebar/SidebarPlaceholder';
import { WorkspaceArea } from '../workspace/WorkspaceArea';
import { ChatPlaceholder } from '../chat/ChatPlaceholder';
import { WebSocketStatus } from '../../status/WebSocketStatus';
import './AppShell.css';

export function AppShell() {
  const activeWorkbench = useUIStore((s) => s.activeWorkbench);

  return (
    <div className="app-shell">
      <SidebarPlaceholder />
      <WorkspaceArea key={activeWorkbench} workbenchId={activeWorkbench} />
      <ChatPlaceholder />
    </div>
  );
}
```

### Backend WebSocket Hub (new channel routing)

```typescript
// packages/backend/src/ws/hub.ts
import type { WebSocket } from 'ws';

interface ChannelSubscription {
  ws: WebSocket;
  clientId: string;
}

export class WebSocketHub {
  private channels = new Map<string, Set<ChannelSubscription>>();

  subscribe(channel: string, ws: WebSocket, clientId: string): void {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add({ ws, clientId });
  }

  unsubscribe(channel: string, ws: WebSocket): void {
    const subs = this.channels.get(channel);
    if (!subs) return;
    for (const sub of subs) {
      if (sub.ws === ws) {
        subs.delete(sub);
        break;
      }
    }
    if (subs.size === 0) this.channels.delete(channel);
  }

  unsubscribeAll(ws: WebSocket): void {
    for (const [channel, subs] of this.channels) {
      for (const sub of subs) {
        if (sub.ws === ws) {
          subs.delete(sub);
          break;
        }
      }
      if (subs.size === 0) this.channels.delete(channel);
    }
  }

  broadcast(channel: string, message: string): void {
    const subs = this.channels.get(channel);
    if (!subs) return;
    for (const sub of subs) {
      if (sub.ws.readyState === 1) {
        sub.ws.send(message);
      }
    }
  }

  broadcastAll(message: string): void {
    const sent = new Set<WebSocket>();
    for (const subs of this.channels.values()) {
      for (const sub of subs) {
        if (!sent.has(sub.ws) && sub.ws.readyState === 1) {
          sub.ws.send(message);
          sent.add(sub.ws);
        }
      }
    }
  }
}
```

---

## Vite Config Changes Required

The current `vite.config.ts` needs minimal updates. These are the specific changes:

1. **Remove** `reactflow` from `optimizeDeps.include` (line 93) -- reactflow package is being removed in Phase 2 (it will return as `@xyflow/react` in Phase 5)
2. **Remove** cosmic-specific `manualChunks` entries (lines 73-79) -- `/CosmicMap/`, `cosmic`, `/FlowVisualization/` references to deleted code
3. **Keep** everything else: react plugin, electron plugin, proxy config, path alias, build output config

No new Vite plugins are needed for Phase 2 (Tailwind and its Vite plugin arrive in Phase 3).

---

## Electron Impact Assessment

**Result: No changes needed to Electron main process or preload script.**

**Evidence:**
- `electron/main.ts` loads URLs (`http://localhost:5173` dev, `http://localhost:3001` prod). The new frontend is served at the same URLs.
- `electron/preload.ts` exposes IPC channels (`ping`, `show-notification`, `update-available`, `close-app`). None of these reference frontend components.
- `electron-builder` config packages `dist/` as `app-dist/`. As long as `vite build` produces `dist/index.html`, the Electron build works.
- The window dimensions (1200x800, min 800x600) work for the new 3-panel layout (sidebar 220px + workspace fluid + chat 300px = minimum 520px + fluid, well within 800px minimum).

---

## Backend WebSocket Rebuild Strategy

### Current State

The backend WebSocket handler (`handler.ts`) routes messages by `sessionId`:
- `subscribe` to a session
- `unsubscribe` from a session
- `input` to a session
- `capability:*` messages for capability protocol
- `ping`/`pong` heartbeat

The `clientRegistry` tracks which WebSocket connections are subscribed to which sessions.

The `index.ts` wires 20+ broadcast functions that call `clientRegistry.broadcastToSession()`.

### New State (Phase 2)

The new WebSocket layer adds workbench channel routing on top of (not replacing) the existing session routing:

1. **New `hub.ts`:** Channel subscription/broadcast manager (the code example above)
2. **Updated `handler.ts`:** Adds `channel:subscribe`, `channel:unsubscribe` message types alongside existing session messages
3. **Updated `clientRegistry.ts`:** Adds channel tracking alongside session tracking
4. **Updated `index.ts`:** Wires new hub into the WebSocket connection handler

**Backward compatibility:** All existing `broadcastToSession()` calls continue to work. The new `broadcastToChannel()` is additive.

### WebSocket Schema Updates

The existing `packages/backend/src/schemas/ws.ts` needs new message types added to the discriminated union:

```typescript
const channelSubscribeMessage = z.object({
  type: z.literal('channel:subscribe'),
  channel: z.string().min(1).max(100),
});

const channelUnsubscribeMessage = z.object({
  type: z.literal('channel:unsubscribe'),
  channel: z.string().min(1).max(100),
});
```

---

## State of the Art

| Old Approach (current codebase) | New Approach (Phase 2) | Impact |
|--------------------------------|----------------------|--------|
| 15 nested React Context providers | Zustand module-level stores (0 providers) | Eliminates provider hell, simpler testing, selective re-renders |
| Per-component useWebSocket hook (creates connections) | Module-level WSClient singleton (1 connection) | Eliminates connection proliferation (PITFALLS P6) |
| Session-centric WebSocket routing | Channel-per-workbench routing | Enables workbench-scoped messaging without session dependency |
| 60+ cosmic components | 7 placeholder pages + shell layout | Clean slate for Phase 3 component library |
| `reactflow` 11.10 | (removed in Phase 2, `@xyflow/react` 12 returns in Phase 5) | No pipeline visualizer in Phase 2 -- just the shell |

---

## Open Questions

1. **Themes directory preservation**
   - What we know: `packages/app/src/styles/themes/` is imported by `index.css`. It likely contains the dark theme that loads `design-tokens.css`.
   - What's unclear: Whether the theme directory has cosmic-specific files that should be deleted vs token imports that must stay.
   - Recommendation: Inspect the themes directory during implementation. Keep files that load `design-tokens.css`. Delete files that reference cosmic components.

2. **Existing package.json cleanup**
   - What we know: `packages/app/package.json` has dependencies on `reactflow`, `@reactflow/core`, `d3`, `dagre`, `monaco-editor`, `xterm` -- all cosmic-specific.
   - What's unclear: Whether to remove these dependencies in Phase 2 (they will be re-added in later phases with updated packages) or leave them as unused.
   - Recommendation: Remove `reactflow`, `@reactflow/core` in Phase 2 since they're being replaced by `@xyflow/react` in Phase 5. Leave `monaco-editor`, `xterm`, `d3`, `dagre` for later phases to clean up -- removing them now risks breaking the shared package or tests.

3. **WebSocket URL configuration**
   - What we know: The current frontend hardcodes `ws://localhost:3001/ws` in App.tsx. The Vite proxy handles this in dev.
   - What's unclear: Whether the new WSClient should derive the URL from `window.location` for production flexibility.
   - Recommendation: Use `window.location` to derive the WebSocket URL: `const wsUrl = \`ws\${location.protocol === 'https:' ? 's' : ''}://${location.host}/ws\``. This works in both dev (Vite proxy) and production (Electron loads from backend URL).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0 + happy-dom |
| Config file | `packages/app/vitest.config.ts` |
| Quick run command | `cd packages/app && pnpm test` |
| Full suite command | `pnpm test` (root, runs all packages) |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-03 | WebSocket connection opens and reports status | unit | `cd packages/app && pnpm vitest run src/lib/ws-client.test.ts` | Wave 0 |
| FOUND-03 | Channel subscribe/unsubscribe produces correct messages | unit | `cd packages/app && pnpm vitest run src/lib/ws-client.test.ts` | Wave 0 |
| FOUND-03 | Backend hub routes messages to correct channel subscribers | unit | `cd packages/backend && pnpm vitest run src/ws/__tests__/hub.test.ts` | Wave 0 |
| FOUND-03 | Backend preserves existing broadcastToSession API | unit | `cd packages/backend && pnpm vitest run src/ws/__tests__/handler.test.ts` | Exists (update) |
| FOUND-04 | AppShell renders 3-region layout | unit | `cd packages/app && pnpm vitest run src/workbenches/shell/AppShell.test.tsx` | Wave 0 |
| FOUND-04 | Sidebar shows 7 workbench items | unit | `cd packages/app && pnpm vitest run src/workbenches/sidebar/SidebarPlaceholder.test.tsx` | Wave 0 |
| FOUND-04 | Workbench switching updates active workbench | unit | `cd packages/app && pnpm vitest run src/stores/uiStore.test.ts` | Wave 0 |
| FOUND-04 | `pnpm type-check` passes with zero errors | smoke | `pnpm type-check` | Existing infra |
| FOUND-04 | `pnpm build` produces working dist output | smoke | `pnpm build` | Existing infra |

### Sampling Rate

- **Per task commit:** `cd packages/app && pnpm test` + `pnpm type-check`
- **Per wave merge:** `pnpm test` (all packages) + `pnpm build`
- **Phase gate:** Full suite green + manual verification that Electron app loads the new shell

### Wave 0 Gaps

- [ ] `packages/app/src/lib/ws-client.test.ts` -- covers FOUND-03 (WebSocket client)
- [ ] `packages/backend/src/ws/__tests__/hub.test.ts` -- covers FOUND-03 (backend hub)
- [ ] `packages/app/src/workbenches/shell/AppShell.test.tsx` -- covers FOUND-04 (shell layout)
- [ ] `packages/app/src/workbenches/sidebar/SidebarPlaceholder.test.tsx` -- covers FOUND-04 (sidebar)
- [ ] `packages/app/src/stores/uiStore.test.ts` -- covers FOUND-04 (workbench switching)
- [ ] Update `packages/app/vitest.config.ts` to remove monaco mocks and cosmic path aliases (they reference deleted code)
- [ ] Update existing `packages/backend/src/ws/__tests__/handler.test.ts` to cover new channel messages

---

## Sources

### Primary (HIGH confidence)
- **Codebase inspection** -- Direct reading of `packages/app/src/App.tsx`, `packages/app/src/contexts/WebSocketContext.tsx`, `packages/backend/src/ws/handler.ts`, `packages/backend/src/ws/clientRegistry.ts`, `packages/backend/src/index.ts`, `packages/app/electron/main.ts`, `packages/app/vite.config.ts`, `packages/app/tsconfig.json`, `packages/app/package.json`
- **Project research files** -- `.planning/research/STACK.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md`
- **Project codebase analysis** -- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`, `.planning/codebase/STACK.md`
- **Phase context** -- `02-CONTEXT.md`, `02-UI-SPEC.md`
- **npm registry** -- `npm view zustand version` = 5.0.12, `npm view react-resizable-panels version` = 4.8.0 (verified 2026-04-01)

### Secondary (MEDIUM confidence)
- **Zustand patterns** -- Based on project ARCHITECTURE.md recommendation for store-per-domain pattern. Zustand 5 API is stable and well-documented.
- **WebSocket singleton pattern** -- Derived from project PITFALLS.md P6 (WebSocket connection proliferation) recommendation. Standard pattern for React + WebSocket apps.

### Tertiary (LOW confidence)
- None. All recommendations are based on direct codebase inspection and verified project research.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zustand is the only new dependency, version verified via npm registry, already recommended in project STACK.md
- Architecture: HIGH -- directory structure, deletion scope, and build pipeline derived from direct codebase inspection
- WebSocket design: HIGH -- channel-per-workbench pattern is locked in CONTEXT.md (D-04), implementation patterns derived from existing handler.ts analysis
- Pitfalls: HIGH -- all pitfalls identified from direct codebase reading and project PITFALLS.md cross-reference
- Validation: HIGH -- test framework verified from existing vitest.config.ts, test locations confirmed from directory listing

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable -- no fast-moving dependencies, all patterns based on existing codebase)

---

*Phase: 02-frontend-scaffold-websocket*
*Research completed: 2026-04-01*
