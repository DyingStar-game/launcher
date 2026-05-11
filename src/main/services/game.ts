import { ipcMain, dialog, BrowserWindow } from 'electron'
import { spawn } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import { downloadAndInstall, GAME_INSTALL_SUBDIR } from './downloader'
import { loadFreshAccessToken } from './auth'
import { clearDyingStarGodotCaches } from './godotUserdataCache'
import type { Env } from '../../renderer/store/env'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GameState {
  installedVersion: string | null
  availableVersion: string | null
  releaseDate: string | null
  status: 'not-installed' | 'up-to-date' | 'update-available' | 'checking'
}

// ─── Exécutables par OS ───────────────────────────────────────────────────────

const GAME_EXECUTABLES: Partial<Record<NodeJS.Platform, string>> = {
  win32:  'DyingStar.exe',
  linux:  'DyingStar.x86_64',
  darwin: 'DyingStar.app'
}

function getGameRoot(installPath: string): string {
  return path.join(installPath, GAME_INSTALL_SUBDIR)
}

function getExecutablePath(installPath: string): string {
  const exe = GAME_EXECUTABLES[process.platform]
  if (!exe) throw new Error(`Plateforme non supportée : ${process.platform}`)
  const inPayload = path.join(getGameRoot(installPath), exe)
  if (fs.existsSync(inPayload)) return inPayload
  const legacy = path.join(installPath, exe)
  if (fs.existsSync(legacy)) return legacy
  return inPayload
}

/** Cherche CHANGELOG.md à la racine de `root` ou dans un seul niveau de sous-dossier (ZIP avec dossier racine). */
function findChangelogUnderRoot(root: string): string | null {
  const direct = path.join(root, 'CHANGELOG.md')
  try {
    if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct
  } catch {
    /* continue */
  }
  try {
    const entries = fs.readdirSync(root, { withFileTypes: true })
    for (const e of entries) {
      if (!e.isDirectory()) continue
      const nested = path.join(root, e.name, 'CHANGELOG.md')
      try {
        if (fs.existsSync(nested) && fs.statSync(nested).isFile()) return nested
      } catch {
        /* continue */
      }
    }
  } catch {
    return null
  }
  return null
}

/**
 * CHANGELOG : si le jeu est sous `…/DyingStar/`, on ne lit que là (pas un ancien fichier à la racine install).
 * Sinon installation legacy → racine `installPath`.
 */
function findChangelogPath(installPath: string): string | null {
  const resolved = path.resolve(installPath)
  const gameRoot = getGameRoot(resolved)
  try {
    if (fs.existsSync(gameRoot) && fs.statSync(gameRoot).isDirectory()) {
      return findChangelogUnderRoot(gameRoot)
    }
  } catch {
    /* fallback legacy */
  }
  return findChangelogUnderRoot(resolved)
}

// ─── Handlers IPC ─────────────────────────────────────────────────────────────

export function registerFilesHandlers(win: BrowserWindow): void {

  // ── Sélection du répertoire d'installation ─────────────────────────────────
  ipcMain.removeHandler('files:select-directory')
  ipcMain.handle('files:select-directory', async () => {
    const result = await dialog.showOpenDialog(win, {
      title: "Répertoire d'installation",
      buttonLabel: 'Choisir ce dossier',
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  // ── Téléchargement + installation → retourne { version, releaseDate } ──────
  ipcMain.removeHandler('files:install')
  ipcMain.handle('files:install', async (_event, env: Env, installPath: string) => {
    if (!installPath || typeof installPath !== 'string') {
      throw new Error("Chemin d'installation invalide.")
    }
    // Le résultat InstallResult est sérialisé et renvoyé au renderer
    return await downloadAndInstall(env, installPath, win)
  })

  // ── Lancement du jeu ───────────────────────────────────────────────────────
  ipcMain.removeHandler('game:launch')
  ipcMain.removeHandler('files:clear-godot-cache')
  ipcMain.handle('files:clear-godot-cache', async () => clearDyingStarGodotCaches())

  ipcMain.removeHandler('files:read-changelog')
  ipcMain.handle('files:read-changelog', async (_event, installPath: string): Promise<string | null> => {
    if (!installPath || typeof installPath !== 'string') return null
    const root = path.resolve(installPath)
    const changelogFile = findChangelogPath(root)
    if (!changelogFile) return null
    try {
      return fs.readFileSync(changelogFile, 'utf-8')
    } catch {
      return null
    }
  })

  ipcMain.handle('game:launch', async (_event, env: Env, installPath: string) => {
    const token = await loadFreshAccessToken(env)
    if (!token) {
      throw new Error('Vous devez être connecté pour lancer le jeu.')
    }

    const exePath = getExecutablePath(installPath)
    if (!fs.existsSync(exePath)) {
      throw new Error(`Exécutable introuvable : ${exePath}`)
    }
    if (process.platform === 'linux') fs.chmodSync(exePath, 0o755)

    const gameRoot = getGameRoot(installPath)
    const cwd = fs.existsSync(gameRoot) ? gameRoot : installPath

    const child = spawn(exePath, [`--token=${token}`], {
      detached: true,
      stdio: 'ignore',
      cwd
    })
    child.unref()
  })

  // ── État du jeu ────────────────────────────────────────────────────────────
  ipcMain.removeHandler('game:get-state')
  ipcMain.handle('game:get-state', async (_event, _env: Env): Promise<GameState> => {
    // TODO: lire version locale + interroger serveur
    return {
      installedVersion: null,
      availableVersion: '1.0.0',
      releaseDate: '2026-01-01',
      status: 'not-installed'
    }
  })
}