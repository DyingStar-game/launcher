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

/**
 * Background music streams from one HTMLAudioElement (the WAV is large; Web Audio would hold it
 * decoded in memory, and a `file://` element cannot be routed through Web Audio in production).
 * Its volume moves by short fades, never by jumps, which would click.
 */
let musicAudio: HTMLAudioElement | null = null
let musicAssetUrl: string | null = null
let musicFade: number | null = null

/**
 * Short SFX go through one shared AudioContext: each file is decoded once, then every play is a
 * cheap buffer source mixed into a single output. A new `Audio` per play opened a new decoder and
 * output stream each time (the hover file lasts 4.8 s, mostly silence), which crackled when they
 * piled up. Falls back to an `Audio` element when Web Audio or decoding is not available.
 */
let audioContext: AudioContext | null = null
const decoded = new Map<string, Promise<AudioBuffer | null>>()

/** A playing sound: stops it, or follows a new master volume, both by a short fade. */
type Playing = { stop: () => void; follow: () => void }

/** Sustained hover loop for the play-game button only. */
let playGameHover: Playing | null = null

let lastHoverAt = 0

/** Fade length when a sound starts, stops or changes volume: short enough not to be heard as one. */
const FADE_S = 0.04
const MUSIC_FADE_MS = 250
const RESUME_WAIT_MS = 50

function resolveSoundUrl(filename: string): string | undefined {
  const match = Object.entries(soundAssets).find(([path]) => path.endsWith(`/${filename}`))
  return match?.[1]
}

function canPlay(): boolean {
  const { enabled, masterVolume } = useSoundStore.getState()
  const { gameRunning } = useGameStore.getState()
  return enabled && masterVolume > 0 && !gameRunning
}

/** The shared context, created on first use. */
function getContext(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null
  if (!audioContext) {
    try {
      audioContext = new AudioContext({ latencyHint: 'balanced' })
      // A context created before any user action may start suspended (autoplay policy), and a
      // hover is not a user action: the first click or key press resumes it.
      const resume = (): void => {
        void audioContext?.resume().catch(() => {})
      }
      window.addEventListener('pointerdown', resume, { once: true, capture: true })
      window.addEventListener('keydown', resume, { once: true, capture: true })
    } catch {
      audioContext = null
      return null
    }
  }
  if (audioContext.state === 'suspended') void audioContext.resume().catch(() => {})
  return audioContext
}

/**
 * Whether the context runs, waiting a moment for a resume in progress (it is asynchronous, and
 * never completes before the first user action when the autoplay policy holds it).
 */
async function isRunning(context: AudioContext): Promise<boolean> {
  // A function, not `context.state` twice: TypeScript would keep the first check's narrowing
  const running = (): boolean => context.state === 'running'
  if (running()) return true
  await Promise.race([
    context.resume().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, RESUME_WAIT_MS))
  ])
  return running()
}

/** Reads a bundled file as bytes (XHR: works for the dev server and for `file://` in production). */
function loadBytes(url: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('GET', url)
    request.responseType = 'arraybuffer'
    request.onload = () =>
      request.response instanceof ArrayBuffer && request.response.byteLength > 0
        ? resolve(request.response)
        : reject(new Error(`empty sound ${url}`))
    request.onerror = () => reject(new Error(`cannot load sound ${url}`))
    request.send()
  })
}

/** Decodes a file once; `null` when it cannot be (the caller falls back to an `Audio` element). */
function decode(context: AudioContext, url: string): Promise<AudioBuffer | null> {
  let buffer = decoded.get(url)
  if (!buffer) {
    buffer = loadBytes(url)
      .then((bytes) => context.decodeAudioData(bytes))
      .catch(() => null)
    decoded.set(url, buffer)
  }
  return buffer
}

/**
 * Plays a decoded buffer at its catalog level `volume` times the master volume read now (as the
 * `Audio` elements did: no shared gain whose state could lag behind the store), fading in.
 */
function playBuffer(
  context: AudioContext,
  buffer: AudioBuffer,
  volume: number,
  loop = false
): Playing {
  const source = context.createBufferSource()
  source.buffer = buffer
  source.loop = loop
  const gain = context.createGain()
  const now = context.currentTime
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(effectiveVolume(volume), now + FADE_S)
  source.connect(gain).connect(context.destination)
  source.onended = () => gain.disconnect()
  source.start()
  return {
    follow: () => {
      const at = context.currentTime
      gain.gain.cancelScheduledValues(at)
      gain.gain.setTargetAtTime(effectiveVolume(volume), at, FADE_S / 3)
    },
    stop: () => {
      const at = context.currentTime
      gain.gain.cancelScheduledValues(at)
      gain.gain.setValueAtTime(gain.gain.value, at)
      gain.gain.linearRampToValueAtTime(0, at + FADE_S)
      source.stop(at + FADE_S)
    }
  }
}

