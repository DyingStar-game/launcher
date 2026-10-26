import type { ServerStatusValue } from '@shared/types/game'
import type { InstallProgressLabel } from '@shared/types/installProgress'

/** What the home action bar offers for the active universe, most blocking state first. */
export type GameAction =
  | 'unavailable'
  | 'installing'
  | 'paused'
  | 'install'
  | 'update'
  | 'running'
  | 'launching'
  | 'serverDown'
  | 'authDown'
  | 'checkingSession'
  | 'signIn'
  | 'play'

/** The game, server and account state the action is chosen from. */
export type GameActionState = {
  /** The environment can be installed and played at all. */
  available: boolean
  installed: boolean
  installing: boolean
  /** A download is paused or was interrupted, to resume (ADR 0036). */
  paused: boolean
  updateAvailable: boolean
  serverStatus: ServerStatusValue
  /** The sign-in server answers: needed to sign in and to launch (a fresh token, ADR 0043). */
  authAvailable: boolean
  accountStatus: 'connected' | 'disconnected' | 'loading'
  sessionExpired: boolean
  launching: boolean
  running: boolean
}

/** Picks the home action: install, update, sign in or play, or why none is possible. */
export function gameAction(state: GameActionState): GameAction {
  if (!state.available) return 'unavailable'
  if (state.installing) return 'installing'
  if (state.paused) return 'paused'
  if (!state.installed) return 'install'
  if (state.updateAvailable) return 'update'
  if (state.running) return 'running'
  if (state.launching) return 'launching'
  if (state.serverStatus !== 'online') return 'serverDown'
  if (!state.authAvailable) return 'authDown'
  if (state.accountStatus === 'loading') return 'checkingSession'
  if (state.accountStatus === 'disconnected' || state.sessionExpired) return 'signIn'
  return 'play'
}

/**
 * Whether an install in progress can still be paused or cancelled: until extraction starts, which
 * replaces the game folder (ADR 0036).
 */
export function canStopInstall(step: InstallProgressLabel | null): boolean {
  return (
    step === null ||
    step.key === 'connecting' ||
    step.key === 'checkingUpdates' ||
    step.key === 'downloading' ||
    step.key === 'downloadingIndeterminate'
  )
}
