# Frontend/Backend Boundary Inventory

## Executive Summary

The ActionFlows Dashboard implements a clean 3-tier architecture with:
- **Backend**: Express 4.18 + TypeScript (port 3001)
- **Frontend**: React 18.2 + Vite 5 + Electron 28 (port 5173 dev)
- **Shared**: Branded types, discriminated unions, contract parsers

**Communication Patterns:**
- REST API for CRUD operations
- WebSocket for real-time events with HTTP polling fallback
- Type-safe contracts via `@afw/shared`

---

## 1. Complete API Endpoint Catalog

### 1.1 Session Management (`/api/sessions`)

| Method | Endpoint | Purpose | Request Types | Response Types |
|--------|----------|---------|---------------|----------------|
| POST | `/api/sessions` | Create session | `{ cwd, hostname, platform, userId? }` | `Session` |
| GET | `/api/sessions` | List all sessions | - | `{ count, sessions[] }` |
| GET | `/api/sessions/:id` | Get session details | - | `Session & { chains }` |
| PUT | `/api/sessions/:id` | Update session | `{ status?, summary?, endReason? }` | `Session` |
| DELETE | `/api/sessions/:id` | Delete session | - | 204 |
| GET | `/api/sessions/:id/chains` | Get chains | - | `{ chains[] }` |
| GET | `/api/sessions/:id/chat` | Get chat history | - | `{ messages[] }` |
| POST | `/api/sessions/:id/input` | Submit user input | `{ input, prompt? }` | `{ success, inputQueued }` |
| GET | `/api/sessions/:id/input` | Poll for input (long-poll) | `?timeout=60000` | `{ available, input? }` |
| POST | `/api/sessions/:id/awaiting` | Mark awaiting input | `{ promptType, promptText, quickResponses? }` | `{ status, conversationState }` |
| GET | `/api/sessions/:id/freshness` | Get freshness metadata | - | `FreshnessMetadata` |
| GET | `/api/sessions/:id/activity` | Get activity & TTL | - | `{ activity, ttl, isActive }` |
| GET | `/api/freshness/stale` | Get stale resources | `?type=session&threshold=7200000` | `{ staleResources[] }` |

### 1.2 Event System (`/api/events`)

| Method | Endpoint | Purpose | Request Types | Response Types |
|--------|----------|---------|---------------|----------------|
| POST | `/api/events` | Store event | `WorkspaceEvent` | `{ success, eventId, sessionId }` |
| GET | `/api/events/:sessionId` | Get all events | `?since=timestamp` | `{ events[] }` |
| GET | `/api/events/:sessionId/recent` | Get recent events | `?limit=50&seconds=60` | `{ events[], cutoffTime }` |
| GET | `/api/events/poll/:sessionId` | HTTP polling fallback | `?since=timestamp` | `{ events[], timestamp, pollingMode }` |

**Event Flow:**
1. Backend POST to `/api/events` → Storage → WebSocket broadcast
2. Frontend subscribes via WebSocket → receives real-time events
3. Fallback: Frontend polls `/api/events/poll/:sessionId` every 5s

### 1.3 Commands (`/api/sessions/:id/commands`)

| Method | Endpoint | Purpose | Request Types | Response Types |
|--------|----------|---------|---------------|----------------|
| POST | `/api/sessions/:id/commands` | Queue command | `{ type, payload? }` | `{ commandId, command }` |
| GET | `/api/sessions/:id/commands` | Get pending commands | - | `{ commands[] }` |
| POST | `/api/commands/:commandId/ack` | Acknowledge command | `{ result?, error? }` | `{ acknowledged }` |

**Command Types:** `pause`, `resume`, `cancel`, `abort`, `retry`, `skip`

### 1.4 Claude CLI Management (`/api/claude-cli`)

