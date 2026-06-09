import { app } from 'electron'

function isLinuxGpuMitigationEnabled(): boolean {
  const raw = (import.meta.env.VITE_ELECTRON_DISABLE_GPU_LINUX ?? '').trim().toLowerCase()
  if (raw === 'false' || raw === '0' || raw === 'no') return false
  if (raw === 'true' || raw === '1' || raw === 'yes') return true
  return process.platform === 'linux'
}

/**
 * Linux AppImage: disable GPU / accelerated video decode to avoid driver quirks.
 * Must run before `app.whenReady()` (and before creating any BrowserWindow).
 */
export function applyLinuxGpuWorkarounds(): void {
  if (!isLinuxGpuMitigationEnabled()) return

  app.disableHardwareAcceleration()
  app.commandLine.appendSwitch('disable-accelerated-video-decode')
  app.commandLine.appendSwitch('disable-gpu')
}

/** Call once at startup, before the app ready event. */
export function applyPlatformDisplayFlags(): void {
  applyLinuxGpuWorkarounds()
}
