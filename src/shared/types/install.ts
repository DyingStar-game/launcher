/** Version metadata returned after a successful game install or update. */
export interface InstallResult {
  version: string
  releaseDate: string
}

/** How an install or update ended (ADR 0036): done, paused by the player, or cancelled. */
export type InstallOutcome =
  ({ status: 'installed' } & InstallResult) | { status: 'paused' } | { status: 'cancelled' }

/** A download left on disk, paused or interrupted, that can be resumed (ADR 0036). */
export interface PendingDownload {
  /** Bytes already on disk. */
  downloaded: number
  /** Size of the whole archive. */
  total: number
  /** Overall install progress at that point (0–100), as the progress events count it. */
  progress: number
}