| Method | Endpoint | Purpose | Request Types | Response Types |
|--------|----------|---------|---------------|----------------|
| POST | `/api/claude-cli/start` | Start CLI session | `{ sessionId, cwd, prompt?, flags?, envVars?, mcpConfigPath? }` | `{ session: ClaudeCliSession }` |
| POST | `/api/claude-cli/:sessionId/input` | Send input to stdin | `{ input }` | `{ success }` |
| POST | `/api/claude-cli/:sessionId/stop` | Stop CLI session | `{ signal? }` | `{ success }` |
| GET | `/api/claude-cli/:sessionId/status` | Get session status | - | `{ session, uptime, isRunning }` |
| GET | `/api/claude-cli/sessions` | List CLI sessions | - | `{ sessions[], count }` |

### 1.5 File Operations (`/api/files`)

| Method | Endpoint | Purpose | Request Types | Response Types |
|--------|----------|---------|---------------|----------------|
| GET | `/api/files/:sessionId/tree` | Get file tree | `?path=/&depth=3` | `{ tree }` |
| GET | `/api/files/:sessionId/read` | Read file | `?path=/file.ts` | `{ content, encoding }` |
| POST | `/api/files/:sessionId/write` | Write file | `{ path, content, encoding? }` | `{ success }` |
| GET | `/api/files/:sessionId/diff` | Get file diff | `?path=/file.ts` | `{ diff, oldContent, newContent }` |

### 1.6 Project Management (`/api/projects`)

| Method | Endpoint | Purpose | Request Types | Response Types |
|--------|----------|---------|---------------|----------------|
| GET | `/api/projects` | List projects | - | `{ projects[] }` |
| GET | `/api/projects/:id` | Get project | - | `{ project }` |
| POST | `/api/projects` | Create project | `CreateProjectRequest` | `{ project }` |
| PUT | `/api/projects/:id` | Update project | `UpdateProjectRequest` | `{ project }` |
| DELETE | `/api/projects/:id` | Delete project | - | 204 |
| POST | `/api/projects/detect` | Auto-detect project | `{ cwd }` | `{ detected: ProjectAutoDetectionResult }` |

### 1.7 Registry System (`/api/registry`)

| Method | Endpoint | Purpose | Request Types | Response Types |
|--------|----------|---------|---------------|----------------|
| GET | `/api/registry/entries` | List entries | `?type=workflow&status=active` | `{ entries[] }` |
| GET | `/api/registry/entries/:id` | Get entry | - | `{ entry }` |
| POST | `/api/registry/entries` | Create entry | `RegistryEntry` | `{ entry }` |
| PATCH | `/api/registry/entries/:id` | Update entry | `Partial<RegistryEntry>` | `{ entry }` |
| DELETE | `/api/registry/entries/:id` | Delete entry | - | 204 |
| GET | `/api/registry/packs` | List behavior packs | - | `{ packs[] }` |
| POST | `/api/registry/packs` | Create pack | `BehaviorPack` | `{ pack }` |
| POST | `/api/registry/packs/:id/enable` | Enable pack | - | `{ pack }` |
| POST | `/api/registry/packs/:id/disable` | Disable pack | - | `{ pack }` |
| DELETE | `/api/registry/packs/:id` | Delete pack | - | 204 |
| GET | `/api/registry/resolve/:entryId` | Resolve behavior | - | `ResolvedBehavior` |
| GET | `/api/registry/conflicts/:entryId` | Get conflicts | - | `{ conflicts[] }` |
| GET | `/api/registry/stats` | Get statistics | - | `{ stats }` |

### 1.8 Harmony Detection (`/api/harmony`)

| Method | Endpoint | Purpose | Request Types | Response Types |
|--------|----------|---------|---------------|----------------|
| GET | `/api/harmony/project/:projectId` | Get project harmony | - | `{ checks[], metrics }` |
| GET | `/api/harmony/stats` | Global stats | - | `HarmonyMetrics` |
| GET | `/api/harmony/:sessionId` | Session harmony | - | `{ checks[] }` |
| POST | `/api/harmony/:sessionId/check` | Run harmony check | `{ text, context? }` | `HarmonyResult` |
| GET | `/api/harmony/health` | Health score | - | `HarmonyHealthScore` |
| GET | `/api/harmony/health/gate/:gateId` | Gate health | - | `GateHealthScore` |
| POST | `/api/harmony/validate/manual` | Manual validation | `{ text, expectedFormat }` | `{ valid, result }` |

