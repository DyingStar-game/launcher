import { ipcMain, BrowserWindow } from 'electron'

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}

const MIN_WIDTH  = parsePositiveInt(import.meta.env.VITE_WINDOW_WIDTH, 1200)
const MIN_HEIGHT = parsePositiveInt(import.meta.env.VITE_WINDOW_HEIGHT, 800)
const MAX_WIDTH  = 1920
const MAX_HEIGHT = 1200

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
