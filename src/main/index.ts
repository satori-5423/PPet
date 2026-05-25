import { join } from 'path'
import { app, BrowserWindow, ipcMain, protocol } from 'electron'
import { readFile } from 'fs/promises'
import windowStateKeeper from 'electron-window-state'

import './initConfig'
import initTray from './tray'
import { createWindow, winPagePathMap } from './window'

// Force native Wayland - no XWayland fallback
app.commandLine.appendSwitch('ozone-platform', 'wayland')

// Use Vulkan backend via ANGLE for AMD GPU on Wayland
app.commandLine.appendSwitch('use-gl', 'angle')
app.commandLine.appendSwitch('use-angle', 'vulkan')

// Register privileged schemes before app is ready (required in Electron 25+)
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'file',
    privileges: {
      bypassCSP: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
])

if (app.isPackaged) {
  if (!app.requestSingleInstanceLock()) {
    app.quit()
    process.exit(0)
  }
}

let mainWindowState: windowStateKeeper.State

app.whenReady().then(async () => {
  // Handle file:// protocol by reading files directly and returning proper Response
  protocol.handle('file', async (request) => {
    try {
      const url = new URL(request.url)
      const filePath = decodeURIComponent(url.pathname)
      const data = await readFile(filePath)
      const ext = filePath.split('.').pop()?.toLowerCase() || ''
      const mimeTypes: Record<string, string> = {
        json: 'application/json',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        moc: 'application/octet-stream',
        moc3: 'application/octet-stream',
        mtl: 'text/plain',
      }
      return new Response(data, {
        headers: {
          'Content-Type': mimeTypes[ext] || 'application/octet-stream',
          'Access-Control-Allow-Origin': '*',
        },
      })
    } catch {
      return new Response('Not found', { status: 404 })
    }
  })

  // Set up IPC handlers before creating windows
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
