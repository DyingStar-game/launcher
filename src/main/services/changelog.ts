import { ipcMain } from 'electron'
import { HTTP_TIMEOUT_MS } from '../config/constants'
import type { GlobalChangelog } from '@shared/types/changelog'

/** Fetches the centralised changelog JSON from the configured URL. */
export async function fetchGlobalChangelog(): Promise<GlobalChangelog | null> {
  const url = (import.meta.env.VITE_CHANGELOG_JSON_URL ?? '').trim()
  if (!url) return null

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS.github),
      headers: { 'Cache-Control': 'no-cache' }
    })
    if (!res.ok) return null
    return (await res.json()) as GlobalChangelog
  } catch {
    return null
  }
}

/** Registers the IPC handler that fetches the remote changelog JSON. */
export function registerChangelogHandlers(): void {
  ipcMain.removeHandler('changelog:fetch')
  ipcMain.handle('changelog:fetch', async (): Promise<GlobalChangelog | null> => fetchGlobalChangelog())
}
