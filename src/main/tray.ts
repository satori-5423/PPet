import { join } from 'path'
import {
  Tray,
  nativeImage,
  app,
  MenuItemConstructorOptions,
  MenuItem,
  shell,
  BrowserWindow,
  Menu,
} from 'electron'
import { config } from '@src/common'
import { readdirSync } from 'fs'

import { createWindow } from './window'
import trayIcon from '../../static/icons/tray.png'

const langs = {
  zh: {
    alwaysOnTop: '@置顶',
    ignoreMouseEvents: '忽略点击',
    openAtLogin: '开机启动',
    tools: '小工具',
    language: '语言',
    zoomIn: '放大',
    zoomOut: '缩小',
    zoomReset: '原始大小',
    reRender: '重新渲染',
    debug: '调试',
    feedback: '反馈',
    about: '关于',
    quit: '退出',
    next: '下一个模型',
    prev: '上一个模型',
    models: '模型列表',
    scanDir: '扫描模型目录',
    settings: '配置',
  },
  en: {
    alwaysOnTop: 'Always On Top',
    ignoreMouseEvents: 'Ignore Mouse Events',
    openAtLogin: 'Open At Login',
    tools: 'Tools',
    language: 'Language',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    zoomReset: 'Zoom Reset',
    reRender: 'ReRender',
    debug: 'Debug',
    feedback: 'Feedback',
    about: 'About',
    quit: 'Quit',
    next: 'Next Model',
    prev: 'Prev Model',
    models: 'Model List',
    scanDir: 'Scan Model Dir',
    settings: 'Settings',
  },
}

type langType = 'zh' | 'en'

let tray: Tray | null = null

// Scan directory for model files and update model list
function scanModelDir(dirPath: string, mainWindow: BrowserWindow) {
  const results: string[] = []
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)
      if (entry.isDirectory()) {
        results.push(...scanAndCollect(fullPath))
      } else if (
        entry.name.endsWith('model.json') ||
        entry.name.endsWith('.model3.json')
      ) {
        results.push('http://127.0.0.1:19999/' + fullPath)
      }
    }
  } catch {
    // ignore
  }

  if (results.length > 0) {
    const modelsJson = JSON.stringify(results)
    mainWindow.webContents
      .executeJavaScript(
        `window.loadModels && window.loadModels(${modelsJson})`,
      )
      .catch(() => {})
  }
}

function scanAndCollect(dirPath: string): string[] {
  const results: string[] = []
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)
      if (entry.isDirectory()) {
        results.push(...scanAndCollect(fullPath))
      } else if (
        entry.name.endsWith('model.json') ||
        entry.name.endsWith('.model3.json')
      ) {
        results.push(fullPath)
      }
    }
  } catch {
    // ignore
  }
  return results
}

function getModelName(path: string): string {
  const parts = path.replace(/^.*:\/+/, '').split('/')
  return parts[parts.length - 2] || path
}

