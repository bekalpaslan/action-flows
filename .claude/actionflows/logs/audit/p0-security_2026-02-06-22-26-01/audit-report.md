# P0 Security Audit Report

**Audit Type:** Security (P0 - Critical)
**Scope:** All packages -- packages/shared/src/, packages/backend/src/, packages/app/src/, packages/mcp-server/src/
**Date:** 2026-02-06
**Mode:** audit-only
**Overall Score:** 38/100

---

## Severity Distribution

| Severity | Count |
|----------|-------|
| CRITICAL | 7 |
| HIGH     | 3 |
| MEDIUM   | 2 |
| LOW      | 1 |
| **TOTAL** | **13** |

---

## Checklist Results

| # | Check | Result | Severity |
|---|-------|--------|----------|
| 1 | WebSocket Authentication | **FAIL** | CRITICAL |
| 2 | WebSocket Authorization | **FAIL** | CRITICAL |
| 3 | Input Validation on APIs | **FAIL** | CRITICAL |
| 4 | XSS Prevention in React | **PASS** | -- |
| 5 | SQL/NoSQL Injection Prevention | **PASS** (N/A) | -- |
| 6 | CORS Configuration | **FAIL** | CRITICAL |
| 7 | Rate Limiting | **FAIL** | CRITICAL |
| 8 | Sensitive Data Exposure | **FAIL** | HIGH |
| 9 | Electron Security | **PASS** | -- |
| 10 | Command Injection Prevention | **PASS** | -- |
| 11 | Electron Preload Security | **PASS** | -- |
| 12 | WebSocket Message Validation | **FAIL** | CRITICAL |

---

## Detailed Findings

---

### Finding 1: WebSocket Authentication -- FAIL (CRITICAL)

**Checklist Item #1:** All WebSocket connections require valid JWT token in handshake. Token verified on every message. Unauthenticated connections rejected.

**Evidence:**

