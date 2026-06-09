import { UiSoundProfile } from '@shared/types/sounds'
import type { UiSoundProfile as UiSoundProfileType } from '@shared/types/sounds'

/** Filenames for UI hover/click pairs per component profile. */
export const UI_SOUND_FILES: Record<
  Exclude<UiSoundProfileType, typeof UiSoundProfile.None>,
  { hover: string; click: string }
> = {
  [UiSoundProfile.Default]: {
    hover: 'ui-hover.wav',
    click: 'ui-click.wav'
  },
  [UiSoundProfile.PlayGame]: {
    hover: 'play-game-hover.wav',
    click: 'play-game-click.wav'
  }
}

/** Ambient / background tracks. */
export const AMBIENT_SOUND_FILES = {
  backgroundMusic: 'background-music.wav'
} as const

export const SOUND_VOLUMES = {
  hover: 0.12,
  click: 0.07,
  music: 0.15,
  playGameHover: 0.18
} as const

/** Minimum delay between two hover SFX (avoids rapid re-triggers). */
export const HOVER_SOUND_COOLDOWN_MS = 200
