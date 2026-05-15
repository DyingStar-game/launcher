import { ipcMain, BrowserWindow } from 'electron'
import { parsePositiveInt } from '../config/constants'

const MIN_WIDTH = parsePositiveInt(import.meta.env.VITE_WINDOW_WIDTH, 1200)
const MIN_HEIGHT = parsePositiveInt(import.meta.env.VITE_WINDOW_HEIGHT, 800)
const MAX_WIDTH = parsePositiveInt(import.meta.env.VITE_WINDOW_MAX_WIDTH, 1920)
const MAX_HEIGHT = parsePositiveInt(import.meta.env.VITE_WINDOW_MAX_HEIGHT, 1200)

/** Registers IPC handlers for frameless window controls and auto-resize. */
export function registerWindowHandlers(getWindow: () => BrowserWindow | null): void {
  ipcMain.removeHandler('window:minimize')
  ipcMain.removeHandler('window:close')
  ipcMain.removeHandler('window:fit-content')

  ipcMain.handle('window:minimize', () => {
    getWindow()?.minimize()
  })

  ipcMain.handle('window:close', () => {
    getWindow()?.close()
  })

  ipcMain.handle('window:fit-content', (_event, size: { width: number; height: number }) => {
    const win = getWindow()
    if (!win) return

    const width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.ceil(size.width)))
    const height = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.ceil(size.height)))
    const [currentW, currentH] = win.getSize()

    if (width !== currentW || height !== currentH) {
      win.setSize(width, height)
    }
  })
}

export { MIN_WIDTH, MIN_HEIGHT }
