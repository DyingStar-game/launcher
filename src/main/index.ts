import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerFilesHandlers } from './services/game'
import { registerVersionHandlers } from './services/version'
import { registerGameStatusHandlers } from './services/gameStatus'
import { registerAuthHandlers, handleOAuthCallback } from './services/auth'
import { registerWindowHandlers, MIN_WIDTH, MIN_HEIGHT } from './services/window'
import log from 'electron-log'

// ─── Manage log (import.meta.env = valeurs figées au build, comme les autres VITE_*) ───
if (import.meta.env.VITE_ELECTRON_ENABLE_LOGGING === 'true') log.transports.file.level = 'debug'

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}

// ─── Custom protocol (must be set before app is ready) ────────────────────────
// In development, Electron is launched as `electron /path/to/main.js`; the
// protocol client must include the script path so the OS routes the callback
// back to this instance via a second-instance launch.

if (process.defaultApp && process.argv.length >= 2) {
  app.setAsDefaultProtocolClient('dyingstar', process.execPath, [path.resolve(process.argv[1])])
} else {
  app.setAsDefaultProtocolClient('dyingstar')
}

// ─── Linux: ensure xdg protocol handler is registered ────────────────────────
// Electron's setAsDefaultProtocolClient does not create the .desktop file on
// Linux in dev mode. We do it manually so the OS can route dyingstar:// back.

function registerLinuxProtocol(): void {
  if (process.platform !== 'linux') return

  const desktopDir = path.join(app.getPath('home'), '.local', 'share', 'applications')
  const desktopFile = path.join(desktopDir, 'dyingstar-launcher.desktop')

  const execLine = process.defaultApp && process.argv.length >= 2
    ? `${process.execPath} ${path.resolve(process.argv[1])} %U`
    : `${process.execPath} %U`

  const contents = [
    '[Desktop Entry]',
    'Type=Application',
    'Name=DyingStar Launcher',
    `Exec=${execLine}`,
    'MimeType=x-scheme-handler/dyingstar;',
    'NoDisplay=true',
  ].join('\n') + '\n'

  try {
    fs.mkdirSync(desktopDir, { recursive: true })
    fs.writeFileSync(desktopFile, contents, 'utf-8')

    try {
      execSync(`xdg-mime default dyingstar-launcher.desktop x-scheme-handler/dyingstar`)
    } catch {
      console.warn('[Protocol] xdg-mime not available, skipping mime association')
    }

    try {
      execSync(`update-desktop-database ${desktopDir}`)
    } catch {
      console.warn('[Protocol] update-desktop-database not available, skipping db update')
    }

    console.log('[Protocol] dyingstar:// registered via xdg')
  } catch (err) {
    console.error('[Protocol] Failed to register dyingstar:// handler:', err)
  }
}

// ─── macOS / Linux: app already running, URL opened externally ────────────────

app.on('open-url', (_event, url) => {
  handleOAuthCallback(url)
})

// ─── Windows: second instance spawned with the URL as argv ───────────────────

let mainWindow: BrowserWindow | null = null

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    const url = argv.find((a) => a.startsWith('dyingstar://'))
    if (url) handleOAuthCallback(url)
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width:  parsePositiveInt(import.meta.env.VITE_WINDOW_WIDTH, 1200),
    height: parsePositiveInt(import.meta.env.VITE_WINDOW_HEIGHT, 800),
    minWidth:  MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    frame: false,
    backgroundColor: '#0d0d14',
    title: app.getName(),
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  registerWindowHandlers(() => mainWindow)

  // Enregistrement des handlers IPC
  registerFilesHandlers(mainWindow)
  registerAuthHandlers(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
    if (import.meta.env.VITE_ENABLE_DEVTOOLS === 'true') mainWindow!.webContents.openDevTools()
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
  electronApp.setAppUserModelId('com.electron')

  registerLinuxProtocol()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.removeHandler('app:quit')
  ipcMain.handle('app:quit', () => {
    app.quit()
  })

  // Handlers indépendants de la fenêtre
  registerVersionHandlers()
  registerGameStatusHandlers()

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})