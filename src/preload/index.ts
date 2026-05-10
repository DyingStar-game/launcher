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
    latestGameVersions: Record<Env, { version: string | null; releaseDate: string | null }>
  }> =>
    ipcRenderer.invoke('version:check'),

  // ── Auth ──────────────────────────────────────────────────────────────────

  /** Ouvre le navigateur sur la page Discord/Keycloak pour l'env donné. */
  authLogin: (env: Env): Promise<void> =>
    ipcRenderer.invoke('auth:login', env),

  /** Efface les tokens de l'env donné et ouvre la page de déconnexion Keycloak. */
  authLogout: (env: Env): Promise<void> =>
    ipcRenderer.invoke('auth:logout', env),

  /** Recharge la session depuis le stockage chiffré pour l'env donné. */
  authLoadUser: (env: Env): Promise<UserInfo | null> =>
    ipcRenderer.invoke('auth:load-user', env),

  /** S'abonne aux changements d'état auth — le payload inclut l'env concerné. */
  onAuthStateChanged: (
    callback: (data:
      | { env: Env; status: 'connected'; user: UserInfo }
      | { env: Env; status: 'error'; error: string }
    ) => void
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