import * as fs from 'fs'
import * as path from 'path'
import type { Env } from '@shared/types/env'
import type { InstallResult } from '@shared/types/install'

/** Locates `version.json` at the game root or one subdirectory deep. */
function findVersionManifestPath(gameRoot: string): string | null {
  const direct = path.join(gameRoot, 'version.json')
  try {
    if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct
  } catch {
    /* try nested */
  }

  try {
    for (const entry of fs.readdirSync(gameRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const nested = path.join(gameRoot, entry.name, 'version.json')
      try {
        if (fs.existsSync(nested) && fs.statSync(nested).isFile()) return nested
      } catch {
        /* continue */
      }
    }
  } catch {
    return null
  }

  return null
}

/** Reads version metadata from the local `version.json` manifest, or null if missing. */
function readVersionManifest(gameRoot: string): InstallResult | null {
  const manifestPath = findVersionManifestPath(gameRoot)
  if (!manifestPath) {
    return null
  }
  try {
    const json = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as {
      version?: string
      releaseDate?: string
    }
    return {
      version: json.version ?? 'unknown',
      releaseDate: json.releaseDate ?? new Date().toISOString().split('T')[0]
    }
  } catch {
    return null
  }
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
