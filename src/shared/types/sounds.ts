/** UI sound profile assigned to interactive components. */
export const UiSoundProfile = {
  Default: 'default',
  PlayGame: 'playGame',
  None: 'none'
} as const

export type UiSoundProfile = (typeof UiSoundProfile)[keyof typeof UiSoundProfile]

/** Identifiers for every sound file referenced by the catalog. */
export const SoundId = {
  UiHover: 'ui-hover',
  UiClick: 'ui-click',
  PlayGameHover: 'play-game-hover',
  PlayGameClick: 'play-game-click',
  BackgroundMusic: 'background-music'
} as const

export type SoundId = (typeof SoundId)[keyof typeof SoundId]

/** Maps a sound id to its filename inside `src/renderer/assets/sounds/`. */
export type SoundCatalogEntry = {
  id: SoundId
  file: string
  loop?: boolean
}