/** Previous behaviour, kept as a fallback: a fresh `Audio` element per play. */
function playElement(url: string, volume: number, loop = false): Playing {
  const audio = new Audio(url)
  audio.loop = loop
  audio.volume = effectiveVolume(volume)
  void audio.play().catch(() => {
    /* missing asset or autoplay restriction */
  })
  return {
    stop: () => audio.pause(),
    follow: () => {
      audio.volume = effectiveVolume(volume)
    }
  }
}

/**
 * Plays `filename` at its catalog `volume`; resolves to a handle that stops it (with a fade).
 * Fails silently when the file is missing or playback is blocked.
 */
async function play(filename: string, volume: number, loop = false): Promise<Playing | null> {
  const url = resolveSoundUrl(filename)
  if (!url) return null
  try {
    const context = getContext()
    const buffer = context && (await decode(context, url))
    if (!canPlay()) return null
    // Until the context runs, a buffer would play into silence: the element plays it instead
    return context && buffer && (await isRunning(context))
      ? playBuffer(context, buffer, volume, loop)
      : playElement(url, volume, loop)
  } catch {
    return null
  }
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

/**
 * Moves the music volume to `target` over a short fade, then runs `done`. Timer-based, not
 * `requestAnimationFrame`: frames stop while the window is minimised, and the music must still
 * stop when the game starts.
 */
function fadeMusic(audio: HTMLAudioElement, target: number, done?: () => void): void {
  if (musicFade !== null) window.clearInterval(musicFade)
  const from = audio.volume
  const started = performance.now()
  const step = (): void => {
    const t = Math.min(1, (performance.now() - started) / MUSIC_FADE_MS)
    audio.volume = Math.min(1, Math.max(0, from + (target - from) * t))
    if (t < 1) return
    if (musicFade !== null) window.clearInterval(musicFade)
    musicFade = null
    done?.()
  }
  musicFade = window.setInterval(step, 16)
}

/** Follows the master slider and mute on the music and the play-game loop, by short fades. */
export function applyActiveVolumes(): void {
  if (musicAudio && !musicAudio.paused) {
    fadeMusic(musicAudio, effectiveVolume(SOUND_VOLUMES.music))
  }
  playGameHover?.follow()
}

/** Preloads the background track and decodes the SFX, so the first hover plays at once. */
export async function preloadSoundAssets(): Promise<void> {
  const url = resolveSoundUrl(AMBIENT_SOUND_FILES.backgroundMusic)
  if (url) {
    try {
      getMusicElement(url).load()
    } catch {
      /* silent */
    }
  }

  const context = getContext()
  if (!context) return
  const files = Object.values(UI_SOUND_FILES).flatMap(({ hover, click }) => [hover, click])
  await Promise.all(
    files.map((file) => {
      const sfx = resolveSoundUrl(file)
      return sfx ? decode(context, sfx) : null
    })
  )
}

/** Plays a one-shot SFX at its catalog level. Fails silently when the file is missing. */
export function playSfx(filename: string, baseVolume: number): void {
  if (!canPlay()) return
  void play(filename, baseVolume)
}

/** Starts the play-game hover loop; stops when the pointer leaves the button. */
export function startPlayGameHover(): void {
  if (!canPlay()) return
  stopPlayGameHover()

  // A leave before the loop has started cancels it
  let cancelled = false
  playGameHover = { stop: () => (cancelled = true), follow: () => {} }
  const pending = playGameHover
  void play(UI_SOUND_FILES[UiSoundProfile.PlayGame].hover, SOUND_VOLUMES.playGameHover, true).then(
    (handle) => {
      if (cancelled || playGameHover !== pending) handle?.stop()
      else playGameHover = handle
    }
  )
}

/** Stops the play-game hover loop, with a short fade out. */
export function stopPlayGameHover(): void {
  playGameHover?.stop()
  playGameHover = null
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

/** Starts looping background music when enabled and the file is present, fading in. */
export async function startBackgroundMusic(): Promise<void> {
  if (!canPlay()) {
    stopBackgroundMusic()
    return
  }

  const url = resolveSoundUrl(AMBIENT_SOUND_FILES.backgroundMusic)
  if (!url) return

  try {
    const audio = getMusicElement(url)
    const target = effectiveVolume(SOUND_VOLUMES.music)
    if (!audio.paused && !audio.ended) {
      fadeMusic(audio, target)
      return
    }
    audio.volume = 0
    await audio.play()
    fadeMusic(audio, target)
  } catch {
    /* silent */
  }
}

/** Stops background music with a fade out, keeping the element for a seamless restart. */
export function stopBackgroundMusic(): void {
  const audio = musicAudio
  if (!audio || audio.paused) return
  fadeMusic(audio, 0, () => {
    audio.pause()
    try {
      audio.currentTime = 0
    } catch {
      /* silent */
    }
  })
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
