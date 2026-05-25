import { join } from 'path'
import { app, BrowserWindow, ipcMain, protocol, net } from 'electron'
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
  // Handle file:// protocol for loading local Live2D models
  protocol.handle('file', (request) => {
    const url = request.url.replace('file://', '')
    return net.fetch('file://' + url)
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
      // Allow background throttling to reduce CPU usage when idle
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
