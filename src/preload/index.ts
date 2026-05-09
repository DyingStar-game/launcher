import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { Env } from '../renderer/store/env'
import type { UserInfo } from '../main/services/auth'

const api = {
  // ── Fichiers / Installation ────────────────────────────────────────────────

  selectDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke('files:select-directory'),

  installGame: (env: Env, installPath: string): Promise<{ version: string; releaseDate: string }> =>
    ipcRenderer.invoke('files:install', env, installPath),

  onInstallProgress: (callback: (progress: number, label: string) => void): void => {
    ipcRenderer.removeAllListeners('files:progress')
    ipcRenderer.on('files:progress', (_event, progress: number, label: string) => {
      callback(progress, label)
    })
  },

  // ── Jeu ───────────────────────────────────────────────────────────────────

  launchGame: (env: Env, installPath: string): Promise<void> =>
    ipcRenderer.invoke('game:launch', env, installPath),

  getServerStatus: (env: Env): Promise<{
    status: 'online' | 'offline' | 'degraded' | 'checking'
    players: number
    statusPageUrl: string
  }> =>
    ipcRenderer.invoke('game:get-server-status', env),

  // ── Versions ──────────────────────────────────────────────────────────────

  checkVersions: (): Promise<{
    currentLauncherVersion: string
    latestLauncherVersion: string
    launcherUpdateAvailable: boolean
    latestGameVersions: Record<Env, string | null>
  }> =>
    ipcRenderer.invoke('version:check'),

  // ── Auth ──────────────────────────────────────────────────────────────────

  /** Ouvre le navigateur sur la page Discord/Keycloak (login et création de compte). */
  authLogin: (): Promise<void> =>
    ipcRenderer.invoke('auth:login'),

  /** Efface les tokens locaux et ouvre la page de déconnexion Keycloak. */
  authLogout: (): Promise<void> =>
    ipcRenderer.invoke('auth:logout'),

  /** Recharge la session depuis le stockage chiffré. Retourne null si aucune session valide. */
  authLoadUser: (): Promise<UserInfo | null> =>
    ipcRenderer.invoke('auth:load-user'),

  /** S'abonne aux changements d'état d'authentification poussés depuis le main. */
  onAuthStateChanged: (
    callback: (data: { status: 'connected'; user: UserInfo } | { status: 'error'; error: string }) => void
  ): void => {
    ipcRenderer.removeAllListeners('auth:state-changed')
    ipcRenderer.on('auth:state-changed', (_event, data) => callback(data))
  }
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