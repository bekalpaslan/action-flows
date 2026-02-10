import { app, BrowserWindow, ipcMain, Notification, Tray, Menu, nativeImage } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { fork, type ChildProcess } from 'child_process'
import http from 'http'
import isDev from 'electron-is-dev'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let backendProcess: ChildProcess | null = null
let isStoppingBackend = false

// ---------------------------------------------------------------------------
// Backend lifecycle management (production only)
// ---------------------------------------------------------------------------

function startBackend(): Promise<void> {
  if (isDev) {
    console.log('[main] Dev mode — skipping backend spawn (use pnpm dev:backend)')
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const backendEntry = path.join(process.resourcesPath, 'backend', 'dist', 'index.js')
    const frontendPath = path.join(process.resourcesPath, 'app-dist')
    const snapshotDir = path.join(app.getPath('userData'), 'snapshots')
    const backendDir = path.join(process.resourcesPath, 'backend')

    console.log(`[main] Starting backend: ${backendEntry}`)
    console.log(`[main] Backend CWD: ${backendDir}`)

    backendProcess = fork(backendEntry, [], {
      cwd: backendDir,
      env: {
        ...process.env,
        PORT: '3001',
        NODE_ENV: 'production',
        AFW_SERVE_FRONTEND: 'true',
        AFW_FRONTEND_PATH: frontendPath,
        AFW_SNAPSHOT_DIR: snapshotDir,
      },
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    })

    backendProcess.stdout?.on('data', (data: Buffer) => {
      console.log(`[backend:stdout] ${data.toString().trimEnd()}`)
    })

    backendProcess.stderr?.on('data', (data: Buffer) => {
      console.error(`[backend:stderr] ${data.toString().trimEnd()}`)
    })

    backendProcess.on('error', (err) => {
      console.error('[main] Backend process error:', err)
      reject(err)
    })

    backendProcess.on('exit', (code, signal) => {
      console.log(`[main] Backend exited — code=${code}, signal=${signal}`)
      backendProcess = null
    })

    // Resolve immediately — actual readiness is checked by waitForBackend()
    resolve()
  })
}

function waitForBackend(timeoutMs = 30_000, intervalMs = 500): Promise<void> {
  if (isDev) return Promise.resolve()

  const start = Date.now()

  return new Promise((resolve, reject) => {
    const poll = () => {
      if (!backendProcess) {
        reject(new Error('[main] Backend process exited during startup'))
        return
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`[main] Backend did not become ready within ${timeoutMs}ms`))
        return
      }

      const req = http.get('http://localhost:3001/health', (res) => {
        if (res.statusCode === 200) {
          console.log('[main] Backend is ready')
          resolve()
        } else {
          setTimeout(poll, intervalMs)
        }
      })

      req.on('error', () => {
        // Not ready yet — retry
        setTimeout(poll, intervalMs)
      })

      req.end()
    }

    poll()
  })
}

function stopBackend(): Promise<void> {
  if (!backendProcess) return Promise.resolve()

  return new Promise((resolve) => {
    const FORCE_KILL_TIMEOUT = 10_000

    const forceKillTimer = setTimeout(() => {
      console.warn('[main] Backend did not exit in time — force killing')
      if (backendProcess) {
        backendProcess.kill('SIGKILL')
        backendProcess = null
      }
      resolve()
    }, FORCE_KILL_TIMEOUT)

    backendProcess!.on('exit', () => {
      clearTimeout(forceKillTimer)
      backendProcess = null
      console.log('[main] Backend stopped gracefully')
      resolve()
    })

    // Use IPC for graceful shutdown — SIGTERM on Windows calls
    // TerminateProcess() which skips Node.js signal handlers.
    console.log('[main] Sending shutdown IPC to backend')
    backendProcess!.send({ type: 'shutdown' })
  })
}

function createTray() {
  // Create tray icon (use default icon for now)
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.focus()
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      },
    },
  ])

  tray.setToolTip('ActionFlows Workspace')
  tray.setContextMenu(contextMenu)

  // Show window on tray click
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()
      }
    }
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // In production the backend serves both API and frontend static files
    mainWindow.loadURL('http://localhost:3001')
  }

  // Minimize to tray instead of taskbar
  mainWindow.on('minimize', (event) => {
    event.preventDefault()
    mainWindow?.hide()
  })

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', async () => {
  try {
    await startBackend()
    await waitForBackend()
  } catch (err) {
    console.error('[main] Failed to start backend:', err)
    // Continue anyway — window can show an error state
  }

  createTray()
  createWindow()
})

app.on('before-quit', async (event) => {
  app.isQuitting = true

  if (backendProcess && !isStoppingBackend) {
    isStoppingBackend = true
    event.preventDefault()
    try {
      await stopBackend()
    } catch (err) {
      console.error('[main] Error stopping backend:', err)
    }
    // Backend is stopped — now actually quit
    app.quit()
  }
})

app.on('window-all-closed', () => {
  // Keep app running in background with tray icon
  // Don't quit on window close
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// IPC handlers
ipcMain.handle('ping', () => 'pong')

// Notification handler
ipcMain.handle('show-notification', (_event, { title, body, urgency = 'normal' }: {
  title: string;
  body: string;
  urgency?: 'normal' | 'critical' | 'low'
}) => {
  if (!Notification.isSupported()) {
    console.warn('Notifications are not supported on this platform')
    return false
  }

  const notification = new Notification({
    title,
    body,
    urgency,
    silent: urgency === 'low',
  })

  notification.show()

  notification.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  return true
})
