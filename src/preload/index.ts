import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { Env } from '../renderer/store/env'

const api = {
  // ── Fichiers / Installation ────────────────────────────────────────────────

  selectDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke('files:select-directory'),

  installGame: (env: Env, installPath: string): Promise<void> =>
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
    ipcRenderer.invoke('game:get-server-status', env)
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