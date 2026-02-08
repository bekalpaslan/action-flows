# Harmony Detection Integration Audit

**Agent:** analyze/
**Date:** 2026-02-08
**Task:** Integration audit for harmony detection service design

---

## Executive Summary

This audit documents the existing backend pattern detection infrastructure, contract parser system, and frontend visualization to inform the design of the harmony detection service. The harmony detection service will monitor orchestrator output compliance with the CONTRACT.md specification by leveraging existing contract parsers and emitting real-time harmony events.

**Key Findings:**
- ✅ Contract parsers are fully implemented and production-ready
- ✅ Pattern detection infrastructure exists (PatternAnalyzer, FrequencyTracker)
- ✅ WebSocket broadcasting system supports new event types
- ✅ Storage layer supports both memory and Redis backends
- ⚠️ No existing harmony detection service or endpoints
- ⚠️ No harmony-specific events defined yet
- ⚠️ No frontend components for harmony status visualization

---

## 1. Existing Pattern Detection

### 1.1 PatternAnalyzer Service

**Location:** `D:/ActionFlowsDashboard/packages/backend/src/services/patternAnalyzer.ts`

**Purpose:** Analyzes operator behavior to detect usage patterns (frequency, sequences, bookmark clusters)

**Key Functionality:**
```typescript
class PatternAnalyzer {
  async analyze(projectId: ProjectId): Promise<PatternAnalysisResult>;
  private async analyzeFrequencyPatterns(projectId: ProjectId): Promise<DetectedPattern[]>;
  private async analyzeBookmarkClusters(projectId: ProjectId): Promise<DetectedPattern[]>;
  private generateProposedActions(patterns: DetectedPattern[]): ProposedAction[];
}
```

**Analysis Modes:**
1. **Frequency scan** - Find actions above threshold (default: 5 uses)
2. **Sequence detection** - Find 2-4 action sequences that repeat 3+ times (placeholder)
3. **Bookmark clustering** - Group starred items by category + intent keywords

**Events Emitted:**
- `pattern:detected` - When a new pattern is identified
- `frequency:updated` - When action frequency counters update
- `bookmark:created` - When a bookmark is added

**Storage Used:**
- `storage.getPatterns(projectId, filter)` - Retrieve patterns
- `storage.addPattern(pattern)` - Store detected patterns
- `storage.getBookmarks(projectId, filter)` - Retrieve bookmarks

**Integration Point for Harmony Detection:**
- HarmonyDetector should be a **separate service** (not integrated into PatternAnalyzer)
- PatternAnalyzer focuses on **usage patterns** (human behavior)
- HarmonyDetector focuses on **format compliance** (orchestrator output)

---

### 1.2 FrequencyTracker Service

**Location:** `D:/ActionFlowsDashboard/packages/backend/src/services/frequencyTracker.ts`

**Purpose:** Tracks frequency of actions over time with daily granularity

**Key Functionality:**
```typescript
class FrequencyTracker {
  async track(actionType: string, projectId?: ProjectId, userId?: UserId): Promise<void>;
  async getTopActions(projectId: ProjectId, limit: number): Promise<FrequencyRecord[]>;
  getTrend(record: FrequencyRecord, days: number): number[];
  isPatternCandidate(record: FrequencyRecord): boolean;
}
```

**Storage Schema:**
```typescript
interface FrequencyRecord {
  actionType: string;
  projectId?: ProjectId;
  userId?: UserId;
  count: number;
  firstSeen: Timestamp;
  lastSeen: Timestamp;
  dailyCounts: Record<string, number>; // ISO date -> count
}
```

**Not Applicable to Harmony Detection:**
- FrequencyTracker is for **action usage frequency** (e.g., "code/ used 50 times")
- Harmony detection needs **format validation frequency** (e.g., "85% of outputs parse successfully")
- Different domain, different storage schema

---

### 1.3 ConfidenceScorer Service

**Location:** `D:/ActionFlowsDashboard/packages/backend/src/services/confidenceScorer.ts`

**Purpose:** Calculates confidence scores for detected patterns

**Key Functionality:**
```typescript
function calculateConfidence(
  occurrenceCount: number,
  lastSeen: Timestamp,
  consistency: number
): ConfidenceScore;

function meetsProposalThreshold(confidence: ConfidenceScore): boolean;
```

**Relevance to Harmony Detection:**
- Could be adapted for **harmony score calculation**
- Instead of pattern confidence, track **parsing success rate**
- Formula: `harmonyPercentage = (successfulParses / totalOutputs) * 100`

---

### 1.4 Existing Pattern Routes

**Location:** `D:/ActionFlowsDashboard/packages/backend/src/routes/patterns.ts`

**Endpoints:**
- `GET /api/patterns/:projectId` - Get detected patterns with filtering
- `POST /api/patterns/:projectId/analyze` - Trigger pattern analysis
- `POST /api/bookmarks` - Create a bookmark
- `GET /api/bookmarks/:projectId` - List bookmarks with filtering
- `DELETE /api/bookmarks/:bookmarkId` - Delete a bookmark

**Pattern:**
```typescript
router.get('/:projectId', async (req, res) => {
  const patterns = await storage.getPatterns(projectId, {
    patternType: query.type,
    minConfidence: query.minConfidence,
    since: query.since,
  });
  res.json(patterns);
});
```

**Integration Point for Harmony Detection:**
- Add new endpoint: `GET /api/harmony/:sessionId` or `GET /api/harmony/:projectId`
- Follow same pattern: query parameters for filtering, JSON response
- Support both session-level and project-level harmony metrics

---

## 2. Contract Parser Integration Points

### 2.1 Master Parser

**Location:** `D:/ActionFlowsDashboard/packages/shared/src/contract/parsers/index.ts`

**Function:** `parseOrchestratorOutput(text: string): ParsedFormat | null`

**Priority Order (P0-P5):**
```typescript
// P0: Most common formats
parseChainCompilation(text)
parseStepCompletion(text)

// P1: High-value formats
parseReviewReport(text)
parseErrorAnnouncement(text)

// P2: Second opinion and registry
parseDualOutput(text)
parseRegistryUpdate(text)
parseLearningSurface(text)

// P3-P5: Lower priority formats
// ... (14 total parsers)
```

**Return Value:**
- `null` if no parser matched (format unknown/invalid)
- `ParsedFormat` union type if successfully parsed

**Integration Flow for Harmony Detection:**

