/** Version metadata returned after a successful game install or update. */
export interface InstallResult {
  version: string
  releaseDate: string
}

/**
 * How an install or update ended (ADR 0036): done, paused by the player, cancelled, or stopped for
 * lack of disk space, with the bytes needed and free (ADR 0047).
 */
export type InstallOutcome =
  | ({ status: 'installed' } & InstallResult)
  | { status: 'paused' }
  | { status: 'cancelled' }
  | { status: 'diskFull'; needed: number; available: number }

/** A download left on disk, paused or interrupted, that can be resumed (ADR 0036). */
export interface PendingDownload {
  /** Bytes already on disk. */
  downloaded: number
  /** Size of the whole archive. */
  total: number
  /** Overall install progress at that point (0–100), as the progress events count it. */
  progress: number
}
