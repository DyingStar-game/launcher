import { UiSoundProfile } from '@shared/types/sounds'
import type { UiSoundProfile as UiSoundProfileType } from '@shared/types/sounds'
import {
  AMBIENT_SOUND_FILES,
  HOVER_SOUND_COOLDOWN_MS,
  SOUND_VOLUMES,
  UI_SOUND_FILES
} from './catalog'
import { effectiveVolume } from './volume'
import { useSoundStore } from '@stores/sound'
import { useGameStore } from '@stores/game'

const soundAssets = import.meta.glob<string>('../../assets/sounds/*.{mp3,ogg,wav}', {
  eager: true,
  query: '?url',
  import: 'default'
})

/** Background music uses a dedicated HTMLAudioElement (no Web Audio — avoids loop glitches). */
let musicAudio: HTMLAudioElement | null = null
let musicAssetUrl: string | null = null

/** Sustained hover loop for the play-game button only. */
let playGameHoverAudio: HTMLAudioElement | null = null

let lastHoverAt = 0

function resolveSoundUrl(filename: string): string | undefined {
  const match = Object.entries(soundAssets).find(([path]) => path.endsWith(`/${filename}`))
  return match?.[1]
}

function canPlay(): boolean {
  const { enabled, masterVolume } = useSoundStore.getState()
  const { gameRunning } = useGameStore.getState()
  return enabled && masterVolume > 0 && !gameRunning
}

function getMusicElement(url: string): HTMLAudioElement {
  if (!musicAudio || musicAssetUrl !== url) {
    musicAudio = new Audio(url)
    musicAudio.loop = true
    musicAudio.preload = 'auto'
    musicAssetUrl = url
  }
  return musicAudio
}

/** Updates volume on currently playing music / sustained SFX after master slider changes. */
export function applyActiveVolumes(): void {
  if (musicAudio) {
    musicAudio.volume = effectiveVolume(SOUND_VOLUMES.music)
  }
  if (playGameHoverAudio) {
    playGameHoverAudio.volume = effectiveVolume(SOUND_VOLUMES.playGameHover)
  }
}

/** Preloads the background track; SFX are loaded on demand via short-lived Audio instances. */
export async function preloadSoundAssets(): Promise<void> {
  const url = resolveSoundUrl(AMBIENT_SOUND_FILES.backgroundMusic)
  if (!url) return

  try {
    const audio = getMusicElement(url)
    audio.load()
  } catch {
    /* silent */
  }
}

/**
 * Plays a one-shot SFX with a fresh Audio node (no reuse / seek — avoids clicks).
 * Fails silently when the file is missing or playback is blocked.
 */
export function playSfx(filename: string, baseVolume: number): void {
  if (!canPlay()) return

  const url = resolveSoundUrl(filename)
  if (!url) return

  const volume = effectiveVolume(baseVolume)
  if (volume <= 0) return

  try {
    const audio = new Audio(url)
    audio.volume = volume
    void audio.play().catch(() => {
      /* missing asset or autoplay restriction */
    })
  } catch {
    /* silent */
  }
}

/** Starts the play-game hover loop; stops when the pointer leaves the button. */
export function startPlayGameHover(): void {
  if (!canPlay()) return

  const url = resolveSoundUrl(UI_SOUND_FILES[UiSoundProfile.PlayGame].hover)
  if (!url) return

  stopPlayGameHover()

  try {
    playGameHoverAudio = new Audio(url)
    playGameHoverAudio.loop = true
    playGameHoverAudio.volume = effectiveVolume(SOUND_VOLUMES.playGameHover)
    void playGameHoverAudio.play().catch(() => {
      stopPlayGameHover()
    })
  } catch {
    stopPlayGameHover()
  }
}

/** Stops the play-game hover loop. */
export function stopPlayGameHover(): void {
  if (!playGameHoverAudio) return
  playGameHoverAudio.pause()
  try {
    playGameHoverAudio.currentTime = 0
  } catch {
    /* silent */
  }
  playGameHoverAudio = null
}

/** Plays hover SFX for the given UI profile (one-shot; not used for play-game). */
export function playUiHover(profile: UiSoundProfileType): void {
  if (profile === UiSoundProfile.None || profile === UiSoundProfile.PlayGame || !canPlay()) {
    return
  }

  const now = Date.now()
  if (now - lastHoverAt < HOVER_SOUND_COOLDOWN_MS) return
  lastHoverAt = now

  const files = UI_SOUND_FILES[profile]
  playSfx(files.hover, SOUND_VOLUMES.hover)
}

/** Plays click SFX for the given UI profile. */
export function playUiClick(profile: UiSoundProfileType): void {
  if (profile === UiSoundProfile.None || !canPlay()) return

  const files = UI_SOUND_FILES[profile]
  playSfx(files.click, SOUND_VOLUMES.click)
}

/** Starts looping background music when enabled and the file is present. */
export async function startBackgroundMusic(): Promise<void> {
  if (!canPlay()) {
    stopBackgroundMusic()
    return
  }

  const url = resolveSoundUrl(AMBIENT_SOUND_FILES.backgroundMusic)
  if (!url) return

  try {
    const audio = getMusicElement(url)
    audio.volume = effectiveVolume(SOUND_VOLUMES.music)

    if (!audio.paused && !audio.ended) return

    await audio.play()
  } catch {
    /* silent */
  }
}

/** Stops background music without destroying the element (allows seamless restart). */
export function stopBackgroundMusic(): void {
  if (!musicAudio) return
  musicAudio.pause()
  try {
    musicAudio.currentTime = 0
  } catch {
    /* silent */
  }
}

/** Stops all non-music sounds (e.g. when the user mutes audio). */
export function stopAllInteractiveSounds(): void {
  stopPlayGameHover()
}

/** Stops background music and any sustained / interactive sounds. */
export function stopAllSounds(): void {
  stopBackgroundMusic()
  stopAllInteractiveSounds()
}