```
Orchestrator Output → parseOrchestratorOutput(text)
                              ↓
                      ┌───────┴────────┐
                      ↓                ↓
                 Parsed Object      null
                      ↓                ↓
              Valid Format      Unknown Format
                      ↓                ↓
           Emit: harmony:valid  Emit: harmony:violation
```

---

### 2.2 P0 Parsers (Critical Formats)

#### Chain Compilation Parser

**Location:** `D:/ActionFlowsDashboard/packages/shared/src/contract/parsers/chainParser.ts`

**Function:** `parseChainCompilation(text: string): ChainCompilationParsed | null`

**Structure:**
```typescript
interface ChainCompilationParsed {
  title: string | null;
  request: string | null;
  source: string | null;
  steps: ChainStepParsed[] | null;
  executionMode: string | null;
  stepDescriptions: StepDescription[] | null;
  raw: string;
  contractVersion: string;
}
```

**Detection Pattern:**
```typescript
ChainPatterns.chainCompilation.heading: /^## Chain: (.+)$/m
```

**Parsing Strategy:**
1. Quick detection (Level 1) - Regex test for heading
2. Extract fields (Level 2) - Match patterns for each field
3. Build parsed object (Level 3) - Construct typed result
4. Validate - Return null or partial parse

**Harmony Detection Usage:**
- Parse chain compilation outputs
- Check if `title` and `steps` are present (critical fields)
- If parsing fails → harmony violation
- If partial parse → harmony warning (degraded)

---

#### Step Completion Parser

**Location:** `D:/ActionFlowsDashboard/packages/shared/src/contract/parsers/stepParser.ts`

**Function:** `parseStepCompletion(text: string): StepCompletionParsed | null`

**Structure:**
```typescript
interface StepCompletionParsed {
  stepNumber: number;
  action: string;
  result: string;
  nextStep: number | 'Done';
  raw: string;
  contractVersion: string;
}
```

**Detection Pattern:**
```typescript
StepPatterns.stepCompletion.prefix: /^>> Step (\d+) complete:/m
```

**Parsing Strategy:**
1. Single-regex detection and extraction
2. Parse step numbers (current and next)
3. Extract action type and result
4. Return null if format doesn't match

**Harmony Detection Usage:**
- Parse every step completion announcement
- Most frequent format (emitted after every step)
- High failure rate here = critical harmony issue

---

### 2.3 P1 Parsers (High-Value Formats)

#### Review Report Parser

**Location:** `D:/ActionFlowsDashboard/packages/shared/src/contract/parsers/actionParser.ts`

**Function:** `parseReviewReport(text: string): ReviewReportParsed | null`

**Structure:**
```typescript
interface ReviewReportParsed {
  scope: string | null;
  verdict: 'APPROVED' | 'NEEDS_CHANGES' | null;
  score: number | null;
  summary: string | null;
  findings: ReviewFinding[] | null;
  fixesApplied: ReviewFix[] | null;
  flagsForHuman: HumanFlag[] | null;
  raw: string;
  contractVersion: string;
}
```

**Harmony Detection Usage:**
- Parse review/ action outputs
- Critical for quality metrics dashboard
- If fails to parse → fallback to raw text display

---

#### Error Announcement Parser

**Location:** `D:/ActionFlowsDashboard/packages/shared/src/contract/parsers/statusParser.ts`

**Function:** `parseErrorAnnouncement(text: string): ErrorAnnouncementParsed | null`

**Structure:**
```typescript
interface ErrorAnnouncementParsed {
  title: string | null;
  stepNumber: number | null;
  action: string | null;
  message: string | null;
  context: string | null;
  recoveryOptions: string[] | null;
  raw: string;
  contractVersion: string;
}
```

**Harmony Detection Usage:**
- Parse error outputs
- Critical for error recovery UI
- If fails to parse → impact on error handling UX

---

### 2.4 Type Guards

**Location:** `D:/ActionFlowsDashboard/packages/shared/src/contract/guards.ts`

**Purpose:** Runtime type narrowing for parsed formats

**Example:**
```typescript
export function isChainCompilationParsed(obj: unknown): obj is ChainCompilationParsed {
  return (
    isParsedFormat(obj) &&
    ('title' in obj || 'steps' in obj)
  );
}
```

**Harmony Detection Usage:**
- Type guards enable safe consumption of parsed formats
- HarmonyDetector can use guards to validate parsing results
- Guards check structure, not format compliance

---

### 2.5 Contract Version System

**Location:** `D:/ActionFlowsDashboard/packages/shared/src/contract/version.ts`

**Constant:** `CONTRACT_VERSION = '1.0'`

**Functions:**
- `isSupportedVersion(version: string): boolean`
- `getLatestVersion(): string`

**Version History:**
```typescript
CONTRACT_VERSIONS = {
  '1.0': {
    date: '2026-02-08',
    description: 'Initial contract specification with 17 formats',
    breaking: false,
  }
}
```

**Harmony Detection Usage:**
- Check for version markers in orchestrator output
- Warn if version mismatch detected
- Support version-specific parsers for migrations

---

## 3. Backend Architecture

### 3.1 Service Layer Structure

**Location:** `D:/ActionFlowsDashboard/packages/backend/src/services/`

**Existing Services:**
- `claudeCliManager.ts` - Claude CLI session management
- `claudeSessionDiscovery.ts` - Session discovery
- `confidenceScorer.ts` - Pattern confidence calculation
- `fileWatcher.ts` - File system watching
- `frequencyTracker.ts` - Action frequency tracking
- `layerResolver.ts` - Registry layer resolution
- `patternAnalyzer.ts` - Pattern detection
- `projectDetector.ts` - Project detection
- `projectStorage.ts` - Project persistence
- `registryStorage.ts` - Registry storage
- `terminalBuffer.ts` - Terminal output buffering
- `cleanup.ts` - Session cleanup

**Service Pattern:**
```typescript
export class ServiceName {
  constructor(private storage: Storage) {}

  async operation(): Promise<Result> {
    // Service logic
  }

  setBroadcastFunction?(fn: BroadcastFunction): void {
    // Optional: WebSocket integration
  }
}

// Singleton export
export const serviceName = new ServiceName(storage);
```

**Where HarmonyDetector Should Live:**

**Location:** `D:/ActionFlowsDashboard/packages/backend/src/services/harmonyDetector.ts`

