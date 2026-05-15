import { ElectronAPI } from '@electron-toolkit/preload'
import type { Env } from '@shared/types/env'
import type { UserInfo } from '@shared/types/auth'
import type { InstallResult } from '@shared/types/install'
import type { GameVersionInfo, VersionCheckResult } from '@shared/types/version'
import type { ServerStatusValue } from '@shared/types/game'

interface ServerStatusResult {
  status: ServerStatusValue
  players: number
  available: boolean
}

type AuthStateChangedPayload =
  | { env: Env; status: 'connected'; user: UserInfo }
  | { env: Env; status: 'error'; error: string }

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      selectDirectory: () => Promise<string | null>
      installGame: (env: Env, installPath: string) => Promise<InstallResult>
      onInstallProgress: (callback: (progress: number, label: string) => void) => void
      readChangelog: (installPath: string) => Promise<string | null>
      resolveInstalledVersion: (
        env: Env,
        installPath: string
      ) => Promise<InstallResult | null>
      clearGodotGameCache: () => Promise<{
        root: string
        removed: string[]
        skipped: string[]
        errors: { path: string; message: string }[]
      }>
      launchGame: (env: Env, installPath: string) => Promise<void>
      isGameRunning: () => Promise<boolean>
      onGameRunningChanged: (callback: (running: boolean) => void) => void
      getServerStatus: (env: Env) => Promise<ServerStatusResult>
      checkEnvAvailability: () => Promise<Record<Env, boolean>>
      quitApp: () => Promise<void>
      minimizeWindow: () => Promise<void>
      closeWindow: () => Promise<void>
      fitWindowToContent: (size: { width: number; height: number }) => Promise<void>
      checkVersions: () => Promise<VersionCheckResult>
      authLogin: (env: Env) => Promise<void>
      authLogout: (env: Env) => Promise<void>
      authLoadUser: (env: Env) => Promise<UserInfo | null>
      onAuthStateChanged: (callback: (data: AuthStateChangedPayload) => void) => void
    }
  }
}

export {}
