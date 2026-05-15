import { app, nativeImage } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

/** Icon file name for the current platform. */
function iconFileName(): string {
  if (process.platform === 'win32') return 'icon.ico'
  if (process.platform === 'darwin') return 'icon.icns'
  return 'icon.png'
}

/** Candidate icon paths (dev, preview, packaged build). */
function candidateIconPaths(): string[] {
  const name = iconFileName()
  const paths: string[] = []

  paths.push(join(__dirname, '../../resources', name))

  try {
    paths.push(join(app.getAppPath(), 'resources', name))
  } catch {
    /* app not ready yet */
  }

  if (process.resourcesPath) {
    paths.push(join(process.resourcesPath, name))
  }

  return paths
}

/** Absolute path to the launcher icon, or null when not found. */
export function resolveAppIconPath(): string | null {
  for (const p of candidateIconPaths()) {
    if (existsSync(p)) return p
  }
  return null
}

/** Loads the native image for BrowserWindow / tray use. */
export function loadAppIcon(): Electron.NativeImage | undefined {
  const iconPath = resolveAppIconPath()
  if (!iconPath) {
    if (is.dev) {
      console.warn('[Icon] Icon file not found — using default Electron taskbar icon.')
    }
    return undefined
  }
  const image = nativeImage.createFromPath(iconPath)
  return image.isEmpty() ? undefined : image
}

/** Applies the icon to the macOS dock when available. */
export function applyAppIcon(): void {
  const image = loadAppIcon()
  if (!image) return
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(image)
  }
}
