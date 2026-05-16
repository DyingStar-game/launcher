import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { Env } from '@shared/types/env'
import type { InstallProgressLabel } from '@shared/types/installProgress'
import type { UserInfo } from '@shared/types/auth'
import type { ServerStatusValue } from '@shared/types/game'

/**
 * Renderer-facing API exposed as `window.api`.
 * Each method maps to an `ipcMain.handle` in the main process.
 */
const api = {
  /** Opens a native folder picker; returns the chosen path or null if cancelled. */
  selectDirectory: (): Promise<string | null> => ipcRenderer.invoke('files:select-directory'),

  /** Downloads and extracts the game ZIP; returns installed version metadata. */
  installGame: (env: Env, installPath: string): Promise<{ version: string; releaseDate: string }> =>
    ipcRenderer.invoke('files:install', env, installPath),

  /** Subscribes to install/download progress events (0–100 and structured label). */
  onInstallProgress: (callback: (progress: number, label: InstallProgressLabel) => void): void => {
    ipcRenderer.removeAllListeners('files:progress')
    ipcRenderer.on('files:progress', (_event, progress: number, label: InstallProgressLabel) => {
      callback(progress, label)
    })
  },

  /** Reads CHANGELOG.md from the install directory, if present. */
  readChangelog: (installPath: string): Promise<string | null> =>
    ipcRenderer.invoke('files:read-changelog', installPath),

  /** Re-resolves installed version from disk and remote API after install or on demand. */
  resolveInstalledVersion: (
    env: Env,
    installPath: string
  ): Promise<{ version: string; releaseDate: string } | null> =>
    ipcRenderer.invoke('files:resolve-installed-version', env, installPath),

  /** Clears Godot shader/chunk caches under the DyingStar userdata folder. */
  clearGodotGameCache: (): Promise<{
    root: string
    removed: string[]
    skipped: string[]
    errors: { path: string; message: string }[]
  }> => ipcRenderer.invoke('files:clear-godot-cache'),

  /** Spawns the game executable with a fresh JWT (`--token=<jwt>`). */
  launchGame: (env: Env, installPath: string): Promise<void> =>
    ipcRenderer.invoke('game:launch', env, installPath),

  /** Returns whether a game process launched by the launcher is still running. */
  isGameRunning: (): Promise<boolean> => ipcRenderer.invoke('game:is-running'),

  /** Subscribes to changes in game running state (launch / exit). */
  onGameRunningChanged: (callback: (running: boolean) => void): void => {
    ipcRenderer.removeAllListeners('game:running-changed')
    ipcRenderer.on('game:running-changed', (_event, payload: { running: boolean }) => {
      callback(payload.running)
    })
  },

  /** Fetches server status and connected player count for an environment. */
  getServerStatus: (
    env: Env
  ): Promise<{ status: ServerStatusValue; players: number; available: boolean }> =>
    ipcRenderer.invoke('game:get-server-status', env),

  /** Pings each env API `/version` to determine runtime availability at startup. */
  checkEnvAvailability: (): Promise<Record<Env, boolean>> =>
    ipcRenderer.invoke('env:check-availability'),

  /** Quits the entire application. */
  quitApp: (): Promise<void> => ipcRenderer.invoke('app:quit'),

  /** Minimizes the main window (frameless chrome). */
  minimizeWindow: (): Promise<void> => ipcRenderer.invoke('window:minimize'),

  /** Closes the main window. */
  closeWindow: (): Promise<void> => ipcRenderer.invoke('window:close'),

  /** Compares launcher and game versions against remote sources. */
  checkVersions: (): Promise<{
    currentLauncherVersion: string
    latestLauncherVersion: string | null
    latestLauncherReleaseDate: string | null
    launcherUpdateAvailable: boolean
    latestGameVersions: Record<Env, { version: string | null; releaseDate: string | null }>
  }> => ipcRenderer.invoke('version:check'),

  /** Opens the system browser on the Keycloak Discord login page. */
  authLogin: (env: Env): Promise<void> => ipcRenderer.invoke('auth:login', env),

  /** Clears stored tokens and opens Keycloak logout. */
  authLogout: (env: Env): Promise<void> => ipcRenderer.invoke('auth:logout', env),

  /** Refreshes the session and returns the user profile, or null if logged out. */
  authLoadUser: (env: Env): Promise<UserInfo | null> => ipcRenderer.invoke('auth:load-user', env),

  /** Subscribes to auth state changes after login, logout, or OAuth callback. */
  onAuthStateChanged: (
    callback: (
      data:
        | { env: Env; status: 'connected'; user: UserInfo }
        | { env: Env; status: 'error'; error: string }
    ) => void
  ): void => {
    ipcRenderer.removeAllListeners('auth:state-changed')
    ipcRenderer.on('auth:state-changed', (_event, data) => callback(data))
  }
}

/** Exposes safe APIs to the renderer (isolated context) or assigns to window in dev. */
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('[Preload]', error)
  }
} else {
  // @ts-expect-error non-isolated fallback assigns globals on window for debugging
  window.electron = electronAPI
  // @ts-expect-error non-isolated fallback assigns globals on window for debugging
  window.api = api
}
