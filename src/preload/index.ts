import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { Env } from '@shared/types/env'
import type { GameVersionInfo, VersionCheckResult } from '@shared/types/version'
import type { InstallProgressLabel } from '@shared/types/installProgress'
import type { InstallOutcome, PendingDownload } from '@shared/types/install'
import type { UserInfo } from '@shared/types/auth'
import type { GameStatusResult } from '@shared/types/game'
import type { GlobalChangelog } from '@shared/types/changelog'
import type {
  Friend,
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

/**
 * Renderer-facing API exposed as `window.api`.
 * Each method maps to an `ipcMain.handle` in the main process.
 */
const api = {
  /** Opens a native folder picker; returns the chosen path or null if cancelled. */
  selectDirectory: (): Promise<string | null> => ipcRenderer.invoke('files:select-directory'),

  /**
   * Downloads (or resumes) and extracts the game ZIP; resolves to the installed version, or to how
   * the player stopped it (ADR 0036).
   */
  installGame: (env: Env, installPath: string): Promise<InstallOutcome> =>
    ipcRenderer.invoke('files:install', env, installPath),

  /** Pauses the environment's download, keeping it on disk; false once extracting. */
  pauseInstall: (env: Env): Promise<boolean> => ipcRenderer.invoke('files:pause-install', env),

  /** Cancels the environment's download, or removes a paused one; false once extracting. */
  cancelInstall: (env: Env, installPath: string): Promise<boolean> =>
    ipcRenderer.invoke('files:cancel-install', env, installPath),

  /** The environment's paused or interrupted download in the install folder, or null. */
  pendingDownload: (env: Env, installPath: string): Promise<PendingDownload | null> =>
    ipcRenderer.invoke('files:pending-download', env, installPath),

  /** Subscribes to install/download progress events (0–100 and structured label). */
  onInstallProgress: (callback: (progress: number, label: InstallProgressLabel) => void): void => {
    ipcRenderer.removeAllListeners('files:progress')
    ipcRenderer.on('files:progress', (_event, progress: number, label: InstallProgressLabel) => {
      callback(progress, label)
    })
  },

  /** Fetches the centralised changelog JSON. */
  fetchChangelog: (): Promise<GlobalChangelog | null> => ipcRenderer.invoke('changelog:fetch'),

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
  getServerStatus: (env: Env): Promise<GameStatusResult> =>
    ipcRenderer.invoke('game:get-server-status', env),

  /** Pings each env API `/version` to determine runtime availability at startup. */
  checkEnvAvailability: (): Promise<Record<Env, boolean>> =>
    ipcRenderer.invoke('env:check-availability'),

  /**
   * Whether the status page reports an environment's sign-in server up (ADR 0043), null when it
   * did not answer.
   */
  checkAuthAvailability: (env: Env): Promise<boolean | null> =>
    ipcRenderer.invoke('env:check-auth-availability', env),

  /** Quits the entire application. */
  quitApp: (): Promise<void> => ipcRenderer.invoke('app:quit'),

  /** Minimizes the main window (frameless chrome). */
  minimizeWindow: (): Promise<void> => ipcRenderer.invoke('window:minimize'),

  /** Toggles fullscreen and returns the new state. */
  toggleFullscreen: (): Promise<boolean> => ipcRenderer.invoke('window:toggle-fullscreen'),

  /** Returns whether the main window is currently fullscreen. */
  isFullscreen: (): Promise<boolean> => ipcRenderer.invoke('window:is-fullscreen'),

  /** Subscribes to fullscreen enter/leave events from the main process. */
  onFullscreenChanged: (callback: (fullscreen: boolean) => void): void => {
    ipcRenderer.on('window:fullscreen-changed', (_event, fullscreen: boolean) => {
      callback(fullscreen)
    })
  },

  /** Closes the main window. */
  closeWindow: (): Promise<void> => ipcRenderer.invoke('window:close'),

  /** Compares the launcher version with its latest release on GitHub. */
  checkVersions: (): Promise<VersionCheckResult> => ipcRenderer.invoke('version:check'),

  /** Fetches the latest game version of each environment (ADR 0039). */
  checkGameVersions: (): Promise<Record<Env, GameVersionInfo>> =>
    ipcRenderer.invoke('version:check-game'),

  /** Opens the Keycloak Discord sign-in page in the system browser. */
  authLogin: (env: Env): Promise<void> => ipcRenderer.invoke('auth:login', env),

  /** Cancels an in-flight sign-in: a callback arriving later is refused. */
  authCancelLogin: (env: Env): Promise<void> => ipcRenderer.invoke('auth:cancel-login', env),

  /** Signs out: clears stored tokens and ends the Keycloak session, in the background. */
  authLogout: (env: Env): Promise<void> => ipcRenderer.invoke('auth:logout', env),

  /** Refreshes the session and returns the user profile, or null if logged out. */
  authLoadUser: (env: Env): Promise<UserInfo | null> => ipcRenderer.invoke('auth:load-user', env),

  /** Subscribes to auth state changes after login, logout, or OAuth callback. */
  onAuthStateChanged: (
    callback: (
      data:
        | { env: Env; status: 'connected'; user: UserInfo }
        | { env: Env; status: 'disconnected'; reason?: 'session_expired' }
        | { env: Env; status: 'error'; error: string }
    ) => void
  ): void => {
    ipcRenderer.removeAllListeners('auth:state-changed')
    ipcRenderer.on('auth:state-changed', (_event, data) => callback(data))
  },

  /** Loads friends, friend requests, memberships and organisation requests from `social`. */
  socialLoad: (env: Env): Promise<SocialResult<SocialSnapshot>> =>
    ipcRenderer.invoke('social:load', env),

  /** Loads the friends alone, with their presence (ADR 0045). */
  socialLoadFriends: (env: Env): Promise<SocialResult<Friend[]>> =>
    ipcRenderer.invoke('social:load-friends', env),

  /** Finds organisations whose name or tag contains `query` (2 characters minimum). */
  socialSearchOrganisations: (
    env: Env,
    query: string
  ): Promise<SocialResult<OrganisationSearchResult[]>> =>
    ipcRenderer.invoke('social:search-organisations', env, query),

  /** Finds players whose display name contains `query` (2 characters minimum). */
  socialSearchPlayers: (env: Env, query: string): Promise<SocialResult<PlayerSearchResult[]>> =>
    ipcRenderer.invoke('social:search-players', env, query),

  /** Loads a player's public sheet. */
  socialGetPlayer: (env: Env, playerId: string): Promise<SocialResult<PlayerProfile>> =>
    ipcRenderer.invoke('social:get-player', env, playerId),

  /** Loads an organisation's public sheet. */
  socialGetOrganisation: (
    env: Env,
    corporationId: string
  ): Promise<SocialResult<OrganisationProfile>> =>
    ipcRenderer.invoke('social:get-organisation', env, corporationId),

  /** Loads one page of an organisation's members, highest rank first. */
  socialGetOrganisationMembers: (
    env: Env,
    corporationId: string,
    offset: number
  ): Promise<SocialResult<OrganisationMembersPage>> =>
    ipcRenderer.invoke('social:get-organisation-members', env, corporationId, offset),

  /** Sends a friend request (accepts a pending one from that player instead). */
  socialSendFriendRequest: (
    env: Env,
    playerId: string
  ): Promise<SocialResult<FriendRequestOutcome>> =>
    ipcRenderer.invoke('social:send-friend-request', env, playerId),

  /** Removes a friend. */
  socialRemoveFriend: (env: Env, playerId: string): Promise<SocialResult<void>> =>
    ipcRenderer.invoke('social:remove-friend', env, playerId),

  /** Accepts an incoming friend request. */
  socialAcceptRequest: (env: Env, requestId: number): Promise<SocialResult<void>> =>
    ipcRenderer.invoke('social:accept-request', env, requestId),

  /** Declines an incoming friend request or cancels an outgoing one. */
  socialDeclineRequest: (env: Env, requestId: number): Promise<SocialResult<void>> =>
    ipcRenderer.invoke('social:decline-request', env, requestId),

  /** Joins an open organisation or applies to one. */
  socialJoinOrganisation: (env: Env, corporationId: string): Promise<SocialResult<JoinOutcome>> =>
    ipcRenderer.invoke('social:join-organisation', env, corporationId),

  /** Creates an organisation (name + 2–5 character ticker). */
  socialCreateOrganisation: (
    env: Env,
    input: CreateOrganisationInput
  ): Promise<SocialResult<void>> => ipcRenderer.invoke('social:create-organisation', env, input),

  /** Answers an organisation request as the player: accept or decline an invitation, or withdraw an application. */
  socialAnswerOrganisationInvitation: (
    env: Env,
    requestId: number,
    accept: boolean
  ): Promise<SocialResult<void>> =>
    ipcRenderer.invoke('social:answer-organisation-invitation', env, requestId, accept),

  /** Accepts or declines an application received by an organisation the player recruits for. */
  socialAnswerOrganisationRequest: (
    env: Env,
    corporationId: string,
    requestId: number,
    accept: boolean
  ): Promise<SocialResult<void>> =>
    ipcRenderer.invoke('social:answer-organisation-request', env, corporationId, requestId, accept),

  /** Updates the player's own profile texts (only the fields in `patch`). */
  socialUpdateProfile: (env: Env, patch: ProfilePatch): Promise<SocialResult<void>> =>
    ipcRenderer.invoke('social:update-profile', env, patch),

  /** Edits an organisation's details (changed fields only). */
  socialUpdateOrganisation: (
    env: Env,
    corporationId: string,
    patch: OrganisationPatch
  ): Promise<SocialResult<void>> =>
    ipcRenderer.invoke('social:update-organisation', env, corporationId, patch),

  /** Pending applications and invitations of an organisation, for its managers. */
  socialGetOrganisationRequests: (
    env: Env,
    corporationId: string
  ): Promise<SocialResult<OrganisationPendingRequest[]>> =>
    ipcRenderer.invoke('social:get-organisation-requests', env, corporationId),

  /** Invites a player to an organisation. */
  socialInviteToOrganisation: (
    env: Env,
    corporationId: string,
    playerId: string
  ): Promise<SocialResult<InviteOutcome>> =>
    ipcRenderer.invoke('social:invite-to-organisation', env, corporationId, playerId),

  /** Gives a member another rank. */
  socialSetMemberRank: (
    env: Env,
    corporationId: string,
    playerId: string,
    rankId: number
  ): Promise<SocialResult<void>> =>
    ipcRenderer.invoke('social:set-member-rank', env, corporationId, playerId, rankId),

  /** Removes a member, or leaves when the id is the player's own. */
  socialRemoveMember: (
    env: Env,
    corporationId: string,
    playerId: string
  ): Promise<SocialResult<void>> =>
    ipcRenderer.invoke('social:remove-member', env, corporationId, playerId),

  /** An organisation's ranks, highest first. */
  socialGetOrganisationRanks: (
    env: Env,
    corporationId: string
  ): Promise<SocialResult<OrganisationRank[]>> =>
    ipcRenderer.invoke('social:get-organisation-ranks', env, corporationId),

  /** Creates a rank. */
  socialCreateRank: (
    env: Env,
    corporationId: string,
    rank: RankInput
  ): Promise<SocialResult<void>> =>
    ipcRenderer.invoke('social:create-rank', env, corporationId, rank),

  /** Edits a rank (the fields given only). */
  socialUpdateRank: (
    env: Env,
    corporationId: string,
    rankId: number,
    rank: RankInput
  ): Promise<SocialResult<void>> =>
    ipcRenderer.invoke('social:update-rank', env, corporationId, rankId, rank),

  /** Deletes a rank. */
  socialDeleteRank: (
    env: Env,
    corporationId: string,
    rankId: number
  ): Promise<SocialResult<void>> =>
    ipcRenderer.invoke('social:delete-rank', env, corporationId, rankId),

  /** Hands the leadership of an organisation to a member. */
  socialTransferOrganisation: (
    env: Env,
    corporationId: string,
    playerId: string
  ): Promise<SocialResult<void>> =>
    ipcRenderer.invoke('social:transfer-organisation', env, corporationId, playerId),

  /** Disbands an organisation. */
  socialDisbandOrganisation: (env: Env, corporationId: string): Promise<SocialResult<void>> =>
    ipcRenderer.invoke('social:disband-organisation', env, corporationId)
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
