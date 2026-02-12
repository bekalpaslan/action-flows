# System Architecture

This diagram shows the 4-package monorepo structure and how components interact across the ActionFlows Dashboard system.

```mermaid
graph TB
    subgraph Shared["Shared Package"]
        Types["Branded Types<br/>SessionId, UserId, ChainId, StepId<br/>Discriminated Unions"]
        Utils["Utilities<br/>Validation, Helpers"]
    end

    subgraph Frontend["Frontend Package (React + Electron)"]
        React["React Components<br/>UI Layer<br/>- Dashboard<br/>- SessionPanel<br/>- FlowEditor<br/>- ChainViewer"]
        Hooks["Custom Hooks<br/>useSession<br/>useChain<br/>useWebSocket"]
        Context["Context Providers<br/>SessionContext<br/>ChainContext<br/>ThemeContext"]
        Electron["Electron Main Process<br/>Window Management<br/>IPC Bridge"]
        Vite["Vite Build Tool<br/>Dev Server Port 5173<br/>HMR"]
    end

    subgraph Backend["Backend Package (Express + Node.js)"]
        API["API Routes<br/>POST /session<br/>POST /chain<br/>GET /step<br/>DELETE /session"]
        WS["WebSocket Server<br/>ws://localhost:3001<br/>Real-time Events<br/>State Updates"]
        Services["Services<br/>SessionService<br/>ChainService<br/>StepService<br/>EventBroadcaster"]
        Storage["Storage Layer<br/>Interface Pattern<br/>MemoryStorage Dev<br/>RedisAdapter Prod"]
        Middleware["Middleware<br/>Error Handling<br/>Rate Limiting<br/>Validation"]
    end

    subgraph MCPServer["MCP Server Package"]
        MCPCore["Model Context Protocol<br/>Resource handlers<br/>Tool implementations"]
    end

    React -->|HTTP Requests| API
    React -.->|WebSocket Connection| WS
    Hooks -->|useWebSocket| WS
    Context -->|State Management| React
    Electron -->|IPC| React
    Vite -->|HMR| React

    API -->|Calls| Services
    WS -->|Broadcasts| Services
    Services -->|Read/Write| Storage
    Services -->|Validates| Middleware
    API -->|Routes Through| Middleware

    Types -->|Used by| Frontend
    Types -->|Used by| Backend
    Utils -->|Used by| Services

    MCPServer -.->|Resources| Backend
```

## Architecture Overview

### 4-Package Monorepo (pnpm workspaces)

**packages/shared/**
- Single source of truth for types
- Branded string types (SessionId, UserId, etc.) for compile-time safety
- Discriminated unions for type-safe state handling
- No dependencies on other packages

**packages/backend/**
- Express 4.18 API server (port 3001)
- WebSocket server for real-time updates
- Storage abstraction layer (pluggable: Memory/Redis)
- Business logic services (SessionService, ChainService, StepService)
- Zod schemas for request validation

**packages/app/**
- React 18.2 UI components
- Electron 28 desktop wrapper
- Vite 5 development server with HMR
- Custom hooks for state management
- React Context for app-level state

**packages/mcp-server/**
- Model Context Protocol 1.0 implementation
- Resource handlers for Claude integration
- Tool implementations for automation

### Data Flow Patterns

1. **User Action → Frontend** — User interacts with React component
2. **Frontend → Backend API** — HTTP POST to Express route
3. **Backend Processing** — Services validate and process request
4. **Storage Operation** — Services persist to Memory/Redis
5. **WebSocket Broadcast** — Services emit events to connected clients
6. **State Update → UI Render** — React updates component state
7. **WebSocket Listener** — Other clients receive real-time updates

### Key Integration Points

- **Shared Types Bridge** — All packages import from shared/ for type safety
- **HTTP API** — Standard REST endpoints for CRUD operations
- **WebSocket Events** — Real-time state synchronization across clients
- **Storage Interface** — Abstraction allows Memory (dev) or Redis (prod) without code changes
- **Electron IPC** — Desktop app communicates with React layer
