# @afw/app - Electron + React + Vite Desktop Application

ActionFlows desktop application built with Electron, React, TypeScript, and Vite.

## Features

- React 18 with TypeScript
- Vite for fast HMR (Hot Module Replacement)
- Electron with context isolation and preload security
- Dark theme UI
- Type-safe IPC communication

## Development

```bash
# Install dependencies (from monorepo root)
pnpm install

# Start development server with Electron
pnpm -F @afw/app dev

# Build for production
pnpm -F @afw/app build
```

## Project Structure

```
packages/app/
├── electron/           # Electron main process
│   ├── main.ts        # Main process entry point
│   └── preload.ts     # Secure preload script
├── src/               # React application
│   ├── App.tsx        # Root component
│   ├── App.css        # App styles
│   ├── main.tsx       # React entry point
│   └── index.css      # Global styles
├── public/            # Static assets
├── index.html         # HTML entry point
├── vite.config.ts     # Vite configuration
├── tsconfig.json      # TypeScript configuration
└── package.json       # Package metadata
```

## Key Technologies

- **Electron 28.x** - Desktop application framework
- **React 18.2** - UI library
- **Vite 5.x** - Build tool with HMR
- **TypeScript 5.x** - Type safety
- **Electron Builder** - App packaging

## Security Notes

- Context isolation enabled (`contextIsolation: true`)
- Node integration disabled (`nodeIntegration: false`)
- Preload script uses contextBridge with whitelisted IPC channels
- Sandbox enabled for renderer process

## IPC Communication

Type-safe IPC methods are exposed via `window.electron.ipcRenderer`:

```typescript
// Available methods
window.electron.ipcRenderer.invoke('ping') // → 'pong'
window.electron.ipcRenderer.on('update-available', handler)
window.electron.ipcRenderer.send('close-app')
```

To add new IPC channels:
1. Add handler in `electron/main.ts`
2. Add channel to whitelist in `electron/preload.ts`
3. Use via `window.electron.ipcRenderer`
