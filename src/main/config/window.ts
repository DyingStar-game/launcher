import { parsePositiveInt } from './constants'

/**
 * Window sizing policy:
 * - Open at DESIGN size (fits Universe + banners/alerts without clipping).
 * - User may resize between MIN and MAX (Electron enforces bounds).
 */
export const WINDOW_BOUNDS = {
  /** Initial window size on launch (design layout). */
  width: parsePositiveInt(import.meta.env.VITE_WINDOW_DESIGN_WIDTH, 1320),
  height: parsePositiveInt(import.meta.env.VITE_WINDOW_DESIGN_HEIGHT, 920),
  /** Smallest size the user can shrink to. */
  minWidth: parsePositiveInt(import.meta.env.VITE_WINDOW_MIN_WIDTH, 1024),
  minHeight: parsePositiveInt(import.meta.env.VITE_WINDOW_MIN_HEIGHT, 680),
  /** Largest size the user can grow to. */
  maxWidth: parsePositiveInt(import.meta.env.VITE_WINDOW_MAX_WIDTH, 1600),
  maxHeight: parsePositiveInt(import.meta.env.VITE_WINDOW_MAX_HEIGHT, 1000)
} as const