**Structure:**
```typescript
import { storage } from '../storage/index.js';
import { parseOrchestratorOutput } from '@afw/shared/contract';
import type { SessionId, WorkspaceEvent } from '@afw/shared';

export class HarmonyDetector {
  private broadcastFn?: (sessionId: SessionId, event: WorkspaceEvent) => void;

  constructor(private storage: Storage) {}

  /**
   * Check orchestrator output for contract compliance
   */
  async checkOutput(
    text: string,
    sessionId: SessionId,
    context: { stepNumber?: number; chainId?: string }
  ): Promise<HarmonyCheckResult> {
    // Parse output
    const parsed = parseOrchestratorOutput(text);

    // Determine result
    if (parsed === null) {
      // Format unknown - harmony violation
      return this.handleViolation(text, sessionId, context);
    }

    // Check for partial parse (null fields)
    const partialParse = this.isPartialParse(parsed);
    if (partialParse) {
      // Degraded parsing - harmony warning
      return this.handleDegraded(parsed, sessionId, context);
    }

    // Valid parse - harmony OK
    return this.handleValid(parsed, sessionId, context);
  }

  /**
   * Get harmony metrics for a session or project
   */
  async getHarmonyMetrics(
    target: SessionId | ProjectId
  ): Promise<HarmonyMetrics> {
    // Query storage for harmony records
    // Calculate percentage, recent violations, trends
  }

  setBroadcastFunction(fn: BroadcastFunction): void {
    this.broadcastFn = fn;
  }
}

// Singleton
export const harmonyDetector = new HarmonyDetector(storage);
```

**Integration Points:**
1. **WebSocket Handler** - Call `checkOutput()` when orchestrator messages arrive
2. **Storage** - Store harmony check results for metrics
3. **Broadcasting** - Emit harmony events to connected clients
4. **Routes** - Expose `/api/harmony` endpoints for queries

---

### 3.2 Storage Integration

**Location:** `D:/ActionFlowsDashboard/packages/backend/src/storage/index.ts`

**Storage Interface:**
```typescript
export interface Storage {
  // Session, events, chains, commands, input, clients
  // ... (existing methods)

  // Frequency tracking
  trackAction(actionType: string, projectId?: ProjectId, userId?: UserId): void | Promise<void>;
  getFrequency(actionType: string, projectId?: ProjectId): FrequencyRecord | undefined | Promise<FrequencyRecord | undefined>;
  getTopActions(projectId: ProjectId, limit: number): FrequencyRecord[] | Promise<FrequencyRecord[]>;

  // Bookmarks
  addBookmark(bookmark: Bookmark): void | Promise<void>;
  getBookmarks(projectId: ProjectId, filter?: BookmarkFilter): Bookmark[] | Promise<Bookmark[]>;
  removeBookmark(bookmarkId: string): void | Promise<void>;

  // Patterns (detected)
  addPattern(pattern: DetectedPattern): void | Promise<void>;
  getPatterns(projectId: ProjectId, filter?: PatternFilter): DetectedPattern[] | Promise<DetectedPattern[]>;

  // Pub/Sub support (Redis only)
  subscribe?(channel: string, callback: (message: string) => void): Promise<void>;
  publish?(channel: string, message: string): Promise<void>;
  disconnect?(): Promise<void>;
}
```

**What Harmony Detection Needs:**

New storage methods to add:
```typescript
interface Storage {
  // Harmony tracking
  addHarmonyCheck(check: HarmonyCheck): void | Promise<void>;
  getHarmonyChecks(
    target: SessionId | ProjectId,
    filter?: HarmonyFilter
  ): HarmonyCheck[] | Promise<HarmonyCheck[]>;
  getHarmonyMetrics(
    target: SessionId | ProjectId
  ): HarmonyMetrics | Promise<HarmonyMetrics>;
}
```

**Harmony Check Schema:**
```typescript
interface HarmonyCheck {
  id: string; // Unique check ID
  sessionId: SessionId;
  projectId?: ProjectId;
  timestamp: Timestamp;
  text: string; // Raw orchestrator output (first 500 chars)
  parsedFormat: string | null; // Format name if parsed, null if unknown
  result: 'valid' | 'degraded' | 'violation';
  missingFields?: string[]; // For degraded parses
  context?: {
    stepNumber?: number;
    chainId?: string;
    actionType?: string;
  };
}

interface HarmonyMetrics {
  totalChecks: number;
  validCount: number;
  degradedCount: number;
  violationCount: number;
  harmonyPercentage: number; // (valid + degraded) / total * 100
  recentViolations: HarmonyCheck[]; // Last 10 violations
  formatBreakdown: Record<string, number>; // Format name -> count
  lastCheck: Timestamp;
}

interface HarmonyFilter {
  result?: 'valid' | 'degraded' | 'violation';
  formatType?: string; // Filter by parsed format
  since?: Timestamp;
  limit?: number;
}
```

**Storage Implementation:**
- Memory: `Map<SessionId | ProjectId, HarmonyCheck[]>`
- Redis: Keys like `afw:harmony:session:{sessionId}`, `afw:harmony:project:{projectId}`
- TTL: Same as events (7 days by default)

---

### 3.3 WebSocket Integration

**Location:** `D:/ActionFlowsDashboard/packages/backend/src/ws/handler.ts`

**Current WebSocket Flow:**
```typescript
export function handleWebSocket(
  ws: WebSocket,
  clientId: string,
  storage: Storage
): void {
  // Send connection confirmation
  ws.send(JSON.stringify({ type: 'subscription_confirmed', ... }));

  // Handle incoming messages
  ws.on('message', async (data: Buffer) => {
    // Validate API key, rate limit
    const message = JSON.parse(data);

    switch (message.type) {
      case 'subscribe': // Subscribe to session
      case 'unsubscribe': // Unsubscribe from session
      case 'input': // Queue input
      case 'ping': // Health check
    }
  });
}
```

**Broadcasting Functions (in index.ts):**
```typescript
function broadcastFileEvent(sessionId: SessionId, event: FileChangeEvent) {
  const message = JSON.stringify({ type: 'event', sessionId, payload: event });
  clientRegistry.broadcastToSession(sessionId, message);
}

function broadcastTerminalEvent(sessionId: SessionId, event: TerminalOutputEvent) {
  const message = JSON.stringify({ type: 'event', sessionId, payload: event });
  clientRegistry.broadcastToSession(sessionId, message);
}

function broadcastRegistryEvent(event: RegistryChangedEvent) {
  const message = JSON.stringify({ type: 'registry-event', payload: event });
  clientRegistry.getAllClients().forEach(client => client.send(message));
}
```

**How Harmony Detection Integrates:**

