import { ipcMain, BrowserWindow } from 'electron'

/** Registers IPC handlers for frameless window controls (minimize / close). */
export function registerWindowHandlers(getWindow: () => BrowserWindow | null): void {
  ipcMain.removeHandler('window:minimize')
  ipcMain.removeHandler('window:close')

  ipcMain.handle('window:minimize', () => {
    getWindow()?.minimize()
  })

  ipcMain.handle('window:close', () => {
    getWindow()?.close()
  })
}