const initTray = (mainWindow: BrowserWindow) => {
  if (!tray) {
    tray = new Tray(nativeImage.createFromDataURL(trayIcon))
  }

  const handleClickLangRadio = (lang: langType) => {
    config.set('language', lang)
    initTray(mainWindow)
    mainWindow.webContents
      .executeJavaScript(`window.setLanguage && window.setLanguage('${lang}')`)
      .catch(() => {})
  }

  const alwaysOnTop = config.get('alwaysOnTop')
  const ignoreMouseEvents = config.get('ignoreMouseEvents')
  const showTool = config.get('showTool')
  const lang = config.get('language')

  const cl = langs[lang]
  mainWindow.setAlwaysOnTop(alwaysOnTop)
  mainWindow.setIgnoreMouseEvents(ignoreMouseEvents, { forward: true })

  // Build model list submenu from current model list
  const getModelSubmenu = (): Array<MenuItemConstructorOptions | MenuItem> => {
    const modelList = config.get('modelList') as string[] | undefined
    const modelPath = config.get('modelPath') as string | undefined
    if (!modelList || modelList.length === 0) {
      return [
        {
          label: '  (no models)',
          enabled: false,
        },
      ]
    }
    return modelList.map((path) => ({
      label: getModelName(path),
      type: 'radio' as const,
      checked: path === modelPath,
      click: () => {
        config.set('modelPath', path)
        mainWindow.webContents
          .executeJavaScript(`window.setModelPath && window.setModelPath('${path.replace(/'/g, "\\'")}')`)
          .catch(() => {})
      },
    }))
  }

  const template: Array<MenuItemConstructorOptions | MenuItem> = [
    {
      label: cl.models,
      type: 'submenu',
      submenu: getModelSubmenu(),
    },
    {
      type: 'separator',
    },
    {
      label: cl.alwaysOnTop,
      type: 'checkbox',
      checked: alwaysOnTop,
      click: (item) => {
        const { checked } = item
        mainWindow.setAlwaysOnTop(checked)
        config.set('alwaysOnTop', checked)
      },
    },
    {
      label: cl.tools,
      type: 'checkbox',
      accelerator: 'CmdOrCtrl+t',
      checked: showTool,
      click: (item) => {
        const { checked } = item
        mainWindow.webContents
          .executeJavaScript(`window.setSwitchTool && window.setSwitchTool(${checked})`)
          .catch(() => {})
        config.set('showTool', checked)
      },
    },
    {
      label: cl.ignoreMouseEvents,
      accelerator: 'CmdOrCtrl+i',
      type: 'checkbox',
      checked: ignoreMouseEvents,
      click: (item) => {
        const { checked } = item
        mainWindow.setIgnoreMouseEvents(checked, { forward: true })
        config.set('ignoreMouseEvents', checked)
      },
    },
    {
      type: 'separator',
    },
    {
      label: cl.prev,
      accelerator: 'CmdOrCtrl+p',
      click: () => {
        mainWindow.webContents
          .executeJavaScript('window.prevModel && window.prevModel()')
          .catch(() => {})
      },
    },
    {
      label: cl.next,
      accelerator: 'CmdOrCtrl+n',
      click: () => {
        mainWindow.webContents
          .executeJavaScript('window.nextModel && window.nextModel()')
          .catch(() => {})
      },
    },
    {
      label: cl.scanDir,
      click: () => {
        const dir =
          process.env.PPET_MODEL_DIR ||
          join(app.getPath('home'), 'GitHub', 'live2d-model-assets', 'assets')
        scanModelDir(dir, mainWindow)
      },
    },
    {
      type: 'separator',
    },
    {
      label: cl.language,
      type: 'submenu',
      submenu: [
        {
          label: '简体中文',
          type: 'radio',
          checked: lang === 'zh',
          click: handleClickLangRadio.bind(null, 'zh'),
        },
        {
          label: 'English',
          type: 'radio',
          checked: lang === 'en',
          click: handleClickLangRadio.bind(null, 'en'),
        },
      ],
    },
    {
      type: 'separator',
    },
    {
      label: cl.reRender,
      accelerator: 'CmdOrCtrl+r',
      click: () => {
        mainWindow.reload()
      },
    },
    {
      label: cl.debug,
      accelerator: 'CmdOrCtrl+d',
      click: () => {
        mainWindow.webContents.openDevTools({ mode: 'undocked' })
      },
    },
    {
      type: 'separator',
    },
    {
      label: cl.openAtLogin,
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => {
        const { checked } = item
        app.setLoginItemSettings({ openAtLogin: checked })
      },
    },
    {
      type: 'separator',
    },
    {
      label: cl.feedback,
      click: () => {
        shell.openExternal('https://github.com/zenghongtu/PPet/issues')
      },
    },
    {
      label: cl.about,
      role: 'about',
    },
    {
      type: 'separator',
    },
    {
      label: cl.quit,
      click: () => {
        app.quit()
      },
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  tray.setContextMenu(menu)
}

export default initTray
