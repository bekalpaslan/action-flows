# ActionFlows Workspace

> An agentic IDE for real-time visualization, file editing, and control of ActionFlows orchestration chains

## Overview

ActionFlows Workspace is a self-hosted desktop application that provides complete visibility and control over ActionFlows execution chains. It serves as a collaborative workspace where teams can observe chains, edit files, view agent output, and control execution in real-time.

## Philosophy

**ActionFlows is open source software** built on a radical premise: the product is the **idea**, not the codebase.

**The Idea:**
Software should evolve through use. Humans express will, orchestrators reshape physics (code), and the universe grows smarter with every execution. This is collaborative intelligence.

**Your Sovereignty:**
You have **full sovereignty over all five layers** — from platform code to orchestration model to the physics of your universe. Fork it, rewrite it, replace entire subsystems. The more this idea mutates, the stronger it becomes.

**The Product:**
This repository is a **proven template** — the creator's working universe with real-world defaults. Use it as-is, or evolve it into something unrecognizable. Both prove the thesis.

**The only enemy is stagnation, not mutation.** No asterisks.

---

### Key Features

- **Real-time Chain Visualization** - DAG and Timeline views of execution chains
- **Multi-Session Support** - Monitor multiple team members' sessions simultaneously
- **Desktop Notifications** - Native notifications for critical events (step failures, completions)
- **System Tray Integration** - Runs in background with quick access
- **Session History** - 7-day retention of past executions
- **Conversation Interface** - Respond to Claude prompts directly from the UI
- **Control Interface** - Pause, cancel, and retry steps via MCP integration

## Architecture

### Framework Harmony

ActionFlows uses a **harmony system** to keep the orchestrator and dashboard synchronized as both evolve:

**The 4-Part System:**

1. **Orchestrator Contract** — Formal specification of all output formats (`.claude/actionflows/CONTRACT.md`)
2. **Onboarding Questionnaire** — Interactive teaching flow explaining harmony concepts (Module 9)
3. **Harmony Detection** — Backend service validating orchestrator output in real-time (`packages/backend/src/services/harmonyDetector.ts`)
4. **Philosophy Documentation** — Harmony concept embedded throughout framework docs

**How It Works:**

```
Orchestrator produces output
    ↓
Backend parses using contract-defined parsers (packages/shared/src/contract/)
    ↓
Harmony detector validates structure
    ↓
Dashboard shows status: ✅ In Harmony | ⚠️ Degraded | ❌ Violation
```

**Living Software:** The system is designed to evolve through use. The contract can change, but changes must be deliberate and coordinated (increment CONTRACT_VERSION, support migration).

**Learn more:**
- Read the contract: `.claude/actionflows/CONTRACT.md`
- Learn interactively: Run onboarding flow (Module 9: Harmony)
- Monitor harmony: Dashboard harmony panel (real-time status)

---

```
Dev Machines (Claude Code + Hooks)
       | POST /events
       v
+------------------------------+
|   ActionFlows Workspace      |
|        Backend               |
|  - Express HTTP (events)     |
|  - WebSocket (broadcast)     |
|  - Redis (real-time state)   |
|  - JSON files (7-day history)|
+------------------------------+
       | WebSocket
       v
Electron Apps (team members)
  - Chain visualization
  - History browser
  - Conversation interface
```

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **pnpm** 8+ (install via `npm install -g pnpm`)
- **Redis** (optional, for multi-instance support)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ActionFlowsDashboard
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs all dependencies across the monorepo packages:
- `@afw/shared` - Shared types and utilities
- `@afw/hooks` - Claude Code hook scripts
- `@afw/backend` - Express + WebSocket backend
- `@afw/app` - Electron desktop application
- `@afw/mcp-server` - MCP server for control interface

### 3. Configure Environment

The backend uses environment variables for configuration. Create a `.env` file in `packages/backend/`:

```env
# Backend Configuration
PORT=3001
NODE_ENV=development

# Redis (optional - falls back to in-memory storage)
REDIS_URL=redis://localhost:6379

# Storage
HISTORY_RETENTION_DAYS=7
```

## Switching AI Providers

ActionFlows supports both **Anthropic's Claude API** (cloud) and **Ollama** (local models) for Claude Code execution.

### Quick Toggle

```bash
# Switch to local Ollama models
pnpm provider:ollama

# Switch to Anthropic API
pnpm provider:anthropic

# Check current provider
pnpm provider:status

# Restore from backup
pnpm provider:restore
```

### Prerequisites

**For Anthropic (Cloud):**
- Valid API key in `~/.claude/config.json`
- Internet connection
- Pay-per-use pricing

**For Ollama (Local):**
- Ollama installed and running: `http://localhost:11434`
- Models pulled: `ollama pull qwen2.5-coder:7b`
- ~5-20GB disk space for models
- Sufficient RAM (8GB+ recommended)

### Recommended Ollama Models

| Model | Size | Speed | Best For |
|-------|------|-------|----------|
| `gemma3:4b` | 2.5GB | Fast (~18s) | Quick iterations |
| `qwen2.5-coder:7b` | 4.7GB | Medium (~45s) | General development |
| `qwen2.5-coder:32b` | 19GB | Slow (>2min) | Critical reviews |

**Quick setup:**
```bash
# Install Ollama (if not installed)
curl -fsSL https://ollama.com/install.sh | sh  # Linux/macOS
# or download from https://ollama.com for Windows

# Pull recommended model
ollama pull qwen2.5-coder:7b

# Verify Ollama is running
curl http://localhost:11434/api/tags
```

### Manual Setup

If automated toggle fails, see `.claude/config-templates/README.md` for manual configuration steps.

### Important Notes

