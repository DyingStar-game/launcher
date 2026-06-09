import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  applyActiveVolumes,
  startBackgroundMusic,
  stopAllInteractiveSounds,
  stopBackgroundMusic
} from '@lib/sounds/engine'

function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(1, Math.max(0, value))
}

type SoundState = {
  enabled: boolean
  /** Global volume multiplier (0–1) applied on top of per-sound catalog levels. */
  masterVolume: number
  setEnabled: (enabled: boolean) => void
  setMasterVolume: (volume: number) => void
  toggle: () => void
}

/**
 * Global sound preferences (persisted): mute toggle and master volume slider.
 */
export const useSoundStore = create<SoundState>()(
  persist(
    (set, get) => ({
      enabled: true,
      masterVolume: 1,

      setEnabled: (enabled) => {
        set({ enabled })
        if (enabled) {
          void startBackgroundMusic()
        } else {
          stopBackgroundMusic()
          stopAllInteractiveSounds()
        }
      },

      setMasterVolume: (volume) => {
        const masterVolume = clampVolume(volume)
        set({ masterVolume })
        applyActiveVolumes()
        if (masterVolume > 0 && get().enabled) {
          void startBackgroundMusic()
        }
        if (masterVolume <= 0) {
          stopAllInteractiveSounds()
        }
      },

      toggle: () => {
        get().setEnabled(!get().enabled)
      }
    }),
    {
      name: 'dyingstar-sound',
      partialize: (state) => ({
        enabled: state.enabled,
        masterVolume: state.masterVolume
      }),
      onRehydrateStorage: () => (state) => {
        applyActiveVolumes()
        if (state?.enabled && state.masterVolume > 0) {
          void startBackgroundMusic()
        }
      }
    }
  )
)