- `packages/backend/src/index.ts:70` -- WebSocket connection handler accepts ALL connections with zero authentication:
  ```typescript
  wss.on('connection', (ws, request) => {
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[WS] Client connected: ${clientId}`);
    wsConnectedClients.add(ws);
    handleWebSocket(ws, clientId, storage);
  });
  ```
- `packages/backend/src/ws/handler.ts:27-31` -- `handleWebSocket` accepts any connection with no token verification.
- No JWT library (`jsonwebtoken`) is present anywhere in the codebase.
- No authentication middleware exists on the upgrade path (`packages/backend/src/index.ts:59-67`).

**Impact:** Any network client can connect to the WebSocket server and subscribe to any session, receiving all real-time events including session data, step execution details, terminal output, and file changes.

**Remediation:**
1. Add JWT verification in the WebSocket upgrade handler before calling `handleUpgrade`.
2. Verify token on every incoming message or use a session-based auth model.
3. Reject connections without valid credentials with HTTP 401 before completing the upgrade.

---

### Finding 2: WebSocket Authorization -- FAIL (CRITICAL)

**Checklist Item #2:** WebSocket handlers verify user has permission for SessionId/ChainId before broadcasting events. Users can only access their own sessions.

**Evidence:**

- `packages/backend/src/index.ts:100-104` -- `broadcastFileEvent` sends to ALL connected clients with no session filtering:
  ```typescript
  wsConnectedClients.forEach((client) => {
    if (client.readyState === 1) { // 1 = OPEN
      client.send(message);
    }
  });
  ```
- `packages/backend/src/index.ts:118-122` -- `broadcastTerminalEvent` has the identical problem -- sends to ALL clients.
- `packages/backend/src/index.ts:143-148` -- Redis pub/sub broadcast sends to ALL connected clients without checking subscription.
- `packages/backend/src/ws/handler.ts:49` -- While clients send `subscribe` messages, the `subscribedSessionId` variable is tracked locally in the handler scope but is **never used for filtering outgoing broadcasts**. The broadcast functions in `index.ts` iterate over `wsConnectedClients` (a raw `Set<any>`) with no session awareness.

**Impact:** Every connected WebSocket client receives ALL events from ALL sessions. A user monitoring session A will also receive every event from sessions B, C, D, etc. This is an information leak across users/sessions.

**Remediation:**
1. Replace `wsConnectedClients: Set<any>` with a `Map<WebSocket, SessionId[]>` that tracks which sessions each client is subscribed to.
2. In broadcast functions, filter clients to only those subscribed to the relevant session.
3. Implement server-side subscription enforcement -- do not rely on client-side filtering alone.

---

### Finding 3: Input Validation on APIs -- FAIL (CRITICAL)

**Checklist Item #3:** All POST/PUT endpoints validate request body against schema. Invalid input returns 400 with clear error. No unvalidated data reaches business logic.

**Evidence:**

Endpoints with missing or incomplete validation:

1. **`POST /api/sessions`** (`packages/backend/src/routes/sessions.ts:14-54`):
   - Only validates `cwd` is present. No validation on `hostname`, `platform`, `userId` types or lengths.
   - `userId` is used directly: `brandedTypes.userId(userId)` but the branded type factory only checks for empty string, not format/length/injection.
   - `cwd` is used directly with `startWatching(session.id, cwd)` (line 39) -- a user-supplied path is passed directly to `chokidar.watch()`, potentially watching any directory on the filesystem.

2. **`PUT /api/sessions/:id`** (`packages/backend/src/routes/sessions.ts:123-176`):
   - `status`, `summary`, `endReason` are accepted from request body with zero validation.
   - Any arbitrary string can be set as session status (not validated against enum).

3. **`POST /api/sessions/:id/input`** (`packages/backend/src/routes/sessions.ts:214-250`):
   - `input` and `prompt` fields accepted without type validation or sanitization.

4. **`POST /api/sessions/:id/awaiting`** (`packages/backend/src/routes/sessions.ts:256-297`):
   - `promptType`, `promptText`, `quickResponses` accepted without schema validation.

5. **`POST /api/events`** (`packages/backend/src/routes/events.ts:12-56`):
   - Validates only 3 fields exist (`sessionId`, `type`, `timestamp`) but does not validate `type` against the known event type enum.
   - The entire `event` body is stored as-is, including arbitrary fields.

6. **`POST /api/terminal/:sessionId/output`** (`packages/backend/src/routes/terminal.ts:23-71`):
   - Validates `output` and `stream` exist and `stream` is stdout/stderr but no length limit on `output` field. Unbounded output could cause memory exhaustion.

7. **`POST /api/commands/:id/commands`** (`packages/backend/src/routes/commands.ts:12-60`):
   - Validates `type` against allowed list (good), but `payload` is accepted without validation.

8. **`POST /:commandId/ack`** (`packages/backend/src/routes/commands.ts:89-108`):
   - `result` and `error` from request body are only logged, no validation.

9. **`express.json()`** (`packages/backend/src/index.ts:30`):
   - No body size limit configured. Express default is 100KB but this should be explicitly set.

**Impact:** Malformed, oversized, or malicious payloads can be stored in memory/Redis. Arbitrary filesystem paths can be monitored. No schema enforcement means business logic operates on untrusted data.

**Remediation:**
1. Install a validation library (zod, joi, or express-validator).
2. Create request schemas for every POST/PUT endpoint.
3. Validate `cwd` against an allowed directory whitelist or at minimum validate it is an absolute path.
4. Add `express.json({ limit: '1mb' })` to prevent oversized payloads.
5. Validate event `type` against the `WorkspaceEvent` discriminated union.
6. Add length limits to string fields (e.g., `output` in terminal endpoint).

---

### Finding 4: XSS Prevention in React -- PASS

**Checklist Item #4:** No use of `dangerouslySetInnerHTML` with user content. All user-rendered values escaped/sanitized.

**Evidence:**

- **No `dangerouslySetInnerHTML` usage found** anywhere in `packages/app/src/`.
- `innerHTML = ''` usage at `packages/app/src/components/Terminal/TerminalTabs.tsx:134,165` is used only to clear a container element before mounting an xterm.js terminal instance. The value is always an empty string literal, not user content.
- All user-visible data in React components uses JSX text content (`{step.description}`, `{msg.content}`, etc.) which React auto-escapes.
- `StepInspector.tsx` renders step data via `{formatValue(value)}` and `{JSON.stringify(value)}` inside JSX text nodes -- both safely escaped by React.
- `ConversationPanel.tsx:118` renders `{msg.content}` in a div -- React escapes this.
- No `eval()`, `Function()`, or dynamic script injection patterns found.
- No `require()` calls in the renderer process (`packages/app/src/`).

**Impact:** N/A -- no XSS vectors found.

---

### Finding 5: SQL/NoSQL Injection Prevention -- PASS (Not Applicable)

**Checklist Item #5:** No string interpolation in database queries. Parameterized queries/prepared statements used.

**Evidence:**

- The application uses in-memory Maps (`packages/backend/src/storage/memory.ts`) and Redis (`packages/backend/src/storage/redis.ts`) for storage.
- No SQL or NoSQL database (MongoDB, etc.) is used.
- Redis key construction in `packages/backend/src/storage/redis.ts` uses string concatenation with a prefix:
  ```typescript
  const key = `${keyPrefix}sessions:${sessionId}`;
  ```
  This is safe because Redis key names do not support injection in the same way SQL does. However, user-controlled `sessionId` values should be validated for format to prevent key pollution.

**Impact:** N/A -- no database query language is used.

---

### Finding 6: CORS Configuration -- FAIL (CRITICAL)

**Checklist Item #6:** CORS headers whitelist specific origins. `Access-Control-Allow-Credentials` not set to true unless intentional.

**Evidence:**

- `packages/backend/src/index.ts:26-29`:
  ```typescript
  app.use(cors({
    origin: '*', // Allow all origins for Electron app
    credentials: true,
  }));
  ```
- **`origin: '*'` combined with `credentials: true`** is a dangerous combination. While browsers technically reject this combination (when `credentials: true`, `Access-Control-Allow-Origin` cannot be `*`), the `cors` npm package handles this by reflecting the request's `Origin` header back, effectively allowing any origin with credentials.
- `packages/backend/src/__tests__/helpers.ts:37-39` replicates the same configuration.

**Impact:** Any website can make credentialed cross-origin requests to the backend. If authentication is ever added, this would allow CSRF attacks. Even without authentication, any website opened in the user's browser can interact with the local backend API, potentially creating sessions, queuing commands, or reading session data.

**Remediation:**
1. Replace `origin: '*'` with a whitelist: `origin: ['http://localhost:5173', 'http://localhost:3001']`.
2. Either remove `credentials: true` or properly whitelist origins.
3. In production/Electron builds, restrict CORS to Electron's file:// origin or the packaged app's URL.

---

### Finding 7: Rate Limiting -- FAIL (CRITICAL)

**Checklist Item #7:** API endpoints have rate limiting per IP/user. WebSocket event handlers limit message frequency.

**Evidence:**

- **No rate limiting middleware** exists anywhere in the codebase.
- Searched for `rateLimit`, `rate-limit`, `throttle`, `limiter` across all packages -- zero results.
- No `express-rate-limit`, `rate-limiter-flexible`, or similar packages.
- `packages/backend/src/index.ts` -- no rate limiting middleware in the middleware chain.
- WebSocket handler (`packages/backend/src/ws/handler.ts`) processes every incoming message with no frequency limit.
- Terminal output endpoint (`packages/backend/src/routes/terminal.ts:23`) can be called at unlimited frequency, pushing data into unbounded memory buffers.
- Event POST endpoint (`packages/backend/src/routes/events.ts:12`) has no rate limit.
- The long-polling endpoint (`packages/backend/src/routes/sessions.ts:304-396`) accepts a user-supplied `timeout` value with no maximum cap -- a client could set `timeout=999999999` to hold a connection open indefinitely.

**Impact:** An attacker can flood the API with requests, exhausting server memory (especially event storage and terminal buffers). WebSocket message flooding can overwhelm the server. The uncapped long-polling timeout can be used for connection exhaustion (Slowloris-style attack).

**Remediation:**
1. Install `express-rate-limit` and apply per-route limits.
2. Add WebSocket message rate limiting (e.g., max 100 messages/second per client).
3. Cap the long-polling `timeout` parameter: `const timeout = Math.min(parseInt(req.query.timeout as string) || 0, 60000);`
4. Add connection limits to the WebSocket server.

---

### Finding 8: Sensitive Data Exposure -- FAIL (HIGH)

**Checklist Item #8:** No credentials/tokens logged in info/debug logs. Passwords not included in error responses. Sensitive fields excluded from API responses.

**Evidence:**

1. **Error messages expose internal details** -- Multiple routes return `error.message` in responses:
   - `packages/backend/src/routes/commands.ts:56`: `message: error instanceof Error ? error.message : 'Unknown error'`
   - `packages/backend/src/routes/sessions.ts:50,80,115,170` -- same pattern across all handlers.
   - `packages/backend/src/routes/events.ts:51,82,121` -- same pattern.
   - `packages/backend/src/routes/files.ts:67,185,242,298,355` -- same pattern.
   These could expose internal paths, stack traces, or Redis connection details in error scenarios.

2. **Session `cwd` exposed in API responses** -- `packages/backend/src/routes/sessions.ts:72`:
   ```typescript
   sessions: sessions.map((s) => ({
     id: s.id,
     status: s.status,
     cwd: s.cwd, // Exposes filesystem paths
   ```
   The `cwd` field reveals full filesystem paths of monitored directories, which could aid path traversal attacks.

3. **Full file content returned without filtering** -- `packages/backend/src/routes/files.ts:221-230`:
   ```typescript
   const content = await fs.readFile(absolutePath, 'utf-8');
   res.json({
     content, // Full file content, potentially sensitive
   ```
   While the path traversal protection exists, it trusts the session's `cwd` which is user-supplied.

4. **WebSocket input data logged** -- `packages/backend/src/ws/handler.ts:73`:
   ```typescript
   console.log(`[WS] Input received for session ${message.sessionId}:`, message.payload);
   ```
   User input is logged verbatim, which could include sensitive data.

5. **No credentials in code** -- No hardcoded passwords, API keys, or tokens found. Redis URL comes from environment variables. This is good.

**Impact:** Internal error messages and filesystem paths are exposed to clients. User input is logged without sanitization.

**Remediation:**
1. Return generic error messages to clients; log detailed errors server-side only.
2. Sanitize or omit `cwd` from list API responses.
3. Redact or mask user input in logs.
4. Add a `NODE_ENV` check to suppress detailed errors in production.

---

### Finding 9: Electron Security -- PASS

**Checklist Item #9:** `nodeIntegration` disabled. `contextIsolation` enabled. Preload scripts use secure APIs only. No `require()` of arbitrary modules in renderer.

**Evidence:**

- `packages/app/electron/main.ts:56-62`:
  ```typescript
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    nodeIntegration: false,
    contextIsolation: true,
    enableRemoteModule: false,
    sandbox: true,
  },
  ```
  All four critical security flags are correctly configured:
  - `nodeIntegration: false` -- prevents renderer from accessing Node.js APIs directly.
  - `contextIsolation: true` -- prevents prototype pollution attacks on preload.
  - `enableRemoteModule: false` -- disables deprecated remote module.
  - `sandbox: true` -- enables Chromium sandbox for renderer process.

- No `require()` calls found in `packages/app/src/`.

**Impact:** N/A -- Electron security is properly configured.

---

### Finding 10: Command Injection Prevention -- PASS

**Checklist Item #10:** Step parameters not passed directly to shell/exec commands. Shell metacharacters not interpreted.

**Evidence:**

- No `exec()`, `spawn()`, `execFile()`, `execSync()`, or `spawnSync()` calls found in any of the four packages.
- No `child_process` imports found in `packages/backend/src/`, `packages/app/src/`, `packages/shared/src/`, or `packages/mcp-server/src/`.
- File operations use `fs/promises` API (read, write, stat, readdir) which do not invoke shell commands.
- The `chokidar.watch()` call in `packages/backend/src/services/fileWatcher.ts:84` receives a `cwd` parameter that could be user-supplied, but chokidar does not execute shell commands.

**Impact:** N/A -- no shell execution vectors found. However, the user-supplied `cwd` path passed to `chokidar.watch()` and `fs` operations (noted in Finding 3) represents a related filesystem access concern.

---

### Finding 11: Electron Preload Security -- PASS

**Checklist Item #11:** Preload scripts use contextBridge.exposeInMainWorld, no direct Node.js API exposure to renderer.

**Evidence:**

- `packages/app/electron/preload.ts:5-29`:
  ```typescript
  contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
      invoke: (channel: string, ...args: any[]) => {
        const validChannels = ['ping', 'show-notification']
        if (validChannels.includes(channel)) {
          return ipcRenderer.invoke(channel, ...args)
        }
        throw new Error(`Channel '${channel}' not allowed`)
      },
  ```
  - Uses `contextBridge.exposeInMainWorld` correctly.
  - All three exposed methods (`invoke`, `on`, `send`) have channel whitelists.
  - Only allowed channels: `ping`, `show-notification`, `update-available`, `close-app`.
  - Disallowed channels throw an error.
  - No direct Node.js APIs (fs, child_process, etc.) are exposed.

**Impact:** N/A -- Preload security is properly configured with channel whitelisting.

---

### Finding 12: WebSocket Message Validation -- FAIL (CRITICAL)

**Checklist Item #12:** All incoming WebSocket messages validated against expected schema before processing.

**Evidence:**

- `packages/backend/src/ws/handler.ts:42-87`:
  ```typescript
  ws.on('message', async (data: Buffer) => {
    try {
      const message: WSMessage = JSON.parse(data.toString('utf-8'));
      switch (message.type) {
        case 'subscribe':
          if (message.sessionId) {
            subscribedSessionId = message.sessionId;
            storage.addClient(clientId, message.sessionId as SessionId);
  ```
  Problems:
  1. **No schema validation** -- The parsed JSON is typed as `WSMessage` via TypeScript annotation only, which provides zero runtime validation. Any JSON object is accepted.
  2. **`message.sessionId` used without validation** -- The `sessionId` field is used directly with `as SessionId` type assertion (line 50), bypassing the branded type factory that would at least check for empty strings.
  3. **`message.payload` used without validation** -- In the `input` case (line 72), `message.payload` is passed directly to `storage.queueInput()` with no type checking:
     ```typescript
     await Promise.resolve(storage.queueInput(message.sessionId as SessionId, message.payload));
     ```
  4. **No message size limit** -- WebSocket messages have no size limit configured on the `ws` server.
  5. **Unknown message types silently logged** -- The `default` case at line 82 only logs a warning, allowing arbitrary message types to be sent without rejection.

**Impact:** Malicious clients can send arbitrary payloads through WebSocket messages, inject data into the input queue, subscribe to any session, and flood the server with large messages.

**Remediation:**
1. Add runtime schema validation (zod) for all incoming WebSocket messages.
2. Validate `sessionId` format before using it (use the branded type factory).
3. Validate `payload` structure for the `input` message type.
4. Configure `maxPayload` on the WebSocket server: `new WebSocketServer({ server, maxPayload: 1024 * 1024 })`.
5. Reject unknown message types with an error response.

---

## Additional Findings Beyond Checklist

---

### Finding 13: Unvalidated File System Path in Session Creation -- HIGH

**File:** `packages/backend/src/routes/sessions.ts:39`
**Severity:** HIGH

**Evidence:**
```typescript
const { cwd, hostname, platform, userId } = req.body;
// ...
await startWatching(session.id, cwd);
```

The `cwd` field from the request body is passed directly to `chokidar.watch()` (via `startWatching` in `packages/backend/src/services/fileWatcher.ts:84`). This allows a client to:
1. Monitor any directory on the filesystem (e.g., `/etc/`, `C:\Windows\System32\`)
2. Cause resource exhaustion by watching very large directory trees (e.g., `/`)
3. Read file listings from sensitive directories

While the files API has path traversal protection that validates paths against session `cwd`, the `cwd` itself is arbitrary. The file watcher will emit events revealing file paths for any directory.

**Remediation:**
1. Validate `cwd` against an allowed directory whitelist or require it to be within a specific root.
2. At minimum, verify the directory exists and the process has proper permissions.
3. Limit the depth of chokidar watching to prevent resource exhaustion.

---

### Finding 14: Unbounded Memory Growth in MemoryStorage -- MEDIUM

**File:** `packages/backend/src/storage/memory.ts`
**Severity:** MEDIUM

**Evidence:**
- Events array: `packages/backend/src/storage/memory.ts:93-96` -- Events are pushed without any limit.
- Chains array: `packages/backend/src/storage/memory.ts:114-117` -- Same pattern.
- Sessions Map: Never cleaned up for completed sessions.

Only `terminalBuffer` has a limit (50,000 lines per session at `packages/backend/src/services/terminalBuffer.ts:18`).

**Impact:** Over time, memory usage grows unboundedly until the process is killed by the OS.

**Remediation:** Add maximum event/chain counts per session and implement eviction of old sessions.

---

### Finding 15: WebSocket Broadcast Sends All Events to All Clients -- HIGH

**File:** `packages/backend/src/index.ts:90-123`
**Severity:** HIGH

This finding overlaps with Finding 2 but addresses a specific implementation detail. The broadcast functions (`broadcastFileEvent`, `broadcastTerminalEvent`, and the Redis pub/sub handler) iterate over `wsConnectedClients` and send to every client with `readyState === OPEN`. The subscription mechanism in the WebSocket handler (`ws/handler.ts`) tracks `subscribedSessionId` but this information is never used by the broadcast logic, which operates on a flat `Set<any>` with no session metadata.

**Remediation:** The `wsConnectedClients` set should be replaced with a structure that maps clients to their subscribed sessions, and all broadcast functions should filter accordingly.

---

## Summary

The application has strong security in its Electron configuration and avoids XSS in its React components. However, it has **critical** gaps in:

1. **No authentication or authorization** on any API endpoint or WebSocket connection
2. **No rate limiting** on any endpoint
3. **Overly permissive CORS** (`origin: '*'` with `credentials: true`)
4. **No input validation** (no schema validation library, no runtime type checking)
5. **WebSocket messages processed without validation**
6. **All WebSocket events broadcast to all clients** regardless of subscription

These issues are expected for an early-stage internal monitoring tool but must be addressed before any deployment outside a trusted local development environment.

---

## Notification

Notification skipped -- not configured.

---

## Files Scanned

### packages/backend/src/ (18 files)
- index.ts, types.ts
- routes/commands.ts, events.ts, files.ts, history.ts, sessions.ts, terminal.ts
- storage/index.ts, memory.ts, redis.ts, file-persistence.ts
- services/cleanup.ts, fileWatcher.ts, terminalBuffer.ts
- ws/handler.ts
- __tests__/helpers.ts, __tests__/integration.test.ts

### packages/app/src/ (60+ files)
- All .ts and .tsx files in components/, hooks/, contexts/, utils/
- electron/main.ts, electron/preload.ts

### packages/shared/src/ (5 files)
- types.ts, events.ts, commands.ts, models.ts, index.ts

### packages/mcp-server/src/ (1 file)
- index.ts
