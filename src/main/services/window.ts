import { ipcMain, BrowserWindow } from 'electron'

const fullscreenBoundWindows = new WeakSet<BrowserWindow>()

function bindFullscreenEvents(win: BrowserWindow): void {
  if (fullscreenBoundWindows.has(win)) return
  fullscreenBoundWindows.add(win)
  win.on('enter-full-screen', () => {
    win.webContents.send('window:fullscreen-changed', true)
  })
  win.on('leave-full-screen', () => {
    win.webContents.send('window:fullscreen-changed', false)
  })
}

/** Registers IPC handlers for frameless window controls (minimize / fullscreen / close). */
export function registerWindowHandlers(getWindow: () => BrowserWindow | null): void {
  ipcMain.removeHandler('window:minimize')
  ipcMain.removeHandler('window:toggle-fullscreen')
  ipcMain.removeHandler('window:is-fullscreen')
  ipcMain.removeHandler('window:close')

  ipcMain.handle('window:minimize', () => {
    getWindow()?.minimize()
  })

  ipcMain.handle('window:toggle-fullscreen', () => {
    const win = getWindow()
    if (!win) return false
    const next = !win.isFullScreen()
    win.setFullScreen(next)
    return next
  })

  ipcMain.handle('window:is-fullscreen', () => getWindow()?.isFullScreen() ?? false)

  ipcMain.handle('window:close', () => {
    getWindow()?.close()
  })

  const win = getWindow()
  if (win) bindFullscreenEvents(win)
}
