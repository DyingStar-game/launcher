import { ipcMain, app } from 'electron'
import { getApiBase, ENDPOINTS } from '../config/api'
import { HTTP_TIMEOUT_MS } from '../config/constants'
import { normalizeGameVersion } from '@shared/gameVersion'
import type { Env } from '@shared/types/env'
import type { GameVersionInfo, VersionCheckResult } from '@shared/types/version'

interface RemoteVersionPayload {
  version: string
  releaseDate: string
}

interface GitHubLatestReleasePayload {
  tag_name: string
  published_at?: string
}

interface LauncherReleaseInfo {
  version: string
  releaseDate: string | null
}

/** Returns true when the remote launcher semver is newer than the local one. */
function isNewerLauncherVersion(remote: string, local: string): boolean {
  return remote.localeCompare(local, undefined, { numeric: true, sensitivity: 'base' }) > 0
}

/** Fetches remote game version metadata for an environment. */
export async function fetchRemoteGameVersion(env: Env): Promise<RemoteVersionPayload | null> {
  const base = getApiBase(env)
  if (!base) return null
  return fetchGameVersion(ENDPOINTS.version(base))
}

/** Fetches game version JSON from a URL. */
async function fetchGameVersion(url: string): Promise<RemoteVersionPayload | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS.api),
      headers: { 'Cache-Control': 'no-cache' }
    })
    if (!res.ok) return null
    return (await res.json()) as RemoteVersionPayload
  } catch {
    return null
  }
}

/** Parses `owner/repo` from a public GitHub repository page URL. */
function parseGithubRepoUrl(repoPageUrl: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(repoPageUrl.trim())
    if (u.hostname !== 'github.com') return null
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts.length < 2) return null
    const repo = parts[1].replace(/\.git$/i, '')
    return { owner: parts[0], repo }
  } catch {
    return null
  }
}

/** Fetches the latest GitHub release for the launcher repository. */
async function fetchLatestLauncherReleaseFromGithub(
  repoPageUrl: string
): Promise<LauncherReleaseInfo | null> {
  const parsed = parseGithubRepoUrl(repoPageUrl)
  if (!parsed) return null

  const apiUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/releases/latest`
  const ua = `DyingStar-Launcher/${app.getVersion()}`

  try {
    const res = await fetch(apiUrl, {
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS.github),
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': ua
      }
    })
    if (res.status === 404) return null
    if (!res.ok) return null

    const data = (await res.json()) as GitHubLatestReleasePayload
    const rawTag = data.tag_name?.trim() ?? ''
    if (!rawTag) return null

    const version = rawTag.startsWith('v') || rawTag.startsWith('V') ? rawTag.slice(1) : rawTag
    const releaseDate = data.published_at?.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? null

    return { version, releaseDate }
  } catch {
    return null
  }
}

/** Registers the IPC handler that checks launcher and game versions. */
export function registerVersionHandlers(): void {
  ipcMain.handle('version:check', async (): Promise<VersionCheckResult> => {
    const currentLauncherVersion = app.getVersion()
    const githubRepoUrl = (import.meta.env.VITE_LAUNCHER_GITHUB_REPO_URL ?? '').trim()

    const envs: Env[] = ['universe', 'universe-testing']
    const payloads = await Promise.all(envs.map((env) => fetchRemoteGameVersion(env)))

    const toInfo = (p: RemoteVersionPayload | null): GameVersionInfo => ({
      version: p?.version ? normalizeGameVersion(p.version) : null,
      releaseDate: p?.releaseDate ?? null
    })

    let latestLauncherVersion: string | null = null
    let latestLauncherReleaseDate: string | null = null
    let launcherUpdateAvailable = false

    if (githubRepoUrl) {
      const gh = await fetchLatestLauncherReleaseFromGithub(githubRepoUrl)
      if (gh) {
        latestLauncherVersion = gh.version
        latestLauncherReleaseDate = gh.releaseDate
        launcherUpdateAvailable = isNewerLauncherVersion(gh.version, currentLauncherVersion)
      }
    }

    return {
      currentLauncherVersion,
      latestLauncherVersion,
      latestLauncherReleaseDate,
      launcherUpdateAvailable,
      latestGameVersions: {
        universe: toInfo(payloads[0]),
        'universe-testing': toInfo(payloads[1])
      }
    }
  })
}
