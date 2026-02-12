# Developer Guide — ActionFlows Dashboard

> Complete onboarding guide for developers working with the ActionFlows Dashboard monorepo.

## Table of Contents

- [Quick Start (5 minutes)](#quick-start)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Running the Application](#running-the-application)
- [Development Workflows](#development-workflows)
- [Debugging Guide](#debugging-guide)
- [Hot Reload & File Watching](#hot-reload--file-watching)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

Get the application running in under 5 minutes:

```bash
# 1. Clone the repository
git clone <repository-url>
cd ActionFlowsDashboard

# 2. Install dependencies
pnpm install

# 3. Start backend (Terminal 1)
pnpm dev:backend

# 4. Start frontend (Terminal 2)
pnpm dev:app

# 5. View at http://localhost:5173 (Electron app will auto-launch)
```

That's it! The backend runs on port 3001, frontend on port 5173. Both watch for file changes.

---

## Prerequisites

### System Requirements

- **Node.js** 18+ (LTS recommended)
  - Verify: `node --version`
  - Install: https://nodejs.org/
- **pnpm** 8.0+
  - Install: `npm install -g pnpm@8`
  - Verify: `pnpm --version`
- **Git** (for version control)

### Optional for Redis Support

- **Redis** 6.0+ (for production multi-instance support)
  - Install: `brew install redis` (macOS) or `choco install redis` (Windows)
  - Verify: `redis-cli ping` → `PONG`

**Note:** Development works fine with in-memory storage. Redis is optional.

---

## Project Structure

The monorepo uses **pnpm workspaces** with 4 main packages:

```
ActionFlowsDashboard/
├── packages/
│   ├── shared/              # Shared types & utilities
│   │   ├── src/
│   │   │   ├── types.ts     # All branded types (SessionId, UserId, etc.)
│   │   │   ├── index.ts     # Public exports
│   │   │   └── ...
│   │   └── package.json
│   │
│   ├── backend/             # Express + WebSocket server
│   │   ├── src/
│   │   │   ├── index.ts     # Server entry point
│   │   │   ├── routes/      # API endpoints
│   │   │   ├── ws/          # WebSocket handlers
│   │   │   ├── storage/     # Data persistence (Redis/Memory)
│   │   │   ├── services/    # Business logic
│   │   │   └── __tests__/   # Unit tests
│   │   ├── dist/            # Compiled JavaScript
│   │   └── package.json
│   │
│   ├── app/                 # Electron + React app
│   │   ├── src/
│   │   │   ├── main.tsx     # Entry point
│   │   │   ├── components/  # React components
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── contexts/    # Context providers
│   │   │   ├── styles/      # Global CSS/tokens
│   │   │   └── __tests__/   # Unit tests
│   │   ├── electron/        # Electron main process
│   │   └── package.json
│   │
│   ├── hooks/               # Claude Code hook scripts
│   │   ├── afw-step-spawned.ts
│   │   ├── afw-chain-created.ts
│   │   └── ...
│   │
│   └── mcp-server/          # Model Context Protocol server
│       └── src/
│
├── test/                    # Integration tests
│   ├── e2e/                 # End-to-end tests (Playwright)
│   ├── playwright/          # Playwright config & fixtures
│   └── ...
│
├── docs/                    # Documentation
│   ├── DEVELOPER_GUIDE.md   # (This file)
│   ├── TESTING_GUIDE.md
│   ├── CONTRIBUTING.md
│   ├── api/
│   ├── architecture/
│   └── ...
│
├── pnpm-workspace.yaml
└── package.json
```

### Key Directories

| Path | Purpose |
|------|---------|
| `packages/shared/src/types.ts` | All TypeScript types (start here) |
| `packages/backend/src/routes/` | API endpoints |
| `packages/backend/src/services/` | Business logic (storage, WebSocket, etc.) |
| `packages/app/src/components/` | React components |
| `packages/app/src/hooks/` | Custom hooks (useSession, useChains, etc.) |
| `packages/app/src/contexts/` | Context providers (SessionContext, etc.) |
| `packages/app/electron/` | Electron main process |
| `test/e2e/` | Playwright E2E tests |

---

## Development Setup

### 1. Install Dependencies

```bash
cd ActionFlowsDashboard
pnpm install
```

This installs all dependencies across all packages. pnpm uses **workspaces** to manage monorepo dependencies efficiently.

### 2. Configure Environment

Create `packages/backend/.env`:

```env
# Server
PORT=3001
NODE_ENV=development

# Optional: Redis support
REDIS_URL=redis://localhost:6379

# Storage
HISTORY_RETENTION_DAYS=7
```

The backend will work without `.env` (uses defaults). These are optional overrides.

### 3. Verify Installation

```bash
# Type-check all packages
pnpm type-check

# Run linter
pnpm lint

# Run tests
pnpm test
```

All should pass. If not, see [Troubleshooting](#troubleshooting).

---

## Running the Application

### Development Mode (Recommended)

Run both backend and frontend with file watching:

```bash
# Start both in parallel (opens 2 terminals automatically)
pnpm dev
```

Or run separately for more control:

```bash
# Terminal 1: Backend (port 3001)
pnpm dev:backend

# Terminal 2: Frontend (port 5173, auto-launches Electron)
pnpm dev:app
```

Or with Web UI only (no Electron):

```bash
# Terminal 1: Backend
pnpm dev:backend

# Terminal 2: Web UI at http://localhost:5173
cd packages/app
pnpm dev
```

### What "Dev Mode" Gives You

- **File watching** — Changes auto-reload
- **Source maps** — Debug with original TypeScript
- **Hot Module Reload** — React components update without page reload
- **Console logs** — Visible in terminal and browser DevTools

### Production Build

```bash
# Build all packages
pnpm build

# Build only backend or frontend
pnpm -F @afw/backend build
pnpm -F @afw/app build

# Create Electron distributable
pnpm -F @afw/app electron-build

# Create platform-specific builds
pnpm -F @afw/app electron-build:win   # Windows
pnpm -F @afw/app electron-build:mac   # macOS
pnpm -F @afw/app electron-build:linux # Linux
```

---

## Development Workflows

### Adding a Backend Route

**Task:** Create a new `/api/example` endpoint that returns `{ message: "hello" }`

1. Create `packages/backend/src/routes/example.ts`:

```typescript
import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'hello' });
});

export default router;
```

2. Register in `packages/backend/src/index.ts`:

```typescript
import exampleRouter from './routes/example.js';

// ... after other route registrations ...
app.use('/api/example', exampleRouter);
```

3. Test:

```bash
curl http://localhost:3001/api/example
# Output: {"message":"hello"}
```

### Adding a React Component

**Task:** Create a reusable Button component

1. Create `packages/app/src/components/Button.tsx`:

```typescript
import React from 'react';
import styles from './Button.module.css';

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  variant = 'primary',
}) => (
  <button className={styles[variant]} onClick={onClick}>
    {children}
  </button>
);
```

2. Create accompanying stylesheet `Button.module.css`:

```css
.primary {
  background: #007bff;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.primary:hover {
  background: #0056b3;
}

.secondary {
  background: #e9ecef;
  color: #333;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.secondary:hover {
  background: #dee2e6;
}
```

3. Use in another component:

```typescript
import { Button } from './Button';

export const MyComponent = () => (
  <Button variant="primary" onClick={() => console.log('Clicked!')}>
    Click Me
  </Button>
);
```

### Adding a Shared Type

**Task:** Create a new branded type for a user preference ID

1. Edit `packages/shared/src/types.ts`:

```typescript
// Add this near other brand definitions
export type PreferenceId = string & { readonly __brand: 'PreferenceId' };

export const brandedTypes = {
  // ... existing brands ...
  preferenceId: (value: string): PreferenceId => value as PreferenceId,
};
```

2. Use in backend:

```typescript
import type { PreferenceId } from '@afw/shared';
import { brandedTypes } from '@afw/shared';

const prefId = brandedTypes.preferenceId('pref-123');
// Type is now PreferenceId, not string
```

3. Use in frontend:

```typescript
import type { PreferenceId } from '@afw/shared';

interface UserPreference {
  id: PreferenceId;
  name: string;
}
```

### Making a WebSocket Call from React

**Task:** Send a message and listen for responses

1. Use the WebSocket context (usually already provided):

```typescript
import { useContext } from 'react';
import { WebSocketContext } from '../contexts/WebSocketContext';

export const MyComponent = () => {
  const ws = useContext(WebSocketContext);

  const sendMessage = () => {
    ws.send(JSON.stringify({
      type: 'example:action',
      data: { userId: 'user-123' },
    }));
  };

  return <button onClick={sendMessage}>Send Message</button>;
};
```

2. Listen for responses in a hook:

```typescript
import { useEffect, useContext } from 'react';
import { WebSocketContext } from '../contexts/WebSocketContext';

export const useExampleData = () => {
  const ws = useContext(WebSocketContext);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      if (message.type === 'example:response') {
        console.log('Received:', message.data);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);
};
```

---

## Debugging Guide

### VSCode Launch Configuration

Create `.vscode/launch.json` for debugging:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Backend Debug",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/tsx",
      "args": ["watch", "packages/backend/src/index.ts"],
      "console": "integratedTerminal",
      "cwd": "${workspaceFolder}/packages/backend"
    },
    {
      "name": "Frontend Debug",
      "type": "chrome",
      "request": "attach",
      "port": 9222,
      "pathMapping": {
        "/": "${workspaceFolder}/packages/app/src/",
        "/src": "${workspaceFolder}/packages/app/src/"
      }
    }
  ]
}
```

Then in VSCode:
1. Press `Ctrl+Shift+D` (Debug panel)
2. Select "Backend Debug" or "Frontend Debug"
3. Press F5 to start
4. Set breakpoints by clicking line numbers

### Backend Console Logging

```typescript
// In any backend file
console.log('Message:', value);
console.error('Error:', err);
console.warn('Warning:', msg);

// Structured logging (recommended)
console.log({ action: 'user_login', userId: 'u-123', timestamp: new Date() });
```

View logs in the terminal running `pnpm dev:backend`.

### Frontend DevTools

1. Open the Electron app (running `pnpm dev:app`)
2. Press `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (macOS)
3. Use Console, Network, Elements tabs as normal

Or for web UI:
1. Open browser at http://localhost:5173
2. Press `F12` for DevTools

### Network Request Debugging

**Frontend:**
1. Open DevTools (F12)
2. Go to Network tab
3. Make API call
4. Click request → Response tab to see data

**Backend:**
Add logging to routes:

```typescript
router.get('/data', (req, res) => {
  console.log('Incoming request:', { path: req.path, query: req.query });
  const data = { /* ... */ };
  console.log('Sending response:', data);
  res.json(data);
});
```

### TypeScript Errors

If you see type errors:

```bash
# Check all packages
pnpm type-check

# Focus on one package
pnpm -F @afw/backend type-check
pnpm -F @afw/app type-check
```

Fix errors shown in output. Don't ignore TypeScript warnings — they prevent bugs.

### Testing During Development

```bash
# Run all tests once
pnpm test

# Run tests in watch mode (re-runs on file change)
pnpm test:watch

# Run specific test file
pnpm -F @afw/backend test -- sessions.test.ts

# Run with coverage
pnpm -F @afw/backend test -- --coverage
```

---

## Hot Reload & File Watching

Both backend and frontend support automatic reload on file changes:

### Backend Hot Reload

The backend uses `tsx watch`, which:
- Detects file changes in `packages/backend/src/`
- Restarts the server automatically
- Keeps the same port (3001)

**Note:** You may need to refresh the frontend to reconnect WebSocket.

### Frontend Hot Module Reload (HMR)

Vite provides HMR for React:
- Change a component → Updates in browser instantly
- Change styles → Updates without page reload
- Full page reload only when necessary

**Note:** HMR works best with function components and hooks. Class components may require full reload.

### File Watching Best Practices

1. **Avoid circular imports** — They prevent hot reload from working
2. **Keep components pure** — Side effects in render cause reload issues
3. **Use key prop in lists** — Prevents component state loss on reload
4. **Save all files before testing** — Give file watcher time to detect changes

---

## Troubleshooting

### "pnpm: command not found"

**Problem:** pnpm is not installed

**Solution:**
```bash
npm install -g pnpm@8
pnpm --version  # Should show 8.x.x
```

### "Port 3001 already in use"

**Problem:** Something else is using port 3001

**Solution (macOS/Linux):**
```bash
# Find what's using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3002 pnpm dev:backend
```

**Solution (Windows):**
```cmd
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process (replace PID with the actual PID)
taskkill /PID <PID> /F

# Or use a different port
set PORT=3002
pnpm dev:backend
```

### "Module not found" or "Cannot find type"

**Problem:** Dependencies not installed

**Solution:**
```bash
pnpm install

# Or reinstall everything
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Backend not starting / "TypeError: Cannot read property 'x' of undefined"

**Problem:** Unmet dependency or configuration issue

**Solution:**
```bash
# Check logs
pnpm dev:backend

# Verify .env is correct (if exists)
cat packages/backend/.env

# Try rebuilding
pnpm build:backend
pnpm dev:backend
```

### Frontend blank white page

**Problem:** Backend not responding or incorrect URL

**Solution:**
```bash
# 1. Verify backend is running
curl http://localhost:3001/health

# 2. Check browser console (F12) for errors
# Look for connection errors, 404s

# 3. Restart both
# Kill frontend
# Kill backend
# pnpm dev (from root)
```

### TypeScript errors even though code looks fine

**Problem:** Type cache out of sync

**Solution:**
```bash
# Rebuild everything
pnpm build

# Or type-check specifically
pnpm type-check

# If still broken, nuke and reinstall
rm -rf packages/*/dist node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

### "Cannot find module @afw/shared"

**Problem:** Shared package not built

**Solution:**
```bash
# Build shared first
pnpm -F @afw/shared build

# Then build dependent packages
pnpm build
```

### Tests failing locally but passing in CI

**Problem:** Environment differences (Node version, OS, paths)

**Solution:**
```bash
# Check Node version matches CI (should be 18+)
node --version

# Run same test command as CI
pnpm test

# Check for platform-specific issues
# Windows paths use \ but tests expect /
```

### Electron app won't launch

**Problem:** Missing build artifacts

**Solution:**
```bash
# Rebuild frontend
pnpm -F @afw/app build

# Then try dev again
pnpm dev:app

# Or launch Electron explicitly
pnpm -F @afw/app dev:electron
```

### WebSocket connection refused

**Problem:** Backend not running or CORS issue

**Solution:**
1. Verify backend is running: `curl http://localhost:3001/health`
2. Check browser console for CORS errors
3. Verify WebSocket URL in frontend config
4. Restart both server and client

---

## Summary

You now have everything needed to develop on the ActionFlows Dashboard:

- **5 min setup**: `pnpm install && pnpm dev`
- **File structure**: monorepo with 4 packages (shared, backend, app, hooks)
- **Workflows**: How to add routes, components, types
- **Debugging**: VSCode config, console logging, DevTools
- **Hot reload**: Auto-restart backend, HMR for frontend
- **Troubleshooting**: Common issues and fixes

For more details:
- **Testing**: See [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **Contributing**: See [CONTRIBUTING.md](./CONTRIBUTING.md)
- **API Reference**: See [docs/api/API_REFERENCE.md](./api/API_REFERENCE.md)
- **Architecture**: See [docs/architecture/README.md](./architecture/README.md)

Happy coding!