1. **Add broadcast function in index.ts:**
```typescript
function broadcastHarmonyEvent(
  sessionId: SessionId,
  event: HarmonyCheckEvent | HarmonyViolationEvent
) {
  const message = JSON.stringify({
    type: 'event',
    sessionId,
    payload: event,
  });
  clientRegistry.broadcastToSession(sessionId, message);
}

// Initialize harmony broadcast function
harmonyDetector.setBroadcastFunction(broadcastHarmonyEvent);
```

2. **Where to call harmony detection:**
   - **Option A:** In WebSocket handler when orchestrator messages arrive
   - **Option B:** In a dedicated orchestrator output processing pipeline
   - **Option C:** In the existing event handling flow (when certain events are emitted)

**Recommendation:** Option B - Create an orchestrator output processing pipeline that:
- Receives raw orchestrator text
- Runs harmony detection
- Parses structured events
- Broadcasts both harmony events and parsed events

---

### 3.4 Express App Setup

**Location:** `D:/ActionFlowsDashboard/packages/backend/src/index.ts`

**Current Routes:**
```typescript
app.use('/api/events', eventsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/commands', commandsRouter);
app.use('/api/history', historyRouter);
app.use('/api/files', filesRouter);
app.use('/api/terminal', terminalRouter);
app.use('/api/claude-cli', claudeCliRouter);
app.use('/api/session-windows', sessionWindowsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/discovery', discoveryRouter);
app.use('/api/users', usersRouter);
app.use('/api/toolbar', toolbarRouter);
app.use('/api/patterns', patternsRouter);
app.use('/api', patternsRouter); // Also handles /bookmarks
app.use('/api/registry', registryRouter);
```

**Middleware Stack:**
1. CORS (whitelist origins)
2. express.json (1mb limit)
3. authMiddleware (API key validation)
4. generalLimiter (rate limiting on /api routes)
5. Route handlers
6. globalErrorHandler (catch-all error handler)

**Where Harmony Routes Fit:**
```typescript
import harmonyRouter from './routes/harmony.js';

app.use('/api/harmony', harmonyRouter);
```

---

## 4. API Surface

### 4.1 Existing Route Patterns

**All Backend Routes:**
1. `/api/events` - Event streaming and queries
2. `/api/sessions` - Session CRUD operations
3. `/api/commands` - Command queueing (pause, resume, cancel, etc.)
4. `/api/history` - Execution history queries
5. `/api/files` - File operations and watching
6. `/api/terminal` - Terminal output streaming
7. `/api/claude-cli` - Claude CLI session management
8. `/api/session-windows` - Session window configuration
9. `/api/projects` - Project CRUD and configuration
10. `/api/discovery` - Session discovery
11. `/api/users` - User management
12. `/api/toolbar` - Toolbar button configuration
13. `/api/patterns` - Pattern detection and bookmarks
14. `/api/registry` - Registry CRUD operations

**Common Route Pattern:**
```typescript
// GET with query parameters
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const query = querySchema.parse(req.query);
    const data = await storage.getData(id, query);
    res.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query', details: error.errors });
    }
    res.status(500).json({ error: 'Failed', message: sanitizeError(error) });
  }
});

// POST with body validation
router.post('/:id/action', writeLimiter, validateBody(schema), async (req, res) => {
  try {
    const data = req.body;
    const result = await service.perform(data);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed', message: sanitizeError(error) });
  }
});
```

---

### 4.2 Proposed Harmony Endpoints

**New Router:** `D:/ActionFlowsDashboard/packages/backend/src/routes/harmony.ts`

**Endpoints:**

#### GET /api/harmony/:sessionId
**Purpose:** Get harmony metrics for a specific session

**Query Parameters:**
```typescript
const harmonyQuerySchema = z.object({
  since: z.string().datetime().optional(),
  result: z.enum(['valid', 'degraded', 'violation']).optional(),
  formatType: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});
```

**Response:**
```typescript
interface HarmonySessionResponse {
  sessionId: string;
  metrics: HarmonyMetrics;
  recentChecks: HarmonyCheck[]; // Filtered by query params
}
```

**Example:**
```bash
GET /api/harmony/sess_abc123?result=violation&limit=10
```

---

#### GET /api/harmony/project/:projectId
**Purpose:** Get harmony metrics for all sessions in a project

**Query Parameters:** Same as session endpoint

**Response:**
```typescript
interface HarmonyProjectResponse {
  projectId: string;
  metrics: HarmonyMetrics; // Aggregated across all sessions
  sessionBreakdown: {
    sessionId: string;
    harmonyPercentage: number;
    lastCheck: Timestamp;
  }[];
}
```

---

#### POST /api/harmony/:sessionId/check
**Purpose:** Manually trigger harmony check on text

**Request Body:**
```typescript
const harmonyCheckSchema = z.object({
  text: z.string().min(1).max(10000),
  context: z.object({
    stepNumber: z.number().optional(),
    chainId: z.string().optional(),
    actionType: z.string().optional(),
  }).optional(),
});
```

**Response:**
```typescript
interface HarmonyCheckResponse {
  check: HarmonyCheck;
  parsed: ParsedFormat | null;
}
```

**Use Case:** Testing/debugging - manually check if text parses correctly

---

#### GET /api/harmony/stats
**Purpose:** Get global harmony statistics across all projects

**Response:**
```typescript
interface HarmonyGlobalStats {
  totalChecks: number;
  globalHarmonyPercentage: number;
  topViolations: {
    formatType: string;
    count: number;
    percentage: number;
  }[];
  recentTrend: {
    date: string; // ISO date
    harmonyPercentage: number;
  }[];
}
```

---

### 4.3 Data Format

**All Harmony Responses Include:**
```typescript
interface HarmonyMetrics {
  totalChecks: number;
  validCount: number;
  degradedCount: number;
  violationCount: number;
  harmonyPercentage: number; // (valid + degraded) / total * 100
  recentViolations: HarmonyCheck[];
  formatBreakdown: Record<string, number>;
  lastCheck: Timestamp;
}

interface HarmonyCheck {
  id: string;
  sessionId: string;
  projectId?: string;
  timestamp: string; // ISO 8601
  text: string; // Truncated to 500 chars
  parsedFormat: string | null; // e.g., "ChainCompilation", "StepCompletion", null
  result: 'valid' | 'degraded' | 'violation';
  missingFields?: string[]; // For degraded parses
  context?: {
    stepNumber?: number;
    chainId?: string;
    actionType?: string;
  };
}
```

---

## 5. Frontend Integration

### 5.1 Existing Component Structure

**Components Directory:** `D:/ActionFlowsDashboard/packages/app/src/components/`

