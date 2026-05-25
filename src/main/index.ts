import { join } from 'path'
import { app, BrowserWindow, ipcMain } from 'electron'
import { createServer } from 'http'
import { readFileSync } from 'fs'
import windowStateKeeper from 'electron-window-state'

import './initConfig'
import initTray from './tray'
import { createWindow, winPagePathMap } from './window'

// Force native Wayland - no XWayland fallback
app.commandLine.appendSwitch('ozone-platform', 'wayland')

// Use ANGLE with OpenGL ES backend via EGL for WebGL on Wayland
app.commandLine.appendSwitch('use-gl', 'angle')
app.commandLine.appendSwitch('use-angle', 'opengles')
// Allow SwiftShader software fallback if hardware WebGL fails
app.commandLine.appendSwitch('enable-unsafe-swiftshader')

const MODEL_PORT = 19999

const MIME_MAP: Record<string, string> = {
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.moc': 'application/octet-stream',
  '.moc3': 'application/octet-stream',
  '.mtl': 'text/plain',
  '.dat': 'application/octet-stream',
  '.fnt': 'application/octet-stream',
  '.dds': 'application/octet-stream',
  '.bin': 'application/octet-stream',
}

// Local HTTP server to serve Live2D model files
function startModelServer() {
  const server = createServer((req, res) => {
    // Decode and sanitize path
    let filePath = decodeURIComponent(req.url || '/')
    // Route: /model/... -> serve from filesystem root /
    // But we only allow absolute paths for safety
    if (!filePath.startsWith('/')) {
      res.writeHead(400)
      res.end('Bad request')
      return
    }

    // Security: disallow path traversal
    if (filePath.includes('..')) {
      res.writeHead(403)
      res.end('Forbidden')
      return
    }

    try {
      const data = readFileSync(filePath)
      const ext = filePath.slice(filePath.lastIndexOf('.'))
      const mime = MIME_MAP[ext] || 'application/octet-stream'
      res.writeHead(200, {
        'Content-Type': mime,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      })
      res.end(data)
    } catch {
      res.writeHead(404)
      res.end('Not found')
    }
  })

  server.listen(MODEL_PORT, '127.0.0.1')
  return server
}

if (app.isPackaged) {
  if (!app.requestSingleInstanceLock()) {
    app.quit()
    process.exit(0)
  }
}

let mainWindowState: windowStateKeeper.State

app.whenReady().then(async () => {
  // Start local model server
  startModelServer()

  // Set up IPC handlers
  ipcMain.on('get-config', (event) => {
    event.returnValue = (global as any).config
  })

  ipcMain.handle('is-resizable', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return win?.isResizable() ?? false
  })

  ipcMain.on('set-resizable', (_event, resizable: boolean) => {
    const win = BrowserWindow.fromWebContents(_event.sender)
    win?.setResizable(resizable)
  })

  mainWindowState = windowStateKeeper({
    defaultHeight: 600,
    defaultWidth: 350,
  })

  const options: Electron.BrowserWindowConstructorOptions = {
    title: 'PPet',
    alwaysOnTop: true,
    autoHideMenuBar: true,
    hasShadow: false,
    transparent: true,
    frame: false,
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    skipTaskbar: true,
    minimizable: false,
    maximizable: false,
    resizable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      webSecurity: false,
      sandbox: false,
      backgroundThrottling: true,
    },
  }

  const win = await createWindow(options)
  if (win) {
    mainWindowState.manage(win)
    initTray(win)
  }
})

app.on('window-all-closed', () => {
  winPagePathMap.clear()
  app.quit()
})

app.on('second-instance', () => {
  const win = BrowserWindow.getAllWindows()[0]
  if (win) {
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  }
})
