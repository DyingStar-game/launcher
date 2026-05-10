// src/main/services/version.ts

import { ipcMain, app } from 'electron'
import type { Env } from '../../renderer/store/env'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RemoteVersionPayload {
  version:     string   // format YYYYMMDDHHMMSS ex: "20260510092919"
  releaseDate: string   // format YYYY-MM-DD    ex: "2026-05-10"
}

interface GameVersionInfo {
  version:     string | null
  releaseDate: string | null
}

interface VersionCheckResult {
  currentLauncherVersion:  string
  latestLauncherVersion:   string
  launcherUpdateAvailable: boolean
  latestGameVersions:      Record<Env, GameVersionInfo>
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

// TODO: remplacer GAME_VERSION_URL_UNIVERSE par l'URL prod quand disponible
const GAME_VERSION_URL: Record<Env, string> = {
  'universe':         'https://dyingstar-game.com/version',
  'universe-testing': 'https://dyingstar-game.com/version'
}

// TODO: remplacer par l'URL réelle de versioning du launcher
const LAUNCHER_VERSION_URL = 'https://dyingstar-game.com/launcher/version'

// ─── Comparaison ──────────────────────────────────────────────────────────────

/**
 * Retourne true si `remote` est plus récent que `local`.
 * Fonctionne pour le format YYYYMMDDHHMMSS (comparaison lexicographique)
 * ainsi que pour le semver (1.2.3) tant que les longueurs sont identiques.
 */
function isNewer(remote: string, local: string): boolean {
  return remote.localeCompare(local, undefined, { numeric: false }) > 0
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchRemoteVersion(url: string): Promise<RemoteVersionPayload | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8_000),
      headers: { 'Cache-Control': 'no-cache' }
    })
    if (!res.ok) {
      console.warn(`[Version] HTTP ${res.status} sur ${url}`)
      return null
    }
    return await res.json() as RemoteVersionPayload
  } catch (err) {
    console.warn('[Version] Impossible de contacter :', url, err)
    return null
  }
}

// ─── Handler IPC ──────────────────────────────────────────────────────────────

export function registerVersionHandlers(): void {

  ipcMain.handle('version:check', async (): Promise<VersionCheckResult> => {
    const currentLauncherVersion = app.getVersion()

    // Tous les checks en parallèle
    const [launcherPayload, universePayload, testingPayload] = await Promise.all([
      fetchRemoteVersion(LAUNCHER_VERSION_URL),
      fetchRemoteVersion(GAME_VERSION_URL['universe']),
      fetchRemoteVersion(GAME_VERSION_URL['universe-testing'])
    ])

    // ── Launcher ────────────────────────────────────────────────────────────
    const latestLauncherVersion  = launcherPayload?.version ?? currentLauncherVersion
    const launcherUpdateAvailable =
      launcherPayload !== null &&
      isNewer(launcherPayload.version, currentLauncherVersion)

    // ── Jeu par env ──────────────────────────────────────────────────────────
    const toInfo = (payload: RemoteVersionPayload | null): GameVersionInfo => ({
      version:     payload?.version     ?? null,
      releaseDate: payload?.releaseDate ?? null
    })

    return {
      currentLauncherVersion,
      latestLauncherVersion,
      launcherUpdateAvailable,
      latestGameVersions: {
        'universe':         toInfo(universePayload),
        'universe-testing': toInfo(testingPayload)
      }
    }
  })
}