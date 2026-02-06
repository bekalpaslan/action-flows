# ActionFlows Workspace - Setup Guide

This guide walks you through setting up ActionFlows Workspace from scratch.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [First Run](#first-run)
5. [Integrating with Projects](#integrating-with-projects)
6. [Team Setup](#team-setup)
7. [Advanced Configuration](#advanced-configuration)

---

## System Requirements

### Minimum Requirements

- **OS**: Windows 10+, macOS 10.14+, or Linux (Ubuntu 20.04+)
- **CPU**: Dual-core processor
- **RAM**: 4 GB
- **Disk**: 500 MB free space
- **Network**: Local network access for team features

### Recommended Requirements

- **OS**: Windows 11, macOS 12+, or Linux (Ubuntu 22.04+)
- **CPU**: Quad-core processor
- **RAM**: 8 GB
- **Disk**: 2 GB free space (for 7-day history retention)

### Software Dependencies

- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **pnpm**: v8.0.0 or higher (install via `npm install -g pnpm`)
- **Redis** (optional): v6.0.0+ for multi-instance support

---

## Installation

### Step 1: Install Node.js and pnpm

**Node.js:**
```bash
# macOS (via Homebrew)
brew install node

# Windows (via Chocolatey)
choco install nodejs

# Linux (via package manager)
sudo apt-get install nodejs npm
```

**pnpm:**
```bash
npm install -g pnpm
```

### Step 2: Install Redis (Optional)

**Why Redis?** Redis enables shared state across multiple backend instances, useful for large teams.

**macOS:**
```bash
brew install redis
brew services start redis
```

**Windows:**
Download from [Redis Windows port](https://github.com/microsoftarchive/redis/releases)

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Verify Redis:**
```bash
redis-cli ping
# Should output: PONG
```

### Step 3: Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd ActionFlowsDashboard

# Install dependencies
pnpm install
```

---

## Configuration

### Backend Configuration

Create `packages/backend/.env`:

```env
# Server
PORT=3001
NODE_ENV=development

# Storage
REDIS_URL=redis://localhost:6379  # Remove this line to use in-memory storage
HISTORY_RETENTION_DAYS=7

# Logging
LOG_LEVEL=info
```

### App Configuration

The Electron app auto-discovers the backend at `http://localhost:3001`. To change:

Edit `packages/app/src/config.ts`:

```typescript
export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'
```

---

## First Run

### Option 1: Development Mode (Recommended for testing)

**Terminal 1 - Backend:**
```bash
cd packages/backend
pnpm run dev
```

You should see:
```
╔════════════════════════════════════════════╗
║   ActionFlows Backend Server Running      ║
║   API: http://localhost:3001             ║
║   WS:  ws://localhost:3001/ws           ║
║   Storage: Memory                         ║
║   Cleanup: Daily (7-day retention)        ║
╚════════════════════════════════════════════╝
```

**Terminal 2 - Electron App:**
```bash
cd packages/app
pnpm run dev
```

The Electron window opens showing:
- Status: "Connected" (green)
- Empty user list
- "Waiting for sessions..." message

### Option 2: Production Build

Build for production:

```bash
# Build all packages
pnpm run build

# Create distributable
cd packages/app
pnpm run electron-build
```

Install the distributable:
- **Windows**: Run `.exe` installer from `dist/`
- **macOS**: Open `.dmg` and drag to Applications
- **Linux**: Make `.AppImage` executable and run

---

## Integrating with Projects

### Step 1: Copy Hooks to Project

Copy hook scripts from `packages/hooks/` to your project's `.claude/hooks/`:

```bash
# From ActionFlowsDashboard directory
cp packages/hooks/*.ts /path/to/your/project/.claude/hooks/
```

### Step 2: Configure Hooks

Edit each hook file in `.claude/hooks/` and set the backend URL:

```typescript
const BACKEND_URL = 'http://localhost:3001' // Change if needed
```

For team setups, use the team backend's IP:
```typescript
const BACKEND_URL = 'http://192.168.1.100:3001' // Team backend server
```

### Step 3: Enable Hooks in Claude Code

Add to your project's `.claude/settings.json`:

```json
{
  "hooks": {
    "enabled": true,
    "directory": ".claude/hooks"
  }
}
```

### Step 4: Test the Integration

1. Start a Claude Code session in your project:
   ```bash
   claude-code
   ```

2. Trigger a chain compilation (e.g., ask Claude to implement a feature)

3. Check the Workspace - you should see:
   - Your username in the sidebar
   - A new session appear
   - Chain visualization populate in real-time

---

## Team Setup

### For the Backend Host (One Machine)

1. **Start the backend** on a fixed IP machine:
   ```bash
   cd packages/backend
   pnpm start
   ```

2. **Note the machine's IP address**:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "

   # Windows
   ipconfig
   ```

   Example: `192.168.1.100`

3. **Configure firewall** to allow port 3001:
   ```bash
   # Linux (ufw)
   sudo ufw allow 3001/tcp

   # macOS
   System Preferences > Security & Privacy > Firewall > Firewall Options
   Add rule for port 3001
   ```

### For Team Members

1. **Install the Workspace app** (Electron distributable)

2. **Configure backend URL** in the app settings:
   - Click Settings icon
   - Set "Backend URL" to `http://192.168.1.100:3001` (team backend IP)
   - Click "Save"

3. **Configure hooks** in each project:
   ```typescript
   const BACKEND_URL = 'http://192.168.1.100:3001' // Team backend
   ```

4. **Test connection**:
   - Open Workspace
   - Status indicator should show "Connected" (green)
   - Start a Claude session - it should appear in the Workspace

---

## Advanced Configuration

### Using Redis for Persistence

**Why Redis?**
- Shared state across multiple backend instances
- Faster event broadcasting
- Persistent session data across backend restarts

**Setup:**

1. Install and start Redis (see Installation section)

2. Configure backend:
   ```env
   REDIS_URL=redis://localhost:6379
   ```

3. Restart backend - you should see:
   ```
   Storage: Redis ✓
   ```

### Configuring Notifications

Edit `packages/app/src/components/NotificationManager.tsx`:

```typescript
<NotificationManager
  sessionIds={attachedSessionIds}
  enableStepFailures={true}      // Show notifications on step failures
  enableChainCompletions={true}  // Show notifications on chain completions
/>
```

### Adjusting History Retention

Change retention period (default: 7 days):

```env
HISTORY_RETENTION_DAYS=14  # Keep history for 14 days
```

### Customizing System Tray

Edit `packages/app/electron/main.ts`:

```typescript
const contextMenu = Menu.buildFromTemplate([
  {
    label: 'Show App',
    click: () => { /* ... */ },
  },
  { type: 'separator' },
  {
    label: 'Settings',  // Add custom menu item
    click: () => { /* ... */ },
  },
  { type: 'separator' },
  {
    label: 'Quit',
    click: () => { /* ... */ },
  },
])
```

### Disabling Desktop Notifications

Set environment variable before launching:

```bash
DISABLE_NOTIFICATIONS=true ./ActionFlowsWorkspace
```

Or disable in app settings (if UI implemented).

---

## Troubleshooting

### Issue: "Backend not reachable"

**Solution:**
1. Check backend is running: `curl http://localhost:3001/health`
2. Check firewall isn't blocking port 3001
3. Verify `BACKEND_URL` in app settings

### Issue: "Hooks not sending events"

**Solution:**
1. Check hooks have correct permissions: `chmod +x .claude/hooks/*.ts`
2. Verify `BACKEND_URL` in hook files
3. Test hook manually: `node .claude/hooks/afw-step-spawned.ts`
4. Check backend logs: `packages/backend/logs/`

### Issue: "No sessions appearing"

**Solution:**
1. Verify hooks are enabled in `.claude/settings.json`
2. Check Claude Code session is running with hooks
3. Verify backend received events: Check logs
4. Check WebSocket connection: Browser console in Electron DevTools

### Issue: "History not saving"

**Solution:**
1. Check `data/history/` directory exists
2. Verify write permissions: `ls -la data/`
3. Check disk space: `df -h`
4. Check backend logs for persistence errors

### Issue: "Notifications not appearing"

**Solution:**
1. Check OS notification permissions for Electron app
2. Verify notifications are enabled in app settings
3. Test with: `window.electron.ipcRenderer.invoke('show-notification', {...})`

---

## Next Steps

- Read the [API Reference](./API_REFERENCE.md) for backend integration
- Explore the [User Guide](./docs/USER_GUIDE.md) for detailed features
- Join the community on [GitHub Discussions](https://github.com/...)
- Report issues on [GitHub Issues](https://github.com/...)

## Getting Help

- **Documentation**: Browse `docs/` directory
- **Issues**: https://github.com/.../issues
- **Discussions**: https://github.com/.../discussions
- **Email**: support@actionflows.dev
