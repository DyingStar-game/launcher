import { useEffect } from 'react'
import { preloadSoundAssets, startBackgroundMusic, stopBackgroundMusic } from '@lib/sounds/engine'
import { useSoundStore } from '@stores/sound'

/** Preloads sounds and starts or stops looping background music when preference changes. */
export function useBackgroundMusic(): void {
  const enabled = useSoundStore((s) => s.enabled)

  useEffect(() => {
    void preloadSoundAssets().then(() => {
      if (enabled) {
        void startBackgroundMusic()
      }
    })

    return () => {
      stopBackgroundMusic()
    }
  }, [enabled])
}
