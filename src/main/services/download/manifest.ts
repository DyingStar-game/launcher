import * as fs from 'fs'
import * as path from 'path'
import { compareGameBuildIds, normalizeGameVersion } from '@shared/gameVersion'
import type { Env } from '@shared/types/env'
import type { InstallResult } from '@shared/types/install'

function parseVersionManifestFile(manifestPath: string): InstallResult | null {
  try {
    const json = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as {
      version?: string
      releaseDate?: string
    }
    const rawVersion = json.version?.trim()
    if (!rawVersion) return null
    return {
      version: normalizeGameVersion(rawVersion),
      releaseDate: json.releaseDate ?? new Date().toISOString().split('T')[0]
    }
  } catch {
    return null
  }
}

/** Reads the newest `version.json` under the game root (direct path wins ties at same version). */
function readVersionManifest(gameRoot: string): InstallResult | null {
  const paths: string[] = []
  const direct = path.join(gameRoot, 'version.json')
  try {
    if (fs.existsSync(direct) && fs.statSync(direct).isFile()) paths.push(direct)
  } catch {
    /* try nested */
  }

  try {
    for (const entry of fs.readdirSync(gameRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const nested = path.join(gameRoot, entry.name, 'version.json')
      try {
        if (fs.existsSync(nested) && fs.statSync(nested).isFile()) paths.push(nested)
      } catch {
        /* continue */
      }
    }
  } catch {
    return null
  }

  let best: InstallResult | null = null
  for (const manifestPath of paths) {
    const parsed = parseVersionManifestFile(manifestPath)
    if (!parsed) continue
    if (!best || compareGameBuildIds(parsed.version, best.version) > 0) {
      best = parsed
    }
  }
  return best
}

/**
 * Returns the version read from the local `version.json` on disk only.
 * Remote `/version` is fetched separately via `checkVersions` for update comparison.
 * Returns null when no manifest is found.
 */
export async function resolveInstalledVersion(
  _env: Env,
  gameRoot: string
): Promise<InstallResult | null> {
  return readVersionManifest(gameRoot)
}
