import { join } from 'path'
import { app, BrowserWindow, ipcMain, protocol } from 'electron'
import windowStateKeeper from 'electron-window-state'

import './initConfig'
import initTray from './tray'
import { createWindow, winPagePathMap } from './window'

if (app.isPackaged) {
  if (!app.requestSingleInstanceLock()) {
    app.quit()
    process.exit(0)
  }
}

let mainWindowState: windowStateKeeper.State

app
  .whenReady()
  .then(() => {
    protocol.registerFileProtocol('file', (request, callback) => {
      const url = request.url.replace('file://', '')
      const decodedUrl = decodeURI(url)
      try {
        return callback(decodedUrl)
      } catch (error) {
        console.error('Could not get file path:', error)
        return callback('404')
      }
    })
  })
  .then(() => {
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
  })
  .then(() => {
    mainWindowState = windowStateKeeper({
      defaultHeight: 600,
      defaultWidth: 350,
    })
  })
  .then(async () => {
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
        backgroundThrottling: false,
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
