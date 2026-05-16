import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { applyAppIcon, loadAppIcon } from './icon'
import { registerFilesHandlers } from './services/game'
import { registerVersionHandlers } from './services/version'
import { registerGameStatusHandlers } from './services/gameStatus'
import { registerAuthHandlers, handleOAuthCallback } from './services/auth'
import { registerWindowHandlers } from './services/window'
import { WINDOW_BOUNDS } from './config/window'
import { APP_PROTOCOL } from './config/constants'
import { registerLinuxProtocolHandler } from './protocol/linuxDesktop'
import log from 'electron-log'

if (import.meta.env.VITE_ELECTRON_ENABLE_LOGGING === 'true') {
  log.transports.file.level = 'debug'
}

/** Register custom protocol before app ready (dev needs script path in argv). */
if (process.defaultApp && process.argv.length >= 2) {
  app.setAsDefaultProtocolClient(APP_PROTOCOL, process.execPath, [path.resolve(process.argv[1])])
} else {
  app.setAsDefaultProtocolClient(APP_PROTOCOL)
}

/** macOS: OAuth callback URL opened while app is running. */
app.on('open-url', (_event, url) => {
  void handleOAuthCallback(url)
})

let mainWindow: BrowserWindow | null = null

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  /** Windows: second instance receives OAuth URL in argv. */
  app.on('second-instance', (_event, argv) => {
    const url = argv.find((a) => a.startsWith(`${APP_PROTOCOL}://`))
    if (url) void handleOAuthCallback(url)
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

/** Creates the main application window and registers IPC handlers bound to it. */
function createWindow(): void {
  const appIcon = loadAppIcon()

  mainWindow = new BrowserWindow({
    width: WINDOW_BOUNDS.width,
    height: WINDOW_BOUNDS.height,
    minWidth: WINDOW_BOUNDS.minWidth,
    minHeight: WINDOW_BOUNDS.minHeight,
    maxWidth: WINDOW_BOUNDS.maxWidth,
    maxHeight: WINDOW_BOUNDS.maxHeight,
    resizable: true,
    frame: false,
    backgroundColor: '#0d0d14',
    title: app.getName(),
    show: false,
    autoHideMenuBar: true,
    ...(appIcon ? { icon: appIcon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  registerWindowHandlers(() => mainWindow)
  registerFilesHandlers(mainWindow)
  registerAuthHandlers(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
    if (import.meta.env.VITE_ENABLE_DEVTOOLS === 'true') {
      mainWindow!.webContents.openDevTools()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.dyingstar.launcher')

  applyAppIcon()
  registerLinuxProtocolHandler()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.removeHandler('app:quit')
  ipcMain.handle('app:quit', () => {
    app.quit()
  })

  registerVersionHandlers()
  registerGameStatusHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
