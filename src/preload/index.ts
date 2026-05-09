// src/preload/index.ts

import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  // ── Fichiers / Installation ──────────────────────────────────────────────

  /** Ouvre le dialogue natif de sélection de répertoire. */
  selectDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke('files:select-directory'),

  /** Lance le téléchargement et l'installation du jeu. */
  installGame: (installPath: string): Promise<void> =>
    ipcRenderer.invoke('files:install', installPath),

  /** S'abonne aux événements de progression de l'installation (0–100). */
  onInstallProgress: (callback: (progress: number, label: string) => void): void => {
    ipcRenderer.removeAllListeners('files:progress')
    ipcRenderer.on('files:progress', (_event, progress: number, label: string) => {
      callback(progress, label)
    })
  },

  // ── Jeu ──────────────────────────────────────────────────────────────────

  /** Lance l'exécutable du jeu depuis le répertoire d'installation. */
  launchGame: (installPath: string): Promise<void> =>
    ipcRenderer.invoke('game:launch', installPath),

  /** Récupère le statut du serveur de jeu et le nombre de joueurs connectés. */
  getServerStatus: (): Promise<{ status: 'online' | 'offline' | 'degraded' | 'checking'; players: number; statusPageUrl: string }> =>
    ipcRenderer.invoke('game:get-server-status'),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('[Preload]', error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}