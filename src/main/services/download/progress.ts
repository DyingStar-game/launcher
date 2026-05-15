import type { BrowserWindow } from 'electron'
import type { InstallProgressLabel } from '@shared/types/installProgress'

/** Sends install/download progress to the renderer (0–100 and structured label key). */
export function sendProgress(
  win: BrowserWindow,
  progress: number,
  label: InstallProgressLabel
): void {
  if (win.isDestroyed()) return
  win.webContents.send('files:progress', Math.min(100, Math.round(progress)), label)
}
