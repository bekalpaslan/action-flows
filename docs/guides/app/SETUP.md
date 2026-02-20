# Electron App Setup Guide

## Prerequisites

- Node.js 18+ and pnpm
- Python 3.8+ (for native modules)

## Initial Setup

1. **From the monorepo root**, install dependencies:
   ```bash
   pnpm install
   ```

2. **The app will have:**
   - React 18 with TypeScript
   - Vite dev server on http://localhost:5173
   - Electron main process
   - Hot module replacement (HMR) enabled

## Running Development

```bash
# From monorepo root
pnpm -F @afw/app dev
```

This will:
1. Start Vite dev server on port 5173
2. Build Electron main and preload processes
3. Open Electron window with dev tools

## Building for Production

```bash
# From monorepo root
pnpm -F @afw/app build
```

This will:
1. Build React app with Vite
2. Build Electron main process
3. Package with electron-builder
4. Output to `dist/` and `dist-electron/`

## Project Structure Explained

### Electron Side
- **electron/main.ts** - Electron app lifecycle, window management, IPC handlers
- **electron/preload.ts** - Secure bridge between renderer and main process

### React Side
- **src/main.tsx** - React entry point
- **src/App.tsx** - Root React component
- **index.html** - HTML template

### Configuration
- **vite.config.ts** - Vite and Electron plugin setup
- **tsconfig.json** - TypeScript configuration
- **package.json** - Dependencies and build scripts

## Key Features

### Type Safety
- Full TypeScript support
- Type-safe IPC communication
- Global Window types defined in preload.ts

### Development Experience
- Hot Module Replacement (HMR) - changes instantly reload
- Dev tools in development mode
- Fast Vite bundling

### Security
- Context isolation enabled
- Node integration disabled
- Sandbox enabled for renderer
- IPC whitelist for safe channel communication

## Adding New IPC Channels

### 1. Add handler in electron/main.ts:
```typescript
ipcMain.handle('my-channel', async (event, data) => {
  // Handle the request
  return result
})
```

### 2. Add to whitelist in electron/preload.ts:
```typescript
const validChannels = ['ping', 'my-channel']
```

### 3. Use in React component:
```typescript
const result = await window.electron.ipcRenderer.invoke('my-channel', data)
```

## Troubleshooting

### Dev server not starting
- Check port 5173 is available
- Clear node_modules and reinstall: `pnpm install`

### Electron window not loading
- Check dev tools console for errors
- Verify preload.ts has correct path to main.ts

### HMR not working
- Ensure you're running with `pnpm dev` from monorepo root
- Check network conditions (some corporate firewalls block HMR)

### Build errors
- Clear dist directories: `rm -rf dist dist-electron`
- Reinstall: `pnpm install`
- Check Node.js version: `node --version` (needs 18+)

## Performance Tips

- Keep component tree shallow for better React performance
- Use React.memo for expensive components
- Lazy load heavy modules with React.lazy()
- Monitor bundle size with vite-plugin-visualizer

## Next Steps

1. Install dependencies: `pnpm install`
2. Start development: `pnpm -F @afw/app dev`
3. Open http://localhost:5173 in the Electron window
4. Begin building your app!
