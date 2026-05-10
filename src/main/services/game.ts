import { ipcMain, dialog, BrowserWindow } from 'electron'
import { spawn } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import { downloadAndInstall } from './downloader'
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

function getExecutablePath(installPath: string): string {
  const exe = GAME_EXECUTABLES[process.platform]
  if (!exe) throw new Error(`Plateforme non supportée : ${process.platform}`)
  return path.join(installPath, exe)
}

/** CHANGELOG.md à la racine du jeu ou dans un unique sous-dossier (ZIP avec dossier racine). */
function findChangelogPath(installPath: string): string | null {
  const direct = path.join(installPath, 'CHANGELOG.md')
  try {
    if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct
  } catch {
    return null
  }

  try {
    const entries = fs.readdirSync(installPath, { withFileTypes: true })
    for (const e of entries) {
      if (!e.isDirectory()) continue
      const nested = path.join(installPath, e.name, 'CHANGELOG.md')
      if (fs.existsSync(nested) && fs.statSync(nested).isFile()) return nested
    }
  } catch {
    return null
  }
  return null
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

  ipcMain.handle('game:launch', async (_event, _env: Env, installPath: string) => {
    const exePath = getExecutablePath(installPath)
    if (!fs.existsSync(exePath)) {
      throw new Error(`Exécutable introuvable : ${exePath}`)
    }
    if (process.platform === 'linux') fs.chmodSync(exePath, 0o755)

    const child = spawn(exePath, [], {
      detached: true,
      stdio: 'ignore',
      cwd: installPath
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