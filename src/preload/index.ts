import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { Env } from '../renderer/store/env'
import type { UserInfo } from '../main/services/auth'
import type { ServerStatusValue } from '../main/services/gameStatus'

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

  readChangelog: (installPath: string): Promise<string | null> =>
    ipcRenderer.invoke('files:read-changelog', installPath),

  resolveInstalledVersion: (
    env: Env,
    installPath: string
  ): Promise<{ version: string; releaseDate: string } | null> =>
    ipcRenderer.invoke('files:resolve-installed-version', env, installPath),

  clearGodotGameCache: (): Promise<{
    root: string
    removed: string[]
    skipped: string[]
    errors: { path: string; message: string }[]
  }> => ipcRenderer.invoke('files:clear-godot-cache'),

  // ── Jeu ───────────────────────────────────────────────────────────────────

  launchGame: (env: Env, installPath: string): Promise<void> =>
    ipcRenderer.invoke('game:launch', env, installPath),

  isGameRunning: (): Promise<boolean> =>
    ipcRenderer.invoke('game:is-running'),

  onGameRunningChanged: (callback: (running: boolean) => void): void => {
    ipcRenderer.removeAllListeners('game:running-changed')
    ipcRenderer.on('game:running-changed', (_event, payload: { running: boolean }) => {
      callback(payload.running)
    })
  },

  getServerStatus: (env: Env): Promise<{ status: ServerStatusValue; players: number; available: boolean }> =>
    ipcRenderer.invoke('game:get-server-status', env),

  // ── Disponibilité des envs (ping au démarrage) ────────────────────────────

  checkEnvAvailability: (): Promise<Record<Env, boolean>> =>
    ipcRenderer.invoke('env:check-availability'),

  quitApp: (): Promise<void> => ipcRenderer.invoke('app:quit'),

  minimizeWindow: (): Promise<void> => ipcRenderer.invoke('window:minimize'),

  closeWindow: (): Promise<void> => ipcRenderer.invoke('window:close'),

  fitWindowToContent: (size: { width: number; height: number }): Promise<void> =>
    ipcRenderer.invoke('window:fit-content', size),

  // ── Versions ──────────────────────────────────────────────────────────────

  checkVersions: (): Promise<{
    currentLauncherVersion:    string
    latestLauncherVersion:     string | null
    latestLauncherReleaseDate: string | null
    launcherUpdateAvailable:   boolean
    latestGameVersions:        Record<Env, { version: string | null; releaseDate: string | null }>
  }> =>
    ipcRenderer.invoke('version:check'),

  // ── Auth ──────────────────────────────────────────────────────────────────

  authLogin: (env: Env): Promise<void> =>
    ipcRenderer.invoke('auth:login', env),

  authLogout: (env: Env): Promise<void> =>
    ipcRenderer.invoke('auth:logout', env),

  authLoadUser: (env: Env): Promise<UserInfo | null> =>
    ipcRenderer.invoke('auth:load-user', env),

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