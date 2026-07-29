import { parsePositiveInt } from './constants'

/**
 * Window sizing policy:
 * - Open at DESIGN size (fits Universe + banners/alerts without clipping).
 * - User may shrink down to MIN; no upper size cap (so fullscreen / maximize work).
 */
export const WINDOW_BOUNDS = {
  /** Initial window size on launch (design layout). */
  width: parsePositiveInt(import.meta.env.VITE_WINDOW_DESIGN_WIDTH, 1400),
  height: parsePositiveInt(import.meta.env.VITE_WINDOW_DESIGN_HEIGHT, 920),
  /** Smallest size the user can shrink to. */
  minWidth: parsePositiveInt(import.meta.env.VITE_WINDOW_MIN_WIDTH, 1024),
  minHeight: parsePositiveInt(import.meta.env.VITE_WINDOW_MIN_HEIGHT, 680)
} as const
