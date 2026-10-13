/** Bytes received at a moment, for measuring a download's speed. */
export type TransferSample = { at: number; bytes: number }

/** How far back the speed is measured: smooths bursts without lagging behind. */
export const TRANSFER_RATE_WINDOW_MS = 5000

/** Adds a sample and drops those older than the window. */
export function addTransferSample(
  samples: TransferSample[],
  sample: TransferSample
): TransferSample[] {
  return [...samples.filter((s) => sample.at - s.at <= TRANSFER_RATE_WINDOW_MS), sample]
}

/** Bytes per second between the oldest and newest samples, null until time has passed. */
export function transferRate(samples: TransferSample[]): number | null {
  const first = samples[0]
  const last = samples[samples.length - 1]
  if (!first || !last || last.at <= first.at) return null
  return ((last.bytes - first.bytes) * 1000) / (last.at - first.at)
}

/** Seconds left at the given speed, null when the speed is unknown or zero. */
export function secondsLeft(
  downloaded: number,
  total: number,
  bytesPerSecond: number | null
): number | null {
  if (!bytesPerSecond || bytesPerSecond <= 0) return null
  return Math.max(0, (total - downloaded) / bytesPerSecond)
}
