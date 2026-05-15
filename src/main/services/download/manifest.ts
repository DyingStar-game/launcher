import * as fs from 'fs'
import * as path from 'path'
import { fetchRemoteGameVersion } from '../version'
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

/** Reads version metadata from the local `version.json` manifest. */
function readVersionManifest(gameRoot: string): InstallResult {
  const manifestPath = findVersionManifestPath(gameRoot)
  if (!manifestPath) {
    console.warn('[Download] version.json not found under', gameRoot)
    return { version: 'unknown', releaseDate: new Date().toISOString().split('T')[0] }
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
    return { version: 'unknown', releaseDate: new Date().toISOString().split('T')[0] }
  }
}

/**
 * Returns installed version aligned with remote `/version` when available.
 */
export async function resolveInstalledVersion(env: Env, gameRoot: string): Promise<InstallResult> {
  const fromFile = readVersionManifest(gameRoot)
  const fromApi = await fetchRemoteGameVersion(env)
  if (fromApi?.version) {
    return {
      version: fromApi.version,
      releaseDate: fromApi.releaseDate ?? fromFile.releaseDate
    }
  }
  return fromFile
}