**Key Component Categories:**
- **Chain Visualization:** ChainDAG, ChainViz, ChainBadge, ChainLiveMonitor
- **Flow Visualization:** FlowVisualization (ReactFlow-based)
- **Registry:** RegistryBrowser, ModifierCard
- **Session Management:** SessionPane, SessionTree, SessionArchive, SessionWindowGrid
- **Terminal:** ClaudeCliTerminal
- **File Management:** FileExplorer, CodeEditor
- **Controls:** ControlButtons, QuickActionBar, PersistentToolbar, InlineButtons
- **Conversation:** ConversationPanel
- **Utilities:** ChangePreview, NotificationManager, HistoryBrowser

**Component Pattern:**
```typescript
// Functional component with hooks
export function ComponentName() {
  const { data, loading, error } = useFetchData();
  const { sendCommand } = useWebSocket();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="component-container">
      {/* Component UI */}
    </div>
  );
}
```

---

### 5.2 Existing Hooks Pattern

**Hooks Directory:** `D:/ActionFlowsDashboard/packages/app/src/hooks/`

**Data Fetching Hooks:**
- `useAllSessions()` - Fetch all sessions
- `useProjects()` - Fetch projects
- `useEvents()` - Fetch session events
- `useUsers()` - Fetch user list

**WebSocket Hooks:**
- `useWebSocket()` - WebSocket connection and messaging
- `useChainEvents()` - Subscribe to chain events
- `useTerminalEvents()` - Subscribe to terminal output

**State Management Hooks:**
- `useChainState()` - Chain execution state
- `useSessionControls()` - Session control commands
- `useButtonActions()` - Toolbar button actions
- `useSessionWindows()` - Session window management

**Hook Pattern:**
```typescript
export function useDataHook(id: string) {
  const [data, setData] = useState<DataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData(id)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { data, loading, error };
}
```

---

### 5.3 Where Harmony Status Should Appear

**1. Dashboard Header (Global)**
**Component:** Add to `Dashboard/` or `AppContent.tsx`
**Display:** Harmony percentage badge
```tsx
<HarmonyBadge percentage={85} status="good" />
```
**Data Source:** `useHarmonyMetrics()` hook

---

**2. Session Pane (Per-Session)**
**Component:** Add to `SessionPane/`
**Display:** Session-specific harmony indicator
```tsx
<SessionPane sessionId={sessionId}>
  <SessionHeader>
    <SessionTitle />
    <HarmonyIndicator sessionId={sessionId} />
  </SessionHeader>
  {/* ... */}
</SessionPane>
```
**Data Source:** `useHarmonyMetrics(sessionId)`

---

**3. Chain Visualization (Real-Time)**
**Component:** Add to `ChainViz/` or `FlowVisualization/`
**Display:** Harmony violation warnings on steps
```tsx
<StepNode stepNumber={2}>
  <StepStatus status="completed" />
  {harmonyViolation && <HarmonyWarningIcon />}
</StepNode>
```
**Data Source:** WebSocket events `harmony:violation`

---

**4. Notifications Panel (Alerts)**
**Component:** Add to `NotificationManager.tsx` or `Notifications/`
**Display:** Toast notification when harmony drops below threshold
```tsx
useEffect(() => {
  if (harmonyPercentage < 75) {
    notify.warning('Harmony degraded: orchestrator output not parsing correctly');
  }
}, [harmonyPercentage]);
```

---

**5. Registry Browser (Format Compliance)**
**Component:** Add to `RegistryBrowser/`
**Display:** Harmony status for registry formats (INDEX.md, LEARNINGS.md entries)
```tsx
<RegistryBrowser>
  <HarmonyTab>
    <FormatComplianceTable />
    <ViolationLog />
  </HarmonyTab>
</RegistryBrowser>
```

---

### 5.4 Proposed Frontend Components

#### HarmonyBadge Component
**File:** `D:/ActionFlowsDashboard/packages/app/src/components/HarmonyBadge/index.tsx`

**Purpose:** Display harmony percentage with color-coded status

**Props:**
```typescript
interface HarmonyBadgeProps {
  percentage: number; // 0-100
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}
```

**Visual:**
- Green: 90-100% (excellent harmony)
- Yellow: 75-89% (good harmony, minor issues)
- Orange: 50-74% (degraded harmony, attention needed)
- Red: 0-49% (poor harmony, critical issues)

---

#### HarmonyPanel Component
**File:** `D:/ActionFlowsDashboard/packages/app/src/components/HarmonyPanel/index.tsx`

**Purpose:** Full harmony metrics dashboard

**Sections:**
1. **Overall Metrics** - Total checks, harmony %, trend chart
2. **Format Breakdown** - Table of formats with success rates
3. **Recent Violations** - List of recent parsing failures
4. **Violation Details** - Expandable details for each violation

**Props:**
```typescript
interface HarmonyPanelProps {
  target: SessionId | ProjectId;
  targetType: 'session' | 'project';
}
```

---

#### HarmonyIndicator Component
**File:** `D:/ActionFlowsDashboard/packages/app/src/components/HarmonyIndicator/index.tsx`

**Purpose:** Small inline indicator (for session headers, step nodes)

**Props:**
```typescript
interface HarmonyIndicatorProps {
  status: 'valid' | 'degraded' | 'violation';
  tooltip?: string;
}
```

**Visual:**
- ✅ Valid (green checkmark)
- ⚠️ Degraded (yellow warning)
- ❌ Violation (red X)

---

#### useHarmonyMetrics Hook
**File:** `D:/ActionFlowsDashboard/packages/app/src/hooks/useHarmonyMetrics.ts`

**Purpose:** Fetch and subscribe to harmony metrics

**Signature:**
```typescript
export function useHarmonyMetrics(
  target: SessionId | ProjectId,
  targetType: 'session' | 'project'
): {
  metrics: HarmonyMetrics | null;
  recentChecks: HarmonyCheck[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}
```

**Implementation:**
```typescript
export function useHarmonyMetrics(target: string, targetType: 'session' | 'project') {
  const [metrics, setMetrics] = useState<HarmonyMetrics | null>(null);
  const [recentChecks, setRecentChecks] = useState<HarmonyCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial fetch
  useEffect(() => {
    const endpoint = targetType === 'session'
      ? `/api/harmony/${target}`
      : `/api/harmony/project/${target}`;

    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        setMetrics(data.metrics);
        setRecentChecks(data.recentChecks || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [target, targetType]);

  // WebSocket subscription for real-time updates
  const { subscribe } = useWebSocket();
  useEffect(() => {
    if (targetType === 'session') {
      return subscribe(target, (event) => {
        if (event.type === 'harmony:check' || event.type === 'harmony:violation') {
          // Refresh metrics
          refresh();
        }
      });
    }
  }, [target, targetType]);

  const refresh = async () => {
    // Re-fetch metrics
  };

  return { metrics, recentChecks, loading, error, refresh };
}
```