### 1.9 Universe/Living System (`/api/universe`)

| Method | Endpoint | Purpose | Request Types | Response Types |
|--------|----------|---------|---------------|----------------|
| GET | `/api/universe` | Get universe graph | - | `UniverseGraph` |
| PUT | `/api/universe` | Update universe | `UniverseGraph` | `{ success }` |
| GET | `/api/universe/regions` | List regions | - | `{ regions[] }` |
| GET | `/api/universe/regions/:id` | Get region | - | `{ region }` |
| POST | `/api/universe/regions` | Create region | `RegionNode` | `{ region }` |
| PUT | `/api/universe/regions/:id` | Update region | `Partial<RegionNode>` | `{ region }` |
| DELETE | `/api/universe/regions/:id` | Delete region | - | 204 |
| GET | `/api/universe/bridges` | List bridges | - | `{ bridges[] }` |
| GET | `/api/universe/bridges/:id` | Get bridge | - | `{ bridge }` |
| POST | `/api/universe/bridges` | Create bridge | `LightBridge` | `{ bridge }` |
| DELETE | `/api/universe/bridges/:id` | Delete bridge | - | 204 |
| POST | `/api/universe/discover` | Discover region | `{ sessionId, regionId }` | `{ revealed, fogState }` |
| GET | `/api/universe/sessions/:sessionId/region` | Get session region | - | `{ regionId, workbenchId }` |
| POST | `/api/universe/sessions/:sessionId/region` | Map session to region | `{ regionId }` | `{ success }` |
| DELETE | `/api/universe/sessions/:sessionId/region` | Unmap session | - | 204 |
| GET | `/api/universe/discovery/progress/:sessionId` | Discovery progress | - | `{ progress }` |
| POST | `/api/universe/discovery/record` | Record activity | `{ sessionId, activityType }` | `{ success }` |
| POST | `/api/universe/discovery/reveal/:regionId` | Force reveal region | `{ sessionId }` | `{ revealed }` |
| POST | `/api/universe/discovery/reveal-all` | Reveal all regions | `{ sessionId }` | `{ count }` |
| GET | `/api/universe/bridge-strength/:from/:to` | Get bridge strength | - | `{ strength, traces[] }` |
| GET | `/api/universe/bridge-strengths` | All bridge strengths | - | `{ strengths }` |

### 1.10 Additional Routes

**Terminal** (`/api/terminal`)
- POST `/:sessionId/output` - Submit terminal output
- GET `/:sessionId/buffer` - Get output buffer
- DELETE `/:sessionId/buffer` - Clear buffer

**History** (`/api/history`)
- GET `/dates` - List session dates
- GET `/sessions/:date` - Sessions by date
- GET `/session/:sessionId` - Historical session
- GET `/stats` - History statistics
- POST `/cleanup` - Trigger cleanup

**Users** (`/api/users`)
- GET `/` - List users
- GET `/:userId/sessions` - User sessions

**Dossiers** (`/api/dossiers`)
- POST `/` - Create dossier
- GET `/` - List dossiers
- GET `/:id` - Get dossier
- PUT `/:id` - Update dossier
- DELETE `/:id` - Delete dossier
- GET `/:id/history` - Dossier history
- POST `/:id/analyze` - Trigger analysis

**Reminders** (`/api/reminders`)
- GET `/definitions` - List definitions
- POST `/definitions` - Create definition
- DELETE `/definitions/:id` - Delete definition
- GET `/instances/:sessionId` - Session instances
- POST `/instances` - Create instance
- PATCH `/instances/:id` - Update instance
- DELETE `/instances/:id` - Delete instance
- POST `/instances/chain/:chainId/mark-addressed` - Mark addressed

