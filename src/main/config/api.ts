// Point d'accès unique aux variables d'environnement dans le main process.
// Avec electron-vite, les variables VITE_* sont injectées via import.meta.env.

import type { Env } from '@shared/types/env'

/**
 * Retourne l'URL de base de l'API pour un env donné.
 * Retourne null si la variable est vide → env indisponible.
 */
export function getApiBase(env: Env): string | null {
  // import.meta.env.* est remplacé au build par electron-vite (fichiers .env / .env.production).
  // process.env ne contient pas ces clés dans l’exe packagé.
  const raw =
    env === 'universe'
      ? import.meta.env.VITE_API_BASE_UNIVERSE
      : import.meta.env.VITE_API_BASE_TESTING

  const trimmed = (raw ?? '').trim().replace(/\/$/, '') // supprime le slash final
  return trimmed || null
}

/**
 * URL utilisée uniquement pour télécharger les ZIP du jeu (optionnel).
 * Si vide → on réutilise {@link getApiBase} (ex. CDN différent de l’API).
 */
export function getDownloadBase(env: Env): string | null {
  const raw =
    env === 'universe'
      ? import.meta.env.VITE_GAME_DOWNLOAD_BASE_UNIVERSE
      : import.meta.env.VITE_GAME_DOWNLOAD_BASE_TESTING

  const trimmed = (raw ?? '').trim().replace(/\/$/, '')
  return trimmed || getApiBase(env)
}

function pickZipUrlForPlatform(
  platform: NodeJS.Platform,
  urls: { win: string; linux: string; darwin: string }
): string | null {
  if (platform === 'win32') return urls.win || null
  if (platform === 'linux') return urls.linux || null
  if (platform === 'darwin') return urls.darwin || null
  return null
}

/**
 * URLs complètes des archives pour l’env **universe** (prod), une par OS.
 * Si définie pour la plateforme courante, elle remplace `/game/latest-*.zip`.
 */
export function getUniverseZipUrlForPlatform(platform: NodeJS.Platform): string | null {
  return pickZipUrlForPlatform(platform, {
    win:    (import.meta.env.VITE_GAME_ZIP_WINDOWS ?? '').trim(),
    linux:  (import.meta.env.VITE_GAME_ZIP_LINUX ?? '').trim(),
    darwin: (import.meta.env.VITE_GAME_ZIP_DARWIN ?? '').trim()
  })
}

/**
 * URLs complètes des archives pour l’env **universe-testing** (une par OS).
 * Si définie pour la plateforme courante, elle remplace `/game/latest-*.zip`.
 */
export function getTestingZipUrlForPlatform(platform: NodeJS.Platform): string | null {
  return pickZipUrlForPlatform(platform, {
    win:    (import.meta.env.VITE_GAME_ZIP_TESTING_WINDOWS ?? '').trim(),
    linux:  (import.meta.env.VITE_GAME_ZIP_TESTING_LINUX ?? '').trim(),
    darwin: (import.meta.env.VITE_GAME_ZIP_TESTING_DARWIN ?? '').trim()
  })
}

/**
 * Dérive l'URL de base du sous-domaine "status" depuis l'URL principale.
 * https://dyingstar-game.com → https://status.dyingstar-game.com
 * (sera transparent quand tout sera consolidé sous une seule URL)
 */
export function getStatusBase(apiBase: string): string {
  try {
    const url = new URL(apiBase)
    // Évite de doubler le préfixe si déjà présent
    if (!url.hostname.startsWith('status.')) {
      url.hostname = `status.${url.hostname}`
    }
    return url.origin
  } catch {
    return apiBase
  }
}

function parseStatusNumericId(raw: string | undefined, fallback: number): number {
  const n = Number(String(raw ?? '').trim())
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}

/** ID Cachet du composant « statut » (API /api/components/:id) — par environnement. */
export function getStatusComponentId(env: Env): number {
  const raw =
    env === 'universe'
      ? import.meta.env.VITE_STATUS_COMPONENT_ID_UNIVERSE
      : import.meta.env.VITE_STATUS_COMPONENT_ID_TESTING
  return parseStatusNumericId(raw, 3)
}

/** ID Cachet de la métrique « joueurs » (API /api/metrics/:id/points) — par environnement. */
export function getStatusMetricId(env: Env): number {
  const raw =
    env === 'universe'
      ? import.meta.env.VITE_STATUS_METRIC_ID_UNIVERSE
      : import.meta.env.VITE_STATUS_METRIC_ID_TESTING
  return parseStatusNumericId(raw, 2)
}

/** Tous les endpoints dérivés d'une URL de base */
export const ENDPOINTS = {
  version:   (base: string): string => `${base}/version`,
  status:    (base: string, componentId: number): string =>
    `${getStatusBase(base)}/api/components/${componentId}`,
  metrics:   (base: string, metricId: number): string =>
    `${getStatusBase(base)}/api/metrics/${metricId}/points?sort=-id`,
  zipWin32:  (base: string): string => `${base}/game/latest-windows.zip`,
  zipLinux:  (base: string): string => `${base}/game/latest-linux.zip`,
  zipDarwin: (base: string): string => `${base}/game/latest-macos.zip`,
  authBase:  (base: string): string => {
    try {
      const url = new URL(base)
      if (!url.hostname.startsWith('auth-preprod.') && !url.hostname.startsWith('auth.')) {
        url.hostname = `auth-preprod.${url.hostname}`
      }
      return url.origin
    } catch {
      return base
    }
  }
}