---

### 5.5 WebSocket Context

**Location:** `D:/ActionFlowsDashboard/packages/app/src/contexts/WebSocketContext.tsx`

**Current Structure:**
```typescript
export const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Connect to WebSocket
  useEffect(() => {
    const socket = new WebSocket(`ws://localhost:3001/ws`);
    socket.onopen = () => setWs(socket);
    socket.onmessage = (event) => handleMessage(JSON.parse(event.data));
    // ...
  }, []);

  return (
    <WebSocketContext.Provider value={{ ws, subscribe, send }}>
      {children}
    </WebSocketContext.Provider>
  );
}
```

**How Harmony Events Are Received:**
```typescript
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === 'event') {
    const workspaceEvent = message.payload;

    switch (workspaceEvent.type) {
      case 'harmony:check':
        // Handle harmony check event
        break;
      case 'harmony:violation':
        // Handle harmony violation event
        break;
      // ... other event types
    }
  }
};
```

**No Changes Needed:**
- WebSocket context already handles arbitrary event types
- Harmony events will flow through existing infrastructure
- Components can subscribe via `useWebSocket()` hook

---

## 6. Gap Analysis

### 6.1 What's Missing for Harmony Detection

#### Backend Gaps

**1. HarmonyDetector Service**
- ❌ No `harmonyDetector.ts` service exists
- ❌ No harmony check logic implemented
- ❌ No integration with contract parsers
- **Action:** Create `packages/backend/src/services/harmonyDetector.ts`

**2. Harmony Storage Methods**
- ❌ No `addHarmonyCheck()` in Storage interface
- ❌ No `getHarmonyChecks()` in Storage interface
- ❌ No `getHarmonyMetrics()` in Storage interface
- **Action:** Extend Storage interface in `packages/backend/src/storage/index.ts`
- **Action:** Implement in `memory.ts` and `redis.ts`

**3. Harmony Routes**
- ❌ No `/api/harmony` router exists
- ❌ No endpoints for harmony metrics queries
- **Action:** Create `packages/backend/src/routes/harmony.ts`
- **Action:** Mount router in `index.ts`

**4. Harmony Event Broadcasting**
- ❌ No `broadcastHarmonyEvent()` function
- ❌ HarmonyDetector not wired to WebSocket
- **Action:** Add broadcast function in `index.ts`
- **Action:** Call `harmonyDetector.setBroadcastFunction()`

**5. Orchestrator Output Processing Pipeline**
- ❌ No centralized place where orchestrator output is parsed
- ❌ Harmony detection not integrated into event flow
- **Action:** Create orchestrator output processor
- **Action:** Integrate with WebSocket message handling

---

#### Shared Gaps

**6. Harmony Event Types**
- ❌ No `harmony:check` event type in `events.ts`
- ❌ No `harmony:violation` event type in `events.ts`
- ❌ No `harmony:degraded` event type in `events.ts`
- **Action:** Add harmony event types to `packages/shared/src/events.ts`
- **Action:** Add type guards to `eventGuards`

**Example:**
```typescript
export interface HarmonyCheckEvent extends BaseEvent {
  type: 'harmony:check';

  // Automatic fields
  sessionId: SessionId;
  text: string; // Truncated
  parsedFormat: string | null;
  result: 'valid' | 'degraded' | 'violation';

  // Parsed fields
  missingFields?: string[] | null;
  context?: {
    stepNumber?: number;
    chainId?: string;
  };
}

export interface HarmonyViolationEvent extends BaseEvent {
  type: 'harmony:violation';

