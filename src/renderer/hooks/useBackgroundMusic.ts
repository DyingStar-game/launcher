import { useEffect } from 'react'
import { preloadSoundAssets, startBackgroundMusic, stopAllSounds } from '@lib/sounds/engine'
import { useSoundStore } from '@stores/sound'
import { useGameStore } from '@stores/game'

/** Preloads sounds and manages playback when preferences or game running state change. */
export function useBackgroundMusic(): void {
  const enabled = useSoundStore((s) => s.enabled)
  const gameRunning = useGameStore((s) => s.gameRunning)

  useEffect(() => {
    void preloadSoundAssets().then(() => {
      if (enabled && !gameRunning) {
        void startBackgroundMusic()
      } else {
        stopAllSounds()
      }
    })

    return () => {
      stopAllSounds()
    }
  }, [enabled, gameRunning])
}