**Errors** (`/api/errors`)
- GET `/:sessionId` - Get session errors
- POST `/` - Create error
- PATCH `/:id` - Update error
- DELETE `/:id` - Delete error
- DELETE `/chain/:chainId` - Delete chain errors

**Contracts** (`/api/contracts`)
- GET `/health` - Contract health
- POST `/health/refresh` - Refresh health

**Discovery** (`/api/discovery`)
- GET `/sessions` - List discovered sessions

**Patterns** (`/api/patterns`)
- GET `/:projectId` - Get patterns
- POST `/:projectId/analyze` - Analyze patterns
- POST `/bookmarks` - Create bookmark
- GET `/bookmarks/:projectId` - List bookmarks
- DELETE `/bookmarks/:bookmarkId` - Delete bookmark

**Agent Validator** (`/api/agent-validator`)
- POST `/validate` - Validate agent output
- GET `/health` - Validator health

**Routing** (`/api/routing`)
- POST `/resolve` - Resolve routing decision

**Story** (`/api/story`)
- GET `/chapters` - List chapters
- GET `/chapters/:id` - Get chapter
- POST `/continue` - Continue story
- GET `/stats` - Story stats

**Suggestions** (`/api/suggestions`)
- GET `/` - List suggestions
- GET `/:id` - Get suggestion
- POST `/` - Create suggestion
- DELETE `/:id` - Delete suggestion
- POST `/:id/promote` - Promote to entry

**Telemetry** (`/api/telemetry`)
- GET `/` - Query telemetry
- GET `/stats` - Telemetry stats

**Toolbar** (`/api/toolbar`)
- GET `/:projectId/config` - Get toolbar config
- PUT `/:projectId/config` - Update toolbar config
- POST `/:projectId/actions/:actionId/trigger` - Trigger toolbar action

**Lifecycle** (`/api/lifecycle`)
- GET `/policies` - Get lifecycle policies
- GET `/stats` - Lifecycle statistics
- GET `/events` - Lifecycle events
- GET `/:resourceType` - Resource lifecycle

**Session Windows** (`/api/session-windows`)
- GET `/` - List session windows
- GET `/:id/enriched` - Get enriched window
- POST `/:id/follow` - Follow session
- DELETE `/:id/follow` - Unfollow session
- PUT `/:id/config` - Update window config

---

## 2. WebSocket Event Inventory

### 2.1 WebSocket Connection

**Endpoint:** `ws://localhost:3001/ws`

**Client → Server Messages:**
```typescript
// Subscribe to session events
{ type: 'subscribe', sessionId: SessionId }

// Unsubscribe
{ type: 'unsubscribe', sessionId: SessionId }

// Send input
{ type: 'input', sessionId: SessionId, payload: string }

// Heartbeat
{ type: 'ping' }
```

**Server → Client Messages:**
```typescript
// Connection confirmation
{ type: 'subscription_confirmed', payload: { clientId, message } }

// Heartbeat response (auto every 20s)
{ type: 'pong' }

// Event broadcast (session-specific)
{ type: 'event', sessionId: SessionId, payload: WorkspaceEvent }

// Registry event (global)
{ type: 'registry-event', payload: RegistryChangedEvent }

// Error
{ type: 'error', payload: string }
```

### 2.2 Workspace Events (74 Types)

**Session Lifecycle:**
- `session:started` - Session created
- `session:ended` - Session completed
- `session:deleted` - Session removed
- `session:updated` - Session status changed

**Chain Lifecycle:**
- `chain:compiled` - Chain compiled from orchestrator
- `chain:started` - Chain execution began
- `chain:completed` - Chain finished
- `chain:spark_traveling` - Visual spark animation (Phase 4)
- `chain:gate_updated` - Gate checkpoint updated

