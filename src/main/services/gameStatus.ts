import { ipcMain } from 'electron'
import { getApiBase, ENDPOINTS, getStatusComponentId, getStatusMetricId } from '../config/api'
import { HTTP_TIMEOUT_MS } from '../config/constants'
import type { Env } from '@shared/types/env'
import type { GameStatusResult, ServerStatusValue } from '@shared/types/game'

export type { GameStatusResult, ServerStatusValue } from '@shared/types/game'

const STATUS_MAP: Record<number, ServerStatusValue> = {
  1: 'online',
  2: 'degraded',
  3: 'degraded',
  4: 'offline',
  5: 'unknown',
  6: 'maintenance'
}

/** Performs a fetch with an abort timeout. */
async function fetchWithTimeout(url: string, timeoutMs = HTTP_TIMEOUT_MS.api): Promise<Response> {
  return fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'Cache-Control': 'no-cache', Accept: 'application/json' }
  })
}

/** Parses Cachet component status JSON into a numeric value and label. */
function parseCachetComponentStatus(json: unknown): { value: number | undefined; label: string } {
  if (!json || typeof json !== 'object') return { value: undefined, label: 'invalid_json' }
  const root = json as Record<string, unknown>
  const data = root.data as Record<string, unknown> | undefined
  const attrs = data?.attributes as Record<string, unknown> | undefined
  const statusObj = attrs?.status as Record<string, unknown> | undefined
  const raw = statusObj?.value
  const human = statusObj?.human
  const n = typeof raw === 'number' ? raw : Number(raw)
  const label = typeof human === 'string' ? human : String(human ?? '')
  return {
    value: Number.isFinite(n) ? n : undefined,
    label
  }
}

/** Fetches server operational status from the status API. */
async function fetchStatus(
  apiBase: string,
  componentId: number
): Promise<{ status: ServerStatusValue; label: string }> {
  try {
    const url = ENDPOINTS.status(apiBase, componentId)
    const res = await fetchWithTimeout(url)
    if (!res.ok) return { status: 'unknown', label: `HTTP ${res.status}` }

    const json: unknown = await res.json()
    const { value, label } = parseCachetComponentStatus(json)

    if (value === undefined) {
      console.warn('[GameStatus] Unreadable component status', { url, label })
      return { status: 'unknown', label: label || 'parse_error' }
    }

    const mapped = STATUS_MAP[value]
    if (!mapped) {
      console.warn('[GameStatus] Unknown status value', { url, value, label })
      return { status: 'unknown', label }
    }
    return { status: mapped, label }
  } catch (err) {
    console.warn('[GameStatus] Status fetch failed', err)
    return { status: 'unknown', label: 'fetch_error' }
  }
}

/** Resolves numeric id from a Cachet metric point entry (`id` or `attributes.id`). */
function metricPointId(entry: Record<string, unknown>): number {
  const attrs = entry.attributes as Record<string, unknown> | undefined
  const fromAttrs = attrs?.id
  const fromRoot = entry.id
  const raw = fromAttrs ?? fromRoot
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n) ? n : -1
}

/**
 * Parses player count from Cachet `/api/metrics/:id/points`.
 * Uses `attributes.value` on the point with the highest id (latest sample).
 */
function parseMetricPoints(json: unknown): number {
  if (!json || typeof json !== 'object') return 0
  const root = json as { data?: unknown }
  const arr = root.data
  if (!Array.isArray(arr) || arr.length === 0) return 0

  let latest: Record<string, unknown> | undefined
  let latestId = -1

  for (const item of arr) {
    if (!item || typeof item !== 'object') continue
    const entry = item as Record<string, unknown>
    const id = metricPointId(entry)
    if (id > latestId) {
      latestId = id
      latest = entry
    }
  }

  if (!latest) return 0
  const attrs = latest.attributes as Record<string, unknown> | undefined
  const raw = attrs?.value
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n) ? n : 0
}

/** Fetches the current player count metric. */
async function fetchPlayers(apiBase: string, metricId: number): Promise<number> {
  try {
    const url = ENDPOINTS.metrics(apiBase, metricId)
    const res = await fetchWithTimeout(url)
    if (!res.ok) return 0

    const json: unknown = await res.json()
    return parseMetricPoints(json)
  } catch (err) {
    console.warn('[GameStatus] Metrics fetch failed', err)
    return 0
  }
}

/** Returns true when the `/version` endpoint responds successfully. */
async function pingAvailability(apiBase: string): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(ENDPOINTS.version(apiBase), HTTP_TIMEOUT_MS.versionPing)
    return res.ok
  } catch {
    return false
  }
}

/** Registers IPC handlers for env availability and server status. */
export function registerGameStatusHandlers(): void {
  ipcMain.removeHandler('env:check-availability')
  ipcMain.handle('env:check-availability', async (): Promise<Record<Env, boolean>> => {
    const envs: Env[] = ['universe', 'universe-testing']

    const results = await Promise.all(
      envs.map(async (env) => {
        const base = getApiBase(env)
        if (!base) return false
        return pingAvailability(base)
      })
    )

    return {
      universe: results[0],
      'universe-testing': results[1]
    }
  })

  ipcMain.removeHandler('game:get-server-status')
  ipcMain.handle('game:get-server-status', async (_event, env: Env): Promise<GameStatusResult> => {
    const base = getApiBase(env)

    if (!base) {
      return { status: 'unavailable', statusLabel: 'not_configured', players: 0, available: false }
    }

    const componentId = getStatusComponentId(env)
    const metricId = getStatusMetricId(env)

    const [{ status, label }, players] = await Promise.all([
      fetchStatus(base, componentId),
      fetchPlayers(base, metricId)
    ])

    return { status, statusLabel: label, players, available: true }
  })
}
