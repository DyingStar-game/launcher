import { ipcMain, app } from 'electron'
import { getApiBase, ENDPOINTS } from '../config/api'
import type { Env } from '@shared/types/env'
import type { GameVersionInfo, VersionCheckResult } from '@shared/types/version'

// ─── Types internes (API distantes) ───────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Compare semver / tags du launcher (ex. 0.2.0 vs 0.10.1). */
function isNewerLauncherVersion(remote: string, local: string): boolean {
  return remote.localeCompare(local, undefined, { numeric: true, sensitivity: 'base' }) > 0
}

export async function fetchRemoteGameVersion(env: Env): Promise<RemoteVersionPayload | null> {
  const base = getApiBase(env)
  if (!base) return null
  return fetchGameVersion(ENDPOINTS.version(base))
}

async function fetchGameVersion(url: string): Promise<RemoteVersionPayload | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8_000),
      headers: { 'Cache-Control': 'no-cache' }
    })
    if (!res.ok) return null
    return await res.json() as RemoteVersionPayload
  } catch {
    return null
  }
}

/**
 * Déduit owner/repo depuis une URL de dépôt GitHub publique.
 * Ex. https://github.com/DyingStar-game/launcher → DyingStar-game/launcher
 */
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

async function fetchLatestLauncherReleaseFromGithub(
  repoPageUrl: string
): Promise<LauncherReleaseInfo | null> {
  const parsed = parseGithubRepoUrl(repoPageUrl)
  if (!parsed) return null

  const apiUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/releases/latest`
  const ua = `DyingStar-Launcher/${app.getVersion()}`

  try {
    const res = await fetch(apiUrl, {
      signal: AbortSignal.timeout(10_000),
      headers: {
        Accept:               'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent':         ua
      }
    })
    // Aucune release publique → pas de bandeau
    if (res.status === 404) return null
    if (!res.ok) return null

    const data = await res.json() as GitHubLatestReleasePayload
    const rawTag = data.tag_name?.trim() ?? ''
    if (!rawTag) return null

    const version = rawTag.startsWith('v') || rawTag.startsWith('V') ? rawTag.slice(1) : rawTag
    const releaseDate =
      data.published_at?.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? null

    return { version, releaseDate }
  } catch {
    return null
  }
}

// ─── Handler IPC ──────────────────────────────────────────────────────────────

export function registerVersionHandlers(): void {

  ipcMain.handle('version:check', async (): Promise<VersionCheckResult> => {
    const currentLauncherVersion = app.getVersion()
    const githubRepoUrl = (import.meta.env.VITE_LAUNCHER_GITHUB_REPO_URL ?? '').trim()

    const envs: Env[] = ['universe', 'universe-testing']

    const payloads = await Promise.all(envs.map((env) => fetchRemoteGameVersion(env)))

    const toInfo = (p: RemoteVersionPayload | null): GameVersionInfo => ({
      version:     p?.version     ?? null,
      releaseDate: p?.releaseDate ?? null
    })

    // ── Launcher : dernière release GitHub (pas /version du jeu)
    let latestLauncherVersion:     string | null = null
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
        'universe':         toInfo(payloads[0]),
        'universe-testing': toInfo(payloads[1])
      }
    }
  })
}