**Step Lifecycle:**
- `step:spawned` - Step agent created
- `step:started` - Step execution began
- `step:completed` - Step finished successfully
- `step:failed` - Step encountered error
- `step:skipped` - Step bypassed

**User Interaction:**
- `interaction:awaiting-input` - Waiting for user response
- `interaction:input-received` - User input captured

**File System:**
- `file:created` - File created
- `file:modified` - File changed
- `file:deleted` - File removed

**Registry:**
- `registry:line-updated` - Registry file edited
- `registry:changed` - Registry entry modified (global)

**Terminal:**
- `terminal:output` - Terminal output captured
- `claude-cli:started` - Claude CLI session started
- `claude-cli:output` - Claude CLI output
- `claude-cli:exited` - Claude CLI terminated

**Chat:**
- `chat:message` - New chat message
- `chat:history` - Full conversation history

**Errors:**
- `error:occurred` - Error event
- `warning:occurred` - Warning event

**Session Windows:**
- `session:followed` - User followed session
- `session:unfollowed` - User unfollowed
- `quick-action:triggered` - Quick action used
- `flow:node-clicked` - Flow visualization interaction

**Patterns:**
- `pattern:detected` - Pattern recognized
- `frequency:updated` - Action frequency changed
- `bookmark:created` - Bookmark added

**Harmony:**
- `harmony:check` - Harmony validation run
- `harmony:violation` - Contract violation detected
- `harmony:metrics-updated` - Metrics refreshed
- `harmony:recommendation_ready` - Healing recommendation available
- `harmony:health_updated` - Health score updated
- `harmony:threshold_exceeded` - Critical threshold crossed

**Living Universe:**
- `universe:initialized` - Universe loaded
- `universe:region_discovered` - Region revealed
- `universe:evolution_tick` - Evolution cycle completed
- `universe:map_expanded` - New regions/bridges added

**Additional:**
- `execution:log-created` - Log file created

### 2.3 WebSocket Integration Pattern

**Frontend Hook (`useWebSocket.ts`):**
```typescript
const { status, subscribe, unsubscribe, send } = useWebSocket({
  url: 'ws://localhost:3001/ws',
  onEvent: (event: WorkspaceEvent) => {
    // Handle event
  },
  reconnectInterval: 3000,
  heartbeatInterval: 30000,
  pollingFallbackUrl: 'http://localhost:3001/api/events',
});

// Auto-fallback to HTTP polling after 3 consecutive failures
// Polls every 5s with rate limiting
```

**Features:**
- Auto-reconnect with exponential backoff
- Client heartbeat (ping every 25s)
- Server heartbeat (pong every 20s)
- HTTP polling fallback after 3 failures
- Session-based subscription filtering
- Type-safe event parsing

---

## 3. Data Contracts & Type Alignment

### 3.1 Shared Type System (`@afw/shared`)

**Branded Types (Type-Safe IDs):**
```typescript
type SessionId = string & { readonly __brand: 'SessionId' };
type ChainId = string & { readonly __brand: 'ChainId' };
type StepId = string & { readonly __brand: 'StepId' };
type StepNumber = number & { readonly __brand: 'StepNumber' };
type UserId = string & { readonly __brand: 'UserId' };
type Timestamp = string & { readonly __brand: 'Timestamp' };
type RegionId = string & { readonly __brand: 'RegionId' };
type EdgeId = string & { readonly __brand: 'EdgeId' };
type ProjectId = string & { readonly __brand: 'ProjectId' };
type DossierId = string & { readonly __brand: 'DossierId' };
```

**Factory Functions:**
```typescript
brandedTypes.sessionId(value: string): SessionId
brandedTypes.chainId(value: string): ChainId
brandedTypes.timestamp(value: string | Date): Timestamp
brandedTypes.currentTimestamp(): Timestamp
```

**Core Enums:**
```typescript
enum Status { PENDING, IN_PROGRESS, COMPLETED, FAILED, SKIPPED }
enum Model { HAIKU, SONNET, OPUS }
enum ChainSource { FLOW, COMPOSED, META_TASK }
```

