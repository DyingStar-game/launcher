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

type ServerStatus = 'online' | 'offline' | 'degraded' | 'checking'

interface ServerStatusResult {
  status: ServerStatus
  players: number
  statusPageUrl: string
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

// ─── Mock statuts serveur par env ─────────────────────────────────────────────

const SERVER_STATUS: Record<Env, ServerStatusResult> = {
  'universe': {
    status: 'online',
    players: 42,
    statusPageUrl: 'https://status.dyingstar.example.com'
  },
  'universe-testing': {
    status: 'online',
    players: 7,
    statusPageUrl: 'https://status-testing.dyingstar.example.com'
  }
}

// ─── Handlers IPC ─────────────────────────────────────────────────────────────

export function registerFilesHandlers(win: BrowserWindow): void {

  // ── Sélection du répertoire d'installation ─────────────────────────────────
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
  ipcMain.handle('files:install', async (_event, env: Env, installPath: string) => {
    if (!installPath || typeof installPath !== 'string') {
      throw new Error("Chemin d'installation invalide.")
    }
    // Le résultat InstallResult est sérialisé et renvoyé au renderer
    return await downloadAndInstall(env, installPath, win)
  })

  // ── Lancement du jeu ───────────────────────────────────────────────────────
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

  // ── Statut du serveur par env ──────────────────────────────────────────────
  ipcMain.handle('game:get-server-status', async (_event, env: Env): Promise<ServerStatusResult> => {
    // TODO: vrai appel HTTP selon l'env
    return SERVER_STATUS[env]
  })

  // ── État du jeu ────────────────────────────────────────────────────────────
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