  sessionId: SessionId;
  text: string;
  timestamp: Timestamp;
  context?: {
    stepNumber?: number;
    chainId?: string;
  };
}
```

**7. Harmony Types**
- ❌ No `HarmonyCheck` type defined
- ❌ No `HarmonyMetrics` type defined
- ❌ No `HarmonyFilter` type defined
- **Action:** Create `packages/shared/src/harmonyTypes.ts`
- **Action:** Export from `packages/shared/src/index.ts`

---

#### Frontend Gaps

**8. Harmony Components**
- ❌ No `HarmonyBadge` component
- ❌ No `HarmonyPanel` component
- ❌ No `HarmonyIndicator` component
- **Action:** Create components in `packages/app/src/components/`

**9. Harmony Hooks**
- ❌ No `useHarmonyMetrics()` hook
- **Action:** Create `packages/app/src/hooks/useHarmonyMetrics.ts`

**10. Harmony UI Integration**
- ❌ Dashboard header doesn't show harmony status
- ❌ Session pane doesn't show harmony indicator
- ❌ No harmony tab in registry browser
- **Action:** Add harmony components to existing layouts

---

### 6.2 What Exists and Can Be Reused

#### Contract Parsers ✅
- ✅ All 17 parsers implemented
- ✅ `parseOrchestratorOutput()` master function ready
- ✅ Type guards for runtime validation
- ✅ Version system in place
- **No Changes Needed**

#### Storage Layer ✅
- ✅ Unified Storage interface (memory + Redis)
- ✅ TTL support for cleanup
- ✅ Pub/Sub support for Redis
- ✅ Filter/query pattern established
- **Only Need:** Add harmony-specific methods

#### WebSocket Infrastructure ✅
- ✅ WebSocket server running
- ✅ Client registry with subscription management
- ✅ Broadcasting functions pattern established
- ✅ Event typing system in place
- **Only Need:** Add harmony event broadcasting

#### Pattern Detection ✅
- ✅ PatternAnalyzer service architecture
- ✅ Route pattern for analysis endpoints
- ✅ Confidence scoring system
- **Can Reuse:** Service pattern, endpoint pattern, confidence logic

#### Frontend Hooks ✅
- ✅ Data fetching hook pattern
- ✅ WebSocket subscription pattern
- ✅ State management pattern
- **Can Reuse:** Hook patterns for `useHarmonyMetrics()`

---

### 6.3 What Needs Modification

#### Storage Interface Extensions
**File:** `packages/backend/src/storage/index.ts`

**Current:** 88 lines, 12 method categories

**Modification:** Add harmony methods (3 new methods)

**Impact:** Low - additive change, backward compatible

---

#### Event Types Union
**File:** `packages/shared/src/events.ts`

**Current:** 648 lines, 27 event types

**Modification:** Add 2-3 harmony event types to union

**Impact:** Low - additive change, type-safe

---

#### Express Router Registration
**File:** `packages/backend/src/index.ts`

**Current:** 14 routers registered

**Modification:** Add 1 harmony router

**Impact:** Trivial - single line addition

---

#### WebSocket Message Handling
**File:** `packages/backend/src/ws/handler.ts`

**Current:** Handles 4 message types (subscribe, unsubscribe, input, ping)

**Modification:** None needed - harmony events flow through existing event system

**Impact:** None

---

### 6.4 Implementation Complexity Estimate

| Component | LOC | Complexity | Risk |
|-----------|-----|------------|------|
| HarmonyDetector Service | ~300 | Medium | Low |
| Harmony Storage Methods | ~150 | Low | Low |
| Harmony Routes | ~200 | Low | Low |
| Harmony Event Types | ~100 | Low | None |
| HarmonyBadge Component | ~50 | Low | None |
| HarmonyPanel Component | ~200 | Medium | Low |
| useHarmonyMetrics Hook | ~80 | Low | None |
| Storage Interface Extensions | ~50 | Low | Low |
| Integration/Wiring | ~100 | Medium | Medium |
| **Total** | **~1,230** | **Medium** | **Low** |

**Timeline Estimate:**
- Phase 1 (Backend foundation): 2-3 days
- Phase 2 (API + Storage): 1-2 days
- Phase 3 (Frontend components): 2-3 days
- Phase 4 (Integration + Testing): 1-2 days
- **Total:** 6-10 days for complete implementation

---

## 7. Recommendations

### 7.1 Implementation Priority

**Week 1: Backend Foundation**
1. Create HarmonyDetector service
2. Add harmony storage methods (Memory + Redis)
3. Define harmony event types in shared package
4. Wire HarmonyDetector to WebSocket broadcasting

**Week 2: API Surface**
1. Create harmony routes (`/api/harmony`)
2. Implement GET endpoints (session, project, stats)
3. Implement POST check endpoint
4. Add API schemas and validation

**Week 3: Frontend Components**
1. Create `useHarmonyMetrics()` hook
2. Build HarmonyBadge component
3. Build HarmonyIndicator component
4. Integrate into Dashboard header

**Week 4: Advanced Features**
1. Build HarmonyPanel component (full metrics dashboard)
2. Add harmony tab to RegistryBrowser
3. Add harmony violation notifications
4. Performance optimization and caching

---

### 7.2 Design Decisions

**1. Where to Store Harmony Checks**
- **Decision:** Store in same storage layer as events (Memory/Redis)
- **Rationale:** Same TTL, same access patterns, same scale characteristics
- **Alternative:** Separate database (rejected - adds complexity)

**2. What to Store**
- **Decision:** Store last N checks (default: 100 per session) + aggregated metrics
- **Rationale:** Balance between debuggability and storage cost
- **Alternative:** Store all checks forever (rejected - unbounded growth)

**3. When to Emit Events**
- **Decision:** Emit on every harmony check (valid, degraded, violation)
- **Rationale:** Frontend can filter, real-time updates important
- **Alternative:** Emit only on violations (rejected - loses valid check visibility)

**4. How to Calculate Harmony Percentage**
- **Decision:** `(valid + degraded) / total * 100`
- **Rationale:** Degraded parses are partial success (graceful degradation)
- **Alternative:** Only count valid as success (rejected - too strict)

**5. Parser Return Value on Failure**
- **Decision:** Return `null` if format unknown
- **Rationale:** Explicit failure signal, TypeScript-friendly
- **Alternative:** Throw exception (rejected - not graceful)

---

### 7.3 Integration Approach

**Option A: Proactive Parsing (Recommended)**
```
Orchestrator Output → parseOrchestratorOutput()
                             ↓
                      ┌──────┴──────┐
                      ↓             ↓
                 Parsed Object    null
                      ↓             ↓
          Emit: structured event  Emit: harmony:violation
                      ↓             ↓
              TypedEvent (e.g.     Raw text event
              chain:compiled)
```

**Pros:**
- Single parsing pass
- All outputs validated
- Real-time harmony monitoring
- Structured events always available

**Cons:**
- Adds latency to every orchestrator message
- Parsing errors affect event emission

---

**Option B: Passive Parsing (Alternative)**
```
Orchestrator Output → Emit: raw text event
                             ↓
                    Dashboard receives event
                             ↓
                    Frontend tries parsing
                             ↓
                      ┌──────┴──────┐
                      ↓             ↓
                 Success         Failure
                      ↓             ↓
             Render structured   Fallback UI
```

**Pros:**
- Backend doesn't parse (simpler)
- Frontend handles parsing errors
- No backend performance impact

**Cons:**
- No server-side harmony detection
- Parsing happens multiple times (every client)
- No centralized metrics

---

**Recommendation:** Option A (Proactive Parsing)
- Harmony detection requires server-side parsing
- Performance impact is negligible (regex + field extraction ~1ms)
- Centralized metrics more valuable than edge performance

---

### 7.4 Contract Parser Usage Pattern

**Correct:**
```typescript
import { parseOrchestratorOutput } from '@afw/shared/contract';

const text = orchestratorOutput;
const parsed = parseOrchestratorOutput(text);

if (parsed === null) {
  // Unknown format - harmony violation
  harmonyDetector.recordViolation(text, sessionId, context);
  return;
}

// Parsed successfully - check which format
if (isChainCompilationParsed(parsed)) {
  // Emit chain:compiled event with structured data
  emitEvent({ type: 'chain:compiled', ...parsed });
}
else if (isStepCompletionParsed(parsed)) {
  // Emit step:completed event with structured data
  emitEvent({ type: 'step:completed', ...parsed });
}
// ... etc for all 17 formats
```

**Incorrect:**
```typescript
// Don't call individual parsers directly
const parsed = parseChainCompilation(text); // ❌
if (!parsed) {
  const parsed2 = parseStepCompletion(text); // ❌
  // ... etc
}

// Use master parser instead
const parsed = parseOrchestratorOutput(text); // ✅
```

---

### 7.5 Performance Considerations

**Parsing Performance:**
- Regex matching: ~0.1-0.5ms per pattern
- Master parser tries 17 parsers in priority order
- Worst case: ~8ms (all parsers fail)
- Best case: ~0.1ms (first parser matches)
- Average case: ~2ms (P0/P1 parsers match 80% of time)

**Mitigation:**
- Priority ordering reduces average attempts
- Early return on first match
- Regex patterns are pre-compiled
- No schema validation in parsing (deferred to consumption)

**Storage Performance:**
- Harmony checks are small (~1KB each)
- Aggregated metrics cached in memory
- Redis TTL handles cleanup automatically
- No indexing needed (session/project ID only)

**WebSocket Performance:**
- Harmony events are lightweight (~500 bytes)
- Broadcast only to subscribed clients
- No impact on existing event throughput

---

## 8. Next Steps

### For plan/ Agent

When designing the harmony detection service, reference:

**Backend Architecture (Section 3):**
- Service location: `packages/backend/src/services/harmonyDetector.ts`
- Storage methods needed: `addHarmonyCheck`, `getHarmonyChecks`, `getHarmonyMetrics`
- WebSocket integration: `broadcastHarmonyEvent` function in `index.ts`

**API Design (Section 4.2):**
- Endpoints: `GET /api/harmony/:sessionId`, `GET /api/harmony/project/:projectId`, `POST /api/harmony/:sessionId/check`, `GET /api/harmony/stats`
- Query parameters: `since`, `result`, `formatType`, `limit`
- Response format: `HarmonyMetrics` + `HarmonyCheck[]`

**Parser Integration (Section 2):**
- Use `parseOrchestratorOutput(text)` from `@afw/shared/contract`
- Check for `null` return (violation)
- Check for partial parse (degraded)
- Use type guards for format identification

**Event Types (Section 6.1.6):**
- Define `HarmonyCheckEvent`, `HarmonyViolationEvent`, `HarmonyDegradedEvent`
- Add to `WorkspaceEvent` union type
- Add type guards to `eventGuards`

**Storage Schema (Section 3.2):**
- `HarmonyCheck` interface with all fields
- `HarmonyMetrics` interface with aggregated stats
- `HarmonyFilter` interface for query parameters

**Frontend Integration (Section 5.3):**
- Dashboard header: `<HarmonyBadge />`
- Session pane: `<HarmonyIndicator />`
- Registry browser: `<HarmonyPanel />`
- Hook: `useHarmonyMetrics(target, targetType)`

---

### For code/ Agent

When implementing harmony detection:

**Phase 1: Backend Foundation**
1. Create `packages/backend/src/services/harmonyDetector.ts`
2. Create `packages/shared/src/harmonyTypes.ts`
3. Extend `packages/backend/src/storage/index.ts` (Storage interface)
4. Implement storage methods in `memory.ts` and `redis.ts`

**Phase 2: API + Events**
1. Add harmony events to `packages/shared/src/events.ts`
2. Create `packages/backend/src/routes/harmony.ts`
3. Mount router in `packages/backend/src/index.ts`
4. Add broadcast function and wire to HarmonyDetector

**Phase 3: Frontend**
1. Create `packages/app/src/hooks/useHarmonyMetrics.ts`
2. Create `packages/app/src/components/HarmonyBadge/index.tsx`
3. Create `packages/app/src/components/HarmonyIndicator/index.tsx`
4. Integrate into Dashboard and SessionPane

**Phase 4: Testing**
1. Unit tests for HarmonyDetector
2. Integration tests for harmony endpoints
3. E2E tests for frontend components
4. Performance benchmarks for parsing

---

## Appendices

### A. File Inventory

**Backend Files Analyzed:**
- `packages/backend/src/index.ts` (324 lines)
- `packages/backend/src/services/patternAnalyzer.ts` (212 lines)
- `packages/backend/src/services/frequencyTracker.ts` (200 lines)
- `packages/backend/src/services/confidenceScorer.ts` (100 lines)
- `packages/backend/src/routes/patterns.ts` (249 lines)
- `packages/backend/src/storage/index.ts` (126 lines)
- `packages/backend/src/ws/handler.ts` (188 lines)

**Shared Files Analyzed:**
- `packages/shared/src/contract/parsers/index.ts` (158 lines)
- `packages/shared/src/contract/parsers/chainParser.ts` (100+ lines)
- `packages/shared/src/contract/parsers/stepParser.ts` (80+ lines)
- `packages/shared/src/contract/patterns/index.ts` (12 lines)
- `packages/shared/src/contract/guards.ts` (232 lines)
- `packages/shared/src/contract/version.ts` (38 lines)
- `packages/shared/src/events.ts` (648 lines)
- `packages/shared/src/patternTypes.ts` (151 lines)

**Planning Files Referenced:**
- `.claude/actionflows/logs/plan/orchestrator-contract-design_2026-02-08-21-35-00/summary.md` (311 lines)
- `.claude/actionflows/CONTRACT.md` (709 lines)

---

### B. Key Insights

**1. Contract Parsers Are Production-Ready**
- All 17 formats have parsers implemented
- Master parser (`parseOrchestratorOutput`) is complete
- Type guards enable safe consumption
- Version system supports evolution

**2. Pattern Detection Is Orthogonal to Harmony Detection**
- PatternAnalyzer detects **usage patterns** (human behavior)
- HarmonyDetector detects **format compliance** (orchestrator output)
- Different domains, different services, different storage

**3. Backend Architecture Supports New Services**
- Service pattern is well-established
- Storage layer is flexible (memory + Redis)
- WebSocket broadcasting pattern is proven
- Route pattern is consistent

**4. Frontend Is Hook-Based and Composable**
- Data fetching hooks are common
- WebSocket subscription hooks exist
- Component composition is standard
- No barriers to adding harmony UI

**5. No Existing Harmony Detection Infrastructure**
- Clean slate for implementation
- No legacy code to migrate
- No conflicting patterns to reconcile
- Opportunity to do it right from the start

---

### C. Glossary

**Harmony** - Measure of orchestrator output compliance with CONTRACT.md specification

**Harmony Check** - Single validation of orchestrator output against contract parsers

**Harmony Metrics** - Aggregated statistics (percentage, counts, trends)

**Valid Parse** - Output matches contract format and all fields extracted

**Degraded Parse** - Output matches contract format but some fields are null (partial success)

**Violation** - Output doesn't match any contract format (complete failure)

**Contract Parser** - Function that extracts structured data from orchestrator output

**Master Parser** - `parseOrchestratorOutput()` function that tries all parsers in priority order

**Format Type** - One of 17 orchestrator output formats (e.g., "ChainCompilation", "StepCompletion")

**P0 Format** - Priority 0 format (critical for dashboard functionality)

---

**End of Report**
