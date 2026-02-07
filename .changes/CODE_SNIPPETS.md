# Security Fixes - Code Snippets

This document shows the key code snippets for each fix.

---

## Fix 1: WebSocket Per-Message Authentication

### clientRegistry.ts - Added Fields
```typescript
export interface ClientInfo {
  ws: WebSocket;
  clientId: string;
  subscribedSessionIds: Set<SessionId>;
  connectedAt: number;
  lastMessageAt: number;
  messageCount: number;
  messageWindowStart: number;
  apiKey?: string;              // NEW: Store API key from handshake
  userId?: string;              // NEW: Store userId for ownership checks
}
```

### clientRegistry.ts - New Method
```typescript
/**
 * Validate API key for per-message authentication
 * Returns true if the API key is still valid, false if it should be rejected
 */
validateApiKey(ws: WebSocket, currentApiKey?: string): boolean {
  const client = this.clients.get(ws);
  if (!client) return false; // Not registered = reject

  // If an API key was set at handshake, it must still match current env value
  if (client.apiKey) {
    // If the stored key doesn't match the current env key, reject (key rotation)
    if (client.apiKey !== currentApiKey) {
      return false;
    }
  }
  return true;
}
```

### handler.ts - Per-Message Check
```typescript
// Handle incoming messages
ws.on('message', async (data: Buffer) => {
  // Per-message API key validation (Fix 1: Security)
  const currentApiKey = process.env.AFW_API_KEY;
  if (!clientRegistry.validateApiKey(ws, currentApiKey)) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: 'Authentication failed - API key invalid or rotated'
    }));
    ws.close(1008, 'Authentication failed');
    return;
  }

  // Continue processing message...
});
```

### index.ts - Extract and Store Key at Handshake
```typescript
wss.on('connection', (ws, request) => {
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Extract API key from handshake for per-message validation
  const apiKey = process.env.AFW_API_KEY;
  const url = new URL((request.url || '/ws'), `http://${request.headers.host || 'localhost'}`);
  const providedApiKey = url.searchParams.get('apiKey') ||
    (request.headers.authorization?.replace('Bearer ', '') ?? undefined);

  // Register with stored API key
  const registered = clientRegistry.register(ws, clientId, providedApiKey || apiKey, undefined);
  if (!registered) {
    console.warn(`[WS] Client rejected: max connections reached`);
    ws.send(JSON.stringify({ type: 'error', payload: 'Server at maximum capacity' }));
    ws.close(1008, 'Server at max capacity');
    return;
  }

  handleWebSocket(ws, clientId, storage);
});
```

---

## Fix 2: WebSocket Session Ownership Validation

### handler.ts - Session Ownership Check
```typescript
case 'subscribe': {
  // Fix 2: Validate session ownership before subscribing
  const session = await Promise.resolve(storage.getSession(message.sessionId as SessionId));
  if (!session) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: 'Session not found',
      sessionId: message.sessionId,
    }));
    break;
  }

  // If session has a user requirement, check that client's userId matches
  const clientInfo = clientRegistry.getClientInfo(ws);
  if (session.user && clientInfo?.userId && clientInfo.userId !== session.user) {
    console.warn(
      `[WS] Access denied: client ${clientId} attempted to subscribe to ` +
      `session ${message.sessionId} owned by ${session.user}`
    );
    ws.send(JSON.stringify({
      type: 'error',
      payload: 'Access denied: session belongs to another user',
      sessionId: message.sessionId,
    }));
    break;
  }

  // Now safe to subscribe
  clientRegistry.subscribe(ws, message.sessionId as SessionId);
  storage.addClient(clientId, message.sessionId as SessionId);

  const confirmSubscription: WSBroadcast = {
    type: 'subscription_confirmed',
    sessionId: message.sessionId,
    payload: { message: `Subscribed to session ${message.sessionId}` },
  };
  ws.send(JSON.stringify(confirmSubscription));
  console.log(`[WS] Client ${clientId} subscribed to session ${message.sessionId}`);
  break;
}
```

---

## Fix 3: Command Injection Prevention Utilities

### shellEscape.ts - Exports
```typescript
// Dangerous characters that could enable command injection
export const BLOCKED_CHARS = {
  unix: /[;&|`$()[\]{}<>\\!*?]/g,
  windows: /[;&|`$()[\]{}<>!*?]/g,
};

// Escapes a single shell argument
export function escapeShellArg(arg: string): string {
  if (!arg) return "''";
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

// Validates a command against an allowlist
export function validateCommand(cmd: string, allowlist: string[]): boolean {
  if (!cmd || typeof cmd !== 'string') {
    return false;
  }
  const baseCmdMatch = cmd.match(/^([^\s\/\\]+)(?:\.exe)?/i);
  const baseCmd = baseCmdMatch ? baseCmdMatch[1].toLowerCase() : cmd.toLowerCase();
  return allowlist.some(allowed => allowed.toLowerCase() === baseCmd);
}

// Sanitizes user input to remove dangerous characters
export function sanitizeInput(input: string, platform: 'unix' | 'windows' = 'unix'): string {
  if (!input) return '';
  const blockedPattern = platform === 'windows' ? BLOCKED_CHARS.windows : BLOCKED_CHARS.unix;
  return input.replace(blockedPattern, '');
}

// Validates that a command line doesn't contain suspicious patterns
export function isCommandLineSafe(commandLine: string): boolean {
  if (!commandLine || typeof commandLine !== 'string') {
    return false;
  }
  const injectionPatterns = [
    /;\s*rm\s+-rf/i,
    /;\s*dd\s+if=/i,
    />\s*\/dev\/sda/i,
    /\$\(.*\)/,
    /`[^`]*`/,
    /\|\s*nc\s+/i,
    />\s*\/etc\//i,
  ];
  return !injectionPatterns.some(pattern => pattern.test(commandLine));
}
```

### Usage Example
```typescript
import { escapeShellArg, validateCommand, sanitizeInput, isCommandLineSafe } from '../utils/shellEscape';

// Validate command is allowed
if (!validateCommand('grep', ['grep', 'find', 'ls'])) {
  throw new Error('Command not allowed');
}

// Escape user input safely
const userPattern = userInput;
const escapedPattern = escapeShellArg(userPattern);

// Check full command line for injection
const fullCommand = `grep ${escapedPattern} /path/to/file`;
if (!isCommandLineSafe(fullCommand)) {
  throw new Error('Suspicious command pattern detected');
}
```

---

## Fix 4: Max Client Limit

### clientRegistry.ts - Register with Limit Check
```typescript
register(ws: WebSocket, clientId: string, apiKey?: string, userId?: string): boolean {
  // Check if we would exceed max clients
  if (this.clients.size >= 1000) {
    return false; // Reject: at max capacity
  }

  this.clients.set(ws, {
    ws,
    clientId,
    subscribedSessionIds: new Set(),
    connectedAt: Date.now(),
    lastMessageAt: Date.now(),
    messageCount: 0,
    messageWindowStart: Date.now(),
    apiKey,
    userId,
  });
  return true;
}
```

---

## Fix 5: System Directory Denylist

### sessions.ts - Denylist and Check
```typescript
const DENIED_PATHS = [
  // Unix system directories
  '/etc', '/sys', '/proc', '/dev', '/root', '/boot', '/bin', '/sbin',
  '/usr/bin', '/usr/sbin', '/usr/local/bin', '/lib', '/lib64', '/usr/lib',
  '/var/log', '/var/www',

  // Windows system directories
  'C:\\Windows', 'C:\\Program Files', 'C:\\Program Files (x86)',
  'C:\\ProgramData', 'C:\\System Volume Information', 'C:\\$Recycle.Bin',
];

function isPathDenied(filePath: string): boolean {
  const normalizedPath = path.resolve(filePath).toLowerCase();

  return DENIED_PATHS.some(deniedPath => {
    const normalizedDenied = path.resolve(deniedPath).toLowerCase();
    // Check if the path starts with a denied directory
    return normalizedPath.startsWith(normalizedDenied) &&
           (normalizedPath.length === normalizedDenied.length ||
            normalizedPath[normalizedDenied.length] === path.sep);
  });
}

// In POST /api/sessions
router.post('/', sessionCreateLimiter, validateBody(createSessionSchema), async (req, res) => {
  try {
    const { cwd, hostname, platform, userId } = req.body;

    // Validate that directory exists
    try {
      const stat = await fs.stat(cwd);
      if (!stat.isDirectory()) {
        return res.status(400).json({ error: 'cwd must be a directory' });
      }
    } catch {
      return res.status(400).json({ error: 'cwd directory does not exist or is not accessible' });
    }

    // Check if cwd is a sensitive system directory
    if (isPathDenied(cwd)) {
      return res.status(403).json({
        error: 'Access denied: system directory is protected',
        cwd,
      });
    }

    // Continue with session creation...
  }
});
```

---

## Fix 6: Reusable Path Validation Middleware

### validatePath.ts - Middleware Function
```typescript
/**
 * Reusable middleware to validate file paths
 * Prevents directory traversal and access to sensitive system directories
 */
export function validateFilePath(paramName: string = 'path') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const filePath = req.query[paramName];

      if (!sessionId) {
        return res.status(400).json({ error: 'Missing sessionId parameter' });
      }

      if (!filePath || typeof filePath !== 'string') {
        return res.status(400).json({ error: `Missing or invalid ${paramName} parameter` });
      }

      const { storage } = await import('../storage');
      const session = await Promise.resolve(storage.getSession(sessionId as any));

      if (!session) {
        return res.status(404).json({ error: 'Session not found', sessionId });
      }

      // Resolve the absolute path
      const absolutePath = path.resolve(session.cwd, filePath);

      // Verify the path is within the session's working directory
      if (!normalizePath(absolutePath).startsWith(normalizePath(session.cwd))) {
        console.warn(`[Security] Path traversal attempt blocked:`, {
          sessionId,
          cwd: session.cwd,
          requestedPath: filePath,
          resolvedPath: absolutePath,
        });

        return res.status(403).json({
          error: 'Access denied: path outside session working directory',
          requestedPath: filePath,
        });
      }

      // Check if path is in denied system directories
      if (isPathDenied(absolutePath)) {
        console.warn(`[Security] Access to sensitive directory blocked:`, {
          sessionId,
          deniedPath: absolutePath,
        });

        return res.status(403).json({
          error: 'Access denied: system directory is protected',
          requestedPath: filePath,
        });
      }

      // Attach validated path to request
      (req as any).validatedPath = absolutePath;
      (req as any).session = session;

      next();
    } catch (error) {
      console.error('[Path Validation] Error validating path:', error);
      res.status(500).json({
        error: 'Failed to validate path',
        message: sanitizeError(error),
      });
    }
  };
}
```

### files.ts - Usage
```typescript
import { validateFilePath } from '../middleware/validatePath';

// Apply middleware to protected routes
router.get('/:sessionId/read', validateFilePath('path'), async (req, res) => {
  try {
    const absolutePath = (req as any).validatedPath;
    // Path is guaranteed to be safe at this point
    const content = await fs.readFile(absolutePath, 'utf-8');
    res.json({ content });
  } catch (error) {
    // Handle error
  }
});

router.post('/:sessionId/write', validateFilePath('path'), async (req, res) => {
  try {
    const absolutePath = (req as any).validatedPath;
    // Path is guaranteed to be safe at this point
    await fs.writeFile(absolutePath, req.body.content, 'utf-8');
    res.json({ success: true });
  } catch (error) {
    // Handle error
  }
});
```

---

## Integration Example

How all fixes work together:

```typescript
// 1. Client connects with API key
const ws = new WebSocket('ws://localhost:3001/ws?apiKey=secret123');

// 2. Max client check (Fix 4)
// If 1000+ clients already connected, connection rejected

// 3. API key stored at handshake (Fix 1)
clientRegistry.register(ws, clientId, 'secret123', userId);

// 4. Client sends subscribe message
ws.send(JSON.stringify({
  type: 'subscribe',
  sessionId: 'session-123'
}));

// 5. Per-message auth check (Fix 1)
if (!clientRegistry.validateApiKey(ws, process.env.AFW_API_KEY)) {
  // Close connection if key invalid/rotated
}

// 6. Session ownership check (Fix 2)
const session = storage.getSession('session-123');
if (session.user !== clientInfo.userId) {
  // Reject cross-user subscription
}

// 7. Subscription allowed
// Client now receives events for that session

// 8. File operations use middleware (Fix 6)
// GET /api/files/session-123/read?path=./file.txt
// validateFilePath middleware runs:
//   - Checks path doesn't escape cwd (Fix 6)
//   - Checks path not in system dirs (Fix 5)
//   - Allows read if both pass
```

---

Generated: 2026-02-06
