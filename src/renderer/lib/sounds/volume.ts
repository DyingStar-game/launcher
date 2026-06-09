import { useSoundStore } from '@stores/sound'

/** Applies master volume and mute state to a base catalog level (0–1). */
export function effectiveVolume(base: number): number {
  const { enabled, masterVolume } = useSoundStore.getState()
  if (!enabled) return 0
  return Math.min(1, Math.max(0, base * masterVolume))
}

/** Returns current master volume multiplier (0–1). */
export function getMasterVolume(): number {
  return useSoundStore.getState().masterVolume
}