### 3.2 Domain Models

**Session:**
```typescript
interface Session {
  id: SessionId;
  cwd: string;
  hostname?: string;
  platform?: string;
  user?: UserId;
  chains: ChainId[];
  status: StatusString;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  lastActivityAt: Timestamp;
  activityTtlExtensions: number;
  conversationState?: 'idle' | 'awaiting_input' | 'receiving_input' | 'active';
  lastPrompt?: {
    text: string;
    type: PromptTypeString;
    quickResponses?: string[];
    timestamp: Timestamp;
  };
  summary?: string;
  endReason?: string;
  metadata?: Record<string, unknown>;
}
```

**Chain:**
```typescript
interface Chain {
  id: ChainId;
  sessionId: SessionId;
  userId?: UserId;
  title: string;
  steps: ChainStep[];
  source: ChainSourceString;
  ref?: string;
  status: StatusString;
  compiledAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  duration?: DurationMs;
  currentStep?: StepNumber;
  successfulSteps?: number;
  failedSteps?: number;
  skippedSteps?: number;
  summary?: string;
  executionMode?: 'sequential' | 'parallel' | 'mixed';
  estimatedDuration?: DurationMs;
}
```

**ChainStep:**
```typescript
interface ChainStep {
  stepNumber: StepNumber;
  action: string;
  model: ModelString;
  inputs: Record<string, unknown>;
  waitsFor: StepNumber[];
  status: StatusString;
  description?: string;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  duration?: DurationMs;
  result?: unknown;
  error?: string;
  learning?: string;
}
```

**ChatMessage:**
```typescript
interface ChatMessage {
  id: string;
  sessionId: SessionId;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Timestamp;
  messageType: 'text' | 'chain_compilation' | 'step_spawn' | 'step_completion' | 'error';
  metadata?: {
    chainId?: ChainId;
    stepNumber?: StepNumber;
    action?: string;
    status?: StatusString;
  };
}
```

### 3.3 Contract System (Orchestrator Output Parsing)

**Supported Formats:**
```typescript
// Chain compilation table
interface ChainCompilationFormat {
  title?: string;
  steps: Array<{
    stepNumber: number;
    action: string;
    model?: string;
    inputs?: Record<string, unknown>;
    waitsFor?: number[];
  }>;
}

// Step execution
interface StepFormat {
  stepNumber: number;
  action: string;
  status?: 'spawned' | 'started' | 'completed' | 'failed';
  result?: unknown;
}

// Registry update
interface RegistryFormat {
  file: string;
  action: 'add' | 'remove' | 'update';
  lineContent: string;
}

// Human question
interface HumanFormat {
  question: string;
  context?: string;
  quickResponses?: string[];
}
```

**Parsers:**
- `chainParser.ts` - Extracts chain tables from markdown
- `stepParser.ts` - Parses step execution updates
- `registryParser.ts` - Detects registry edits
- `humanParser.ts` - Extracts human questions
- `actionParser.ts` - Identifies action types
- `statusParser.ts` - Parses status updates

**Validation:**
```typescript
import { validateChainFormat, validateStepFormat } from '@afw/shared/contract';

const result = validateChainFormat(rawText);
if (result.valid) {
  // Use result.parsed
} else {
  // Graceful degradation
}
```

### 3.4 Type Serialization Patterns

**REST API:**
- Request: JSON with branded types as strings
- Response: JSON with branded types as strings
- Validation: Zod schemas in `packages/backend/src/schemas/`

**WebSocket:**
- Message: JSON stringified
- Event: Discriminated union with `type` field
- Parsing: Type guards from `eventGuards`

**Storage:**
- Memory: Native TypeScript objects
- Redis: JSON.stringify → JSON.parse with type reconstruction
- File: JSON with ISO timestamps

---

## 4. Frontend Integration Patterns

