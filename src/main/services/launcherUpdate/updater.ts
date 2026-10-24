import { app, ipcMain, type BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import type { LauncherUpdateState } from '@shared/types/launcherUpdate'
import { isAnyInstallRunning } from '../download'
import { isGameRunning } from '../game/processWatch'
import { canUpdateInPlace, readPackageType } from './support'

let launcherWindow: BrowserWindow | null = null
let state: LauncherUpdateState = { status: 'unsupported' }
let started = false

/** Stores the state and pushes it to the renderer on `launcher:update-state`. */
function setState(next: LauncherUpdateState): void {
  state = next
  if (launcherWindow && !launcherWindow.isDestroyed()) {
    launcherWindow.webContents.send('launcher:update-state', state)
  }
}

/** True while the update must wait: the game runs or a game install is in progress (ADR 0050). */
function updateMustWait(): boolean {
  return isGameRunning() || isAnyInstallRunning()
}

/** Checks the release once and downloads a newer launcher in the background. */
function startUpdater(): void {
  started = true
  const supported = canUpdateInPlace({
    packaged: app.isPackaged,
    platform: process.platform,
    appImage: process.env['APPIMAGE'],
    packageType: app.isPackaged ? readPackageType(process.resourcesPath) : null
  })
  if (!supported) return

  autoUpdater.logger = log
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => setState({ status: 'checking' }))
  autoUpdater.on('update-not-available', () => setState({ status: 'idle' }))
  autoUpdater.on('update-available', (info) =>
    setState({ status: 'downloading', version: info.version, percent: 0 })
  )
  autoUpdater.on('download-progress', (progress) => {
    if (state.status !== 'downloading') return
    setState({ ...state, percent: Math.floor(progress.percent) })
  })
  autoUpdater.on('update-downloaded', (info) =>
    setState({ status: 'ready', version: info.version })
  )
  autoUpdater.on('error', (err) => {
    log.warn('[LauncherUpdate]', err)
    setState({ status: 'error' })
  })

  // Read at quit time by electron-updater: a downloaded update waits for the next quit while the
  // game runs or installs
  app.on('before-quit', () => {
    autoUpdater.autoInstallOnAppQuit = !updateMustWait()
  })

  setState({ status: 'checking' })
  autoUpdater.checkForUpdates().catch(() => {
    // Reported by the `error` event
  })
}

/** Registers the launcher update handlers and starts the update check once (ADR 0050). */
export function registerLauncherUpdateHandlers(win: BrowserWindow): void {
  launcherWindow = win
  if (!started) startUpdater()

  ipcMain.removeHandler('launcher:get-update-state')
  ipcMain.handle('launcher:get-update-state', (): LauncherUpdateState => state)

  ipcMain.removeHandler('launcher:install-update')
  ipcMain.handle('launcher:install-update', (): boolean => {
    if (state.status !== 'ready' || updateMustWait()) return false
    // Silent install, then the new launcher starts
    autoUpdater.quitAndInstall(true, true)
    return true
  })
}
