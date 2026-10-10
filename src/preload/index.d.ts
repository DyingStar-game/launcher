import { ElectronAPI } from '@electron-toolkit/preload'
import type { Env } from '@shared/types/env'
import type { UserInfo } from '@shared/types/auth'
import type { InstallResult } from '@shared/types/install'
import type { VersionCheckResult } from '@shared/types/version'
import type { ServerStatusValue } from '@shared/types/game'
import type { GlobalChangelog } from '@shared/types/changelog'
import type { InstallProgressLabel } from '@shared/types/installProgress'
import type {
  FriendRequestOutcome,
  JoinOutcome,
  PlayerSearchResult,
  SocialResult,
  SocialSnapshot
} from '@shared/types/social'

/** Server status payload returned by `getServerStatus`. */
interface ServerStatusResult {
  status: ServerStatusValue
  players: number
  available: boolean
}

/** Auth event pushed from main after OAuth callback or error. */
type AuthStateChangedPayload =
  | { env: Env; status: 'connected'; user: UserInfo }
  | { env: Env; status: 'disconnected'; reason?: 'session_expired' }
  | { env: Env; status: 'error'; error: string }

declare global {
  interface Window {
    electron: ElectronAPI
    /** Typed bridge to main-process IPC handlers (see `preload/index.ts`). */
    api: {
      selectDirectory: () => Promise<string | null>
      installGame: (env: Env, installPath: string) => Promise<InstallResult>
      onInstallProgress: (callback: (progress: number, label: InstallProgressLabel) => void) => void
      fetchChangelog: () => Promise<GlobalChangelog | null>
      resolveInstalledVersion: (env: Env, installPath: string) => Promise<InstallResult | null>
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
      toggleFullscreen: () => Promise<boolean>
      isFullscreen: () => Promise<boolean>
      onFullscreenChanged: (callback: (fullscreen: boolean) => void) => void
      closeWindow: () => Promise<void>
      checkVersions: () => Promise<VersionCheckResult>
      authLogin: (env: Env) => Promise<void>
      authCancelLogin: (env: Env) => Promise<void>
      authLogout: (env: Env) => Promise<void>
      authLoadUser: (env: Env) => Promise<UserInfo | null>
      onAuthStateChanged: (callback: (data: AuthStateChangedPayload) => void) => void
      socialLoad: (env: Env, search?: string) => Promise<SocialResult<SocialSnapshot>>
      socialSearchPlayers: (env: Env, query: string) => Promise<SocialResult<PlayerSearchResult[]>>
      socialSendFriendRequest: (
        env: Env,
        playerId: string
      ) => Promise<SocialResult<FriendRequestOutcome>>
      socialRemoveFriend: (env: Env, playerId: string) => Promise<SocialResult<void>>
      socialAcceptRequest: (env: Env, requestId: number) => Promise<SocialResult<void>>
      socialDeclineRequest: (env: Env, requestId: number) => Promise<SocialResult<void>>
      socialJoinOrganisation: (
        env: Env,
        corporationId: string
      ) => Promise<SocialResult<JoinOutcome>>
      socialCreateOrganisation: (
        env: Env,
        name: string,
        ticker: string
      ) => Promise<SocialResult<void>>
    }
  }
}

export {}