### 4.1 Service Layer

**Project Service:**
```typescript
class ProjectService {
  private baseUrl = 'http://localhost:3001';

  async listProjects(): Promise<Project[]>
  async getProject(id: ProjectId): Promise<Project>
  async createProject(data: CreateProjectRequest): Promise<Project>
  async updateProject(id: ProjectId, data: UpdateProjectRequest): Promise<Project>
  async deleteProject(id: ProjectId): Promise<void>
  async detectProject(cwd: string): Promise<ProjectAutoDetectionResult>
}

export const projectService = new ProjectService();
```

**Claude CLI Service:**
```typescript
class ClaudeCliService {
  private baseUrl = 'http://localhost:3001';

  async startSession(params: StartSessionParams): Promise<ClaudeCliSession>
  async sendInput(sessionId: SessionId, input: string): Promise<void>
  async stopSession(sessionId: SessionId, signal?: string): Promise<void>
  async getStatus(sessionId: SessionId): Promise<SessionStatus>
  async listSessions(): Promise<ClaudeCliSession[]>
}

export const claudeCliService = new ClaudeCliService();
```

### 4.2 React Hooks

**WebSocket Hooks:**
```typescript
// Connect to WebSocket
const { status, subscribe, unsubscribe } = useWebSocket({
  url: 'ws://localhost:3001/ws',
  onEvent: handleEvent,
});

// Subscribe to session events (auto-cleanup on unmount)
const events = useEvents(sessionId, ['step:completed', 'chain:started']);

// Get latest event of specific type
const latestStep = useLatestEvent(sessionId, 'step:completed');

// Event statistics
const stats = useEventStats(sessionId);
// { total: 42, byType: { 'step:completed': 10, ... }, lastEventTime }
```

**State Management Hooks:**
```typescript
// Chain state tracking
const { chains, activeChain, getChain } = useChainState(sessionId);

// Session controls
const { pause, resume, cancel, retry } = useSessionControls(sessionId);

// Chat message history
const messages = useChatMessages(sessionId);

// File tree
const tree = useFileTree(sessionId, { depth: 3 });
```

**Project Hooks:**
```typescript
// List projects
const { projects, loading, error, refresh } = useProjects();

// Single project
const project = useProject(projectId);

// Discovered sessions
const sessions = useDiscoveredSessions();

// Attached sessions (dashboard-managed)
const attachedSessions = useAttachedSessions();
```

### 4.3 Context Providers

**WebSocket Context:**
```typescript
<WebSocketProvider url="ws://localhost:3001/ws">
  <App />
</WebSocketProvider>

// Consumer
const { status, subscribe, onEvent } = useWebSocketContext();
```

**Session Context:**
```typescript
<SessionProvider sessionId={sessionId}>
  <SessionPanel />
</SessionProvider>

// Consumer
const { session, updateSession, deleteSession } = useSessionContext();
```

### 4.4 Real-Time Event Flow

**1. Backend Event Emission:**
```typescript
// Backend route
await storage.addEvent(sessionId, event);
// → Storage layer
// → Redis pub/sub OR in-memory broadcast
// → WebSocket handler
clientRegistry.broadcastToSession(sessionId, JSON.stringify({
  type: 'event',
  sessionId,
  payload: event,
}));
```

**2. Frontend Reception:**
```typescript
// useWebSocket hook
ws.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'event' && data.payload) {
    onEvent(data.payload); // Type: WorkspaceEvent
  }
});
```

**3. State Update:**
```typescript
// Component
const { onEvent } = useWebSocketContext();

useEffect(() => {
  const unregister = onEvent((event) => {
    if (event.sessionId === sessionId) {
      // Update local state
      setEvents(prev => [...prev, event]);
    }
  });
  return () => unregister();
}, [sessionId]);
```

---

## 5. Integration Summary

### 5.1 Communication Layers

| Layer | Technology | Pattern | Type Safety |
|-------|-----------|---------|-------------|
| REST | Express + fetch | Request/Response | Zod schemas + TypeScript |
| WebSocket | ws + native WebSocket | Pub/Sub | Discriminated unions |
| Shared Types | @afw/shared | Branded types | Compile-time + runtime |
| Contract Parsing | Custom parsers | Text → JSON | Regex + validators |

### 5.2 State Synchronization

**Session Lifecycle:**
1. Frontend POST `/api/sessions` → Backend creates session
2. Backend broadcasts `session:started` event via WebSocket
3. All connected clients receive event and update session list

**Chain Execution:**
1. Orchestrator emits chain compilation text
2. Backend parses → POST `/api/events` with `chain:compiled`
3. Backend creates Chain domain object → storage
4. WebSocket broadcasts to subscribed clients
5. Frontend updates chain visualization

**File Changes:**
1. File watcher detects change
2. Backend POST `/api/events` with `file:modified`
3. WebSocket broadcasts to session subscribers
4. Frontend updates file tree + editor

### 5.3 Fallback Mechanisms

**WebSocket Failure:**
1. Connection fails 3 times
2. Frontend switches to HTTP polling mode
3. Polls `/api/events/poll/:sessionId` every 5s
4. Backend rate-limits (1 req/5s per client)
5. Automatic upgrade back to WebSocket when available

**Long Polling for Input:**
1. Hook calls GET `/api/sessions/:id/input?timeout=60000`
2. Backend polls storage every 500ms for 60s
3. Returns immediately when input available
4. Timeout returns `{ available: false, timedOut: true }`

### 5.4 Type Safety Verification

**Compile-Time:**
- Shared `@afw/shared` package
- Branded types prevent ID mixing
- Discriminated unions for events

**Runtime:**
- Zod schemas validate API requests
- Contract parsers validate orchestrator output
- WebSocket message validation

**Example:**
```typescript
// ✅ Compile-time safe
const sessionId = brandedTypes.sessionId('session-123');
const chainId = brandedTypes.chainId('chain-456');

// ❌ Compile error: Type 'ChainId' is not assignable to type 'SessionId'
await storage.getSession(chainId);

// ✅ Runtime validation
const result = wsMessageSchema.safeParse(rawMessage);
if (result.success) {
  // result.data is fully typed
}
```

---

## 6. Key Insights

### 6.1 Architecture Strengths

1. **Type Safety**: Branded types prevent ID confusion
2. **Event-Driven**: WebSocket + polling fallback ensures reliability
3. **Contract System**: Graceful degradation when parsing fails
4. **Separation of Concerns**: Clean REST for CRUD, WebSocket for events
5. **Resilience**: Circuit breakers, rate limiting, HTTP fallback

### 6.2 Integration Points

**Primary Boundaries:**
- `/api/*` - REST API (27 route families)
- `/ws` - WebSocket events (74 event types)
- `@afw/shared` - Shared types (100+ interfaces)

**Data Flow:**
- **Synchronous**: REST API → JSON response
- **Asynchronous**: WebSocket → Event broadcast
- **Fallback**: HTTP polling → JSON with timestamp

### 6.3 Type Alignment

**Perfect Alignment:**
- Session, Chain, ChainStep models
- WorkspaceEvent union (74 types)
- Branded types (SessionId, ChainId, etc.)
- Command types (pause, resume, etc.)

**Contract Parsing:**
- Orchestrator output → Parsed types
- Markdown tables → Chain objects
- Registry edits → RegistryChangedEvent
- Null-safe fields for graceful degradation

---

## Conclusion

The ActionFlows Dashboard implements a robust Frontend/Backend boundary with:

- **152+ REST endpoints** across 27 route families
- **74 WebSocket event types** for real-time updates
- **Type-safe contracts** via `@afw/shared` package
- **Resilient communication** with HTTP polling fallback
- **Clean separation** between CRUD (REST) and events (WebSocket)

All integration patterns are well-documented, type-safe, and production-ready.
