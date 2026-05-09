import { ipcMain, app } from 'electron'
import type { Env } from '../../renderer/store/env'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VersionCheckResult {
  currentLauncherVersion: string
  latestLauncherVersion: string
  launcherUpdateAvailable: boolean
  latestGameVersions: Record<Env, string | null>
}

// ─── Endpoints de version par env ─────────────────────────────────────────────

// TODO: remplacer par les vraies URLs
const GAME_VERSION_URLS: Record<Env, string> = {
  'universe':         'https://your-server.com/universe/version.json',
  'universe-testing': 'https://your-server.com/universe-testing/version.json'
}

// TODO: remplacer par la vraie URL de l'API du launcher
const LAUNCHER_VERSION_URL = 'https://your-server.com/launcher/version.json'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

async function fetchLatestVersion(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const json = await res.json() as { version: string }
    return json.version ?? null
  } catch {
    return null
  }
}

// ─── Handler IPC ──────────────────────────────────────────────────────────────

export function registerVersionHandlers(): void {

  ipcMain.handle('version:check', async (): Promise<VersionCheckResult> => {
    const currentLauncherVersion = app.getVersion()

    // Lancer tous les checks en parallèle
    const [latestLauncher, latestUniverse, latestTesting] = await Promise.all([
      fetchLatestVersion(LAUNCHER_VERSION_URL),
      fetchLatestVersion(GAME_VERSION_URLS['universe']),
      fetchLatestVersion(GAME_VERSION_URLS['universe-testing'])
    ])

    const latestLauncherVersion = latestLauncher ?? currentLauncherVersion
    const launcherUpdateAvailable =
      latestLauncher !== null &&
      compareVersions(latestLauncher, currentLauncherVersion) > 0

    return {
      currentLauncherVersion,
      latestLauncherVersion,
      launcherUpdateAvailable,
      latestGameVersions: {
        'universe':         latestUniverse,
        'universe-testing': latestTesting
      }
    }
  })
}