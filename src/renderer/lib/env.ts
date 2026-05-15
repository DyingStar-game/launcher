import type { Env } from '@shared/types/env'

/** Returns a trimmed env string or empty when unset. */
export function envString(value: string | undefined): string {
  return (value ?? '').trim()
}

/** Status page URL for the given game environment. */
export function statusPageUrlForEnv(env: Env): string {
  const raw =
    env === 'universe'
      ? import.meta.env.VITE_STATUS_PAGE_UNIVERSE
      : import.meta.env.VITE_STATUS_PAGE_TESTING
  return envString(raw)
}

/** Server status poll interval in minutes (clamped 1 … 1440). */
export function pollIntervalMinutes(): number {
  const raw = import.meta.env.VITE_SERVER_STATUS_POLL_MINUTES ?? '5'
  let n = Number.parseFloat(String(raw).trim())
  if (!Number.isFinite(n) || n < 1) n = 5
  if (n > 24 * 60) n = 24 * 60
  return n
}

/** External navigation link URLs for the navbar. */
export function navUrls(): {
  website: string
  discord: string
  wiki: string
  donate: string
} {
  return {
    website: envString(import.meta.env.VITE_NAV_WEBSITE_URL),
    discord: envString(import.meta.env.VITE_NAV_DISCORD_URL),
    wiki: envString(import.meta.env.VITE_NAV_WIKI_URL),
    donate: envString(import.meta.env.VITE_NAV_DONATE_URL)
  }
}

/** Toast notification duration in milliseconds. */
export function toastDurationMs(): number {
  const n = Number(import.meta.env.VITE_UI_TOAST_DURATION_MS ?? '3800')
  return Number.isFinite(n) && n > 0 ? n : 3800
}

/** Auto-close delay for the social side panel in milliseconds. */
export function socialPanelAutoCloseMs(): number {
  const n = Number(import.meta.env.VITE_UI_SOCIAL_PANEL_CLOSE_MS ?? '1200')
  return Number.isFinite(n) && n > 0 ? n : 1200
}
