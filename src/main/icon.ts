import { app, nativeImage } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

/** Nom du fichier icône selon la plateforme. */
function iconFileName(): string {
  if (process.platform === 'win32') return 'icon.ico'
  if (process.platform === 'darwin') return 'icon.icns'
  return 'icon.png'
}

/** Chemins candidats (dev electron-vite, preview, build packagé). */
function candidateIconPaths(): string[] {
  const name = iconFileName()
  const paths: string[] = []

  // Dev / preview : `out/main` → `../../resources`
  paths.push(join(__dirname, '../../resources', name))

  // Racine du projet (app.getAppPath() en dev)
  try {
    paths.push(join(app.getAppPath(), 'resources', name))
  } catch {
    /* app pas encore prêt */
  }

  // Binaire packagé (extraResources)
  if (process.resourcesPath) {
    paths.push(join(process.resourcesPath, name))
  }

  return paths
}

/** Chemin absolu vers l’icône du launcher, ou null si introuvable. */
export function resolveAppIconPath(): string | null {
  for (const p of candidateIconPaths()) {
    if (existsSync(p)) return p
  }
  return null
}

export function loadAppIcon(): Electron.NativeImage | undefined {
  const iconPath = resolveAppIconPath()
  if (!iconPath) {
    if (is.dev) {
      console.warn('[Icon] Fichier icône introuvable — barre des tâches Electron par défaut.')
    }
    return undefined
  }
  const image = nativeImage.createFromPath(iconPath)
  return image.isEmpty() ? undefined : image
}

/** Icône dock macOS + cohérence globale. */
export function applyAppIcon(): void {
  const image = loadAppIcon()
  if (!image) return
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(image)
  }
}
