import { ipcMain, dialog, BrowserWindow } from 'electron'
import { spawn } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import { downloadAndInstall } from './downloader'

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
  darwin: 'DyingStar.app',        // TODO: ajuster selon le packaging macOS
}

function getExecutablePath(installPath: string): string {
  const exe = GAME_EXECUTABLES[process.platform]
  if (!exe) throw new Error(`Plateforme non supportée : ${process.platform}`)
  return path.join(installPath, exe)
}

// ─── Mock / données serveur ───────────────────────────────────────────────────

// TODO: remplacer par un vrai appel HTTP vers l'API de statut
const serverStatus: ServerStatusResult = {
  status: 'online',
  players: 42,
  statusPageUrl: 'https://status.dyingstar.example.com'
}

// ─── Handlers IPC ─────────────────────────────────────────────────────────────

/**
 * Enregistre tous les handlers IPC liés au jeu et à l'installation.
 * @param win  La fenêtre principale du launcher
 */
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

  // ── Téléchargement + installation ──────────────────────────────────────────
  ipcMain.handle('files:install', async (_event, installPath: string) => {
    if (!installPath || typeof installPath !== 'string') {
      throw new Error("Chemin d'installation invalide.")
    }
    await downloadAndInstall(installPath, win)
  })

  // ── Lancement du jeu ───────────────────────────────────────────────────────
  ipcMain.handle('game:launch', async (_event, installPath: string) => {
    const exePath = getExecutablePath(installPath)

    if (!fs.existsSync(exePath)) {
      throw new Error(`Exécutable introuvable : ${exePath}`)
    }

    // Sur Linux, s'assurer que le fichier est bien exécutable
    if (process.platform === 'linux') {
      fs.chmodSync(exePath, 0o755)
    }

    // Lancement détaché : le jeu tourne indépendamment du launcher
    const child = spawn(exePath, [], {
      detached: true,
      stdio: 'ignore',
      cwd: installPath       // répertoire de travail = dossier d'install
    })

    child.unref()            // libère le launcher du cycle de vie du jeu
  })

  // ── État du jeu (version installée vs disponible) ──────────────────────────
  ipcMain.handle('game:get-state', async (): Promise<GameState> => {
    // TODO: lire la version locale depuis le répertoire d'installation
    //       et interroger le serveur pour la version disponible
    return {
      installedVersion: null,
      availableVersion: '1.0.0',
      releaseDate: '2026-01-01',
      status: 'not-installed'
    }
  })

  // ── Statut du serveur de jeu ───────────────────────────────────────────────
  ipcMain.handle('game:get-server-status', async (): Promise<ServerStatusResult> => {
    // TODO: remplacer par un vrai appel HTTP vers l'API de statut
    return serverStatus
  })
}