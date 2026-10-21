import { ElectronAPI } from '@electron-toolkit/preload'
import type { Env } from '@shared/types/env'
import type { UserInfo } from '@shared/types/auth'
import type { InstallOutcome, InstallResult, PendingDownload } from '@shared/types/install'
import type { GameVersionInfo, VersionCheckResult } from '@shared/types/version'
import type { GameStatusResult } from '@shared/types/game'
import type { GlobalChangelog } from '@shared/types/changelog'
import type { InstallProgressLabel } from '@shared/types/installProgress'
import type {
  FriendRequestOutcome,
  InviteOutcome,
  JoinOutcome,
  OrganisationMembersPage,
  OrganisationPendingRequest,
  OrganisationRank,
  OrganisationProfile,
  OrganisationSearchResult,
  PlayerProfile,
  PlayerSearchResult,
  SocialResult,
  SocialSnapshot
} from '@shared/types/social'
import type {
  CreateOrganisationInput,
  OrganisationPatch,
  ProfilePatch,
  RankInput
} from '@shared/schemas/social'

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
      installGame: (env: Env, installPath: string) => Promise<InstallOutcome>
      pauseInstall: (env: Env) => Promise<boolean>
      cancelInstall: (env: Env, installPath: string) => Promise<boolean>
      pendingDownload: (env: Env, installPath: string) => Promise<PendingDownload | null>
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
      getServerStatus: (env: Env) => Promise<GameStatusResult>
      checkEnvAvailability: () => Promise<Record<Env, boolean>>
      checkAuthAvailability: (env: Env) => Promise<boolean | null>
      quitApp: () => Promise<void>
      minimizeWindow: () => Promise<void>
      toggleFullscreen: () => Promise<boolean>
      isFullscreen: () => Promise<boolean>
      onFullscreenChanged: (callback: (fullscreen: boolean) => void) => void
      closeWindow: () => Promise<void>
      checkVersions: () => Promise<VersionCheckResult>
      checkGameVersions: () => Promise<Record<Env, GameVersionInfo>>
      authLogin: (env: Env) => Promise<void>
      authCancelLogin: (env: Env) => Promise<void>
      authLogout: (env: Env) => Promise<void>
      authLoadUser: (env: Env) => Promise<UserInfo | null>
      onAuthStateChanged: (callback: (data: AuthStateChangedPayload) => void) => void
      socialLoad: (env: Env) => Promise<SocialResult<SocialSnapshot>>
      socialSearchOrganisations: (
        env: Env,
        query: string
      ) => Promise<SocialResult<OrganisationSearchResult[]>>
      socialSearchPlayers: (env: Env, query: string) => Promise<SocialResult<PlayerSearchResult[]>>
      socialGetPlayer: (env: Env, playerId: string) => Promise<SocialResult<PlayerProfile>>
      socialGetOrganisation: (
        env: Env,
        corporationId: string
      ) => Promise<SocialResult<OrganisationProfile>>
      socialGetOrganisationMembers: (
        env: Env,
        corporationId: string,
        offset: number
      ) => Promise<SocialResult<OrganisationMembersPage>>
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
        input: CreateOrganisationInput
      ) => Promise<SocialResult<void>>
      socialAnswerOrganisationInvitation: (
        env: Env,
        requestId: number,
        accept: boolean
      ) => Promise<SocialResult<void>>
      socialAnswerOrganisationRequest: (
        env: Env,
        corporationId: string,
        requestId: number,
        accept: boolean
      ) => Promise<SocialResult<void>>
      socialUpdateProfile: (env: Env, patch: ProfilePatch) => Promise<SocialResult<void>>
      socialUpdateOrganisation: (
        env: Env,
        corporationId: string,
        patch: OrganisationPatch
      ) => Promise<SocialResult<void>>
      socialGetOrganisationRequests: (
        env: Env,
        corporationId: string
      ) => Promise<SocialResult<OrganisationPendingRequest[]>>
      socialInviteToOrganisation: (
        env: Env,
        corporationId: string,
        playerId: string
      ) => Promise<SocialResult<InviteOutcome>>
      socialSetMemberRank: (
        env: Env,
        corporationId: string,
        playerId: string,
        rankId: number
      ) => Promise<SocialResult<void>>
      socialRemoveMember: (
        env: Env,
        corporationId: string,
        playerId: string
      ) => Promise<SocialResult<void>>
      socialGetOrganisationRanks: (
        env: Env,
        corporationId: string
      ) => Promise<SocialResult<OrganisationRank[]>>
      socialCreateRank: (
        env: Env,
        corporationId: string,
        rank: RankInput
      ) => Promise<SocialResult<void>>
      socialUpdateRank: (
        env: Env,
        corporationId: string,
        rankId: number,
        rank: RankInput
      ) => Promise<SocialResult<void>>
      socialDeleteRank: (
        env: Env,
        corporationId: string,
        rankId: number
      ) => Promise<SocialResult<void>>
      socialTransferOrganisation: (
        env: Env,
        corporationId: string,
        playerId: string
      ) => Promise<SocialResult<void>>
      socialDisbandOrganisation: (env: Env, corporationId: string) => Promise<SocialResult<void>>
    }
  }
}

export {}