- **Provider toggle is global:** Affects all Claude Code projects on your machine
- **Backups created automatically:** Before each toggle
- **Second-opinion system:** Uses Ollama independently (works with either primary provider)

For detailed guide, see `docs/guides/PROVIDER_TOGGLE.md`.

## Running the Application

### Development Mode

Run both backend and frontend in development:

```bash
# Terminal 1: Start backend
cd packages/backend
pnpm run dev

# Terminal 2: Start Electron app
cd packages/app
pnpm run dev
```

The backend starts on `http://localhost:3001` and the Electron app connects automatically.

### Production Build

Build distributable Electron apps for all platforms:

```bash
# Build all packages
pnpm run build

# Create Electron distributables
cd packages/app
pnpm run electron-build
```

Distributables are created in `packages/app/dist/`:
- Windows: `.exe` installer
- macOS: `.dmg` image
- Linux: `.AppImage` package

## Usage

### Setting Up Hooks

To integrate ActionFlows Workspace with your Claude Code sessions:

1. **Copy hook scripts** from `packages/hooks/` to your project's `.claude/hooks/` directory

2. **Enable hooks** in your Claude Code settings (`.claude/settings.json`):

```json
{
  "hooks": {
    "enabled": true,
    "directory": ".claude/hooks"
  }
}
```

3. **Configure hooks** to point to your backend URL. Edit each hook script's `BACKEND_URL`:

```typescript
const BACKEND_URL = 'http://localhost:3001' // Change if backend is on different machine
```

### Running the Workspace

1. **Start the backend** (if not already running):
   ```bash
   cd packages/backend
   pnpm start
   ```

2. **Launch the Electron app**:
   - Development: `pnpm run dev`
   - Production: Open the installed application

3. **Start a Claude Code session** in your project with hooks enabled

4. **View the session** in the Workspace - it appears automatically under your username

### Using the Interface

#### Main Layout

- **Left Sidebar**: Users and their sessions
- **Center**: Chain visualization (DAG/Timeline toggle)
- **Bottom**: Conversation panel for responding to Claude prompts
- **Right**: Session inspector with step details

#### Desktop Notifications

Notifications appear for:
- Step failures (critical urgency)
- Chain completions (normal urgency)
- Session ended (low urgency)

Click a notification to bring the Workspace to focus.

#### System Tray

Minimize to system tray:
- **Windows**: Right-click tray icon for menu
- **macOS**: Click menu bar icon for menu
- **Linux**: Right-click system tray icon

Tray menu options:
- Show App
- Quit

#### History Browser

Access past sessions (up to 7 days):

1. Click "History" in the sidebar (if implemented in UI)
2. Select a date from the calendar
3. Choose a session to view
4. Inspect chains, events, and step details

## Configuration

### Backend Configuration

Edit `packages/backend/src/index.ts` for advanced options:

- **Port**: Change `PORT` environment variable (default: 3001)
- **Storage**: Toggle between Redis and in-memory via `REDIS_URL` presence
- **Retention**: Change `HISTORY_RETENTION_DAYS` (default: 7)
- **WebSocket**: Configure in WebSocket handler

### Electron App Configuration

Edit `packages/app/electron/main.ts` for app behavior:

- **Window size**: `width`, `height` in `createWindow()`
- **Notifications**: Urgency levels in notification handler
- **Tray**: Customize menu items in `createTray()`

## API Reference

See [API_REFERENCE.md](./docs/api/API_REFERENCE.md) for complete REST API documentation.

### Core Endpoints

- `POST /api/events` - Submit execution events
- `GET /api/sessions` - List active sessions
- `GET /api/sessions/:id` - Get session details
- `POST /api/sessions/:id/input` - Submit user input
- `GET /api/history/dates` - List available history dates
- `GET /api/history/sessions/:date` - List sessions for date

## Development

### Project Structure

```
ActionFlowsDashboard/
├── packages/
│   ├── shared/       # Shared TypeScript types
│   ├── hooks/        # Claude Code hook scripts
│   ├── backend/      # Express backend
│   ├── app/          # Electron app
│   └── mcp-server/   # MCP control interface
├── docs/             # Additional documentation
├── test/             # Integration tests
└── pnpm-workspace.yaml
```

### Adding Features

1. **Backend routes**: Add in `packages/backend/src/routes/`
2. **React components**: Add in `packages/app/src/components/`
3. **Shared types**: Add in `packages/shared/src/types.ts`
4. **Hooks**: Add in `packages/hooks/`

### Testing

```bash
# Run backend tests
cd packages/backend
pnpm test

# Run integration tests
cd test
pnpm test
```

## Troubleshooting

### Backend not starting

- Check Redis is running: `redis-cli ping` should return `PONG`
- Check port 3001 is available: `lsof -i :3001` (macOS/Linux) or `netstat -ano | findstr :3001` (Windows)
- Check logs: `packages/backend/logs/`

### Electron app not connecting

- Verify backend is running: `curl http://localhost:3001/health`
- Check WebSocket URL in app settings
- Check firewall isn't blocking connections

### Hooks not sending events

- Verify hooks are in `.claude/hooks/` directory
- Check hooks have execute permissions: `chmod +x .claude/hooks/*.ts`
- Verify `BACKEND_URL` in hook scripts is correct
- Test hook manually: `node .claude/hooks/afw-step-spawned.ts`

### History not persisting

- Check `data/history/` directory exists and is writable
- Verify disk space available
- Check backend logs for persistence errors

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

**MIT License** — Copy, modify, distribute freely.

This project is open source because **the more this idea spreads, the stronger it becomes.** The codebase is not the product. The idea is the product. Your fork proves the thesis just as much as this repository does.

See [LICENSE](./LICENSE) for formal terms.

**Philosophy:** Full sovereignty. No asterisks. Fork it, evolve it, make it yours.

## Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@actionflows.dev
