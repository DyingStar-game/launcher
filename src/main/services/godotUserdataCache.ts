import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

const CACHE_DIR_NAMES = ['shader_cache', 'chunk_cache'] as const

/**
 * Dossier userdata Godot pour le projet « DyingStar » (même logique que le jeu).
 * - Linux : ~/.local/share/godot/app_userdata/DyingStar
 * - Windows : %AppData%/Godot/app_userdata/DyingStar (Roaming)
 * - macOS   : ~/Library/Application Support/Godot/app_userdata/DyingStar
 */
export function getDyingStarGodotUserdataRoot(): string {
  if (process.platform === 'linux') {
    return path.join(app.getPath('home'), '.local', 'share', 'godot', 'app_userdata', 'DyingStar')
  }
  if (process.platform === 'win32' || process.platform === 'darwin') {
    return path.join(app.getPath('appData'), 'Godot', 'app_userdata', 'DyingStar')
  }
  throw new Error(`Plateforme non supportée pour le cache Godot : ${process.platform}`)
}

export type ClearGodotCacheResult = {
  root:      string
  /** Chemins de dossiers effectivement supprimés */
  removed:   string[]
  /** Dossiers de cache absents (rien à faire) */
  skipped:   string[]
  /** Erreurs par chemin */
  errors:    { path: string; message: string }[]
}

function isExistingDirectory(p: string): boolean {
  try {
    if (!fs.existsSync(p)) return false
    return fs.statSync(p).isDirectory()
  } catch {
    return false
  }
}

/**
 * Supprime uniquement `shader_cache` et `chunk_cache` sous le userdata DyingStar.
 * Ne supprime que si le chemin existe et est un dossier (sinon ignoré, sans erreur bloquante).
 */
export function clearDyingStarGodotCaches(): ClearGodotCacheResult {
  const root = getDyingStarGodotUserdataRoot()
  const removed: string[] = []
  const skipped: string[] = []
  const errors: { path: string; message: string }[] = []

  if (!isExistingDirectory(root)) {
    for (const name of CACHE_DIR_NAMES) {
      skipped.push(path.join(root, name))
    }
    return { root, removed, skipped, errors }
  }

  for (const name of CACHE_DIR_NAMES) {
    const dir = path.join(root, name)
    try {
      if (!isExistingDirectory(dir)) {
        skipped.push(dir)
        continue
      }
      // Dernière vérif avant suppression (évite rm sur chemin disparu / concurrent)
      if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
        skipped.push(dir)
        continue
      }
      fs.rmSync(dir, { recursive: true, force: true })
      removed.push(dir)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      errors.push({ path: dir, message })
    }
  }

  return { root, removed, skipped, errors }
}
