import { ipcMain } from 'electron'
import { getApiBase, ENDPOINTS, getStatusComponentId, getStatusMetricId } from '../config/env'
import type { Env } from '../../renderer/store/env'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ServerStatusValue = 'online' | 'degraded' | 'offline' | 'maintenance' | 'unknown' | 'unavailable'

export interface GameStatusResult {
  status:        ServerStatusValue
  statusLabel:   string            // label brut de l'API (pour debug/log)
  players:       number
  available:     boolean           // false si l'env n'est pas configuré
}

// Mapping value → type interne
// 1: Operational, 2: Performance Issues, 3: Partial Outage,
// 4: Major Outage, 5: Unknown, 6: Under Maintenance
const STATUS_MAP: Record<number, ServerStatusValue> = {
  1: 'online',
  2: 'degraded',
  3: 'degraded',
  4: 'offline',
  5: 'unknown',
  6: 'maintenance'
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, timeoutMs = 8_000): Promise<Response> {
  return fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'Cache-Control': 'no-cache', 'Accept': 'application/json' }
  })
}

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
      console.warn('[GameStatus] Statut composant illisible', { url, label })
      return { status: 'unknown', label: label || 'parse_error' }
    }

    const mapped = STATUS_MAP[value]
    if (!mapped) {
      console.warn('[GameStatus] Valeur status inconnue', { url, value, label })
      return { status: 'unknown', label }
    }
    return { status: mapped, label }
  } catch (err) {
    console.warn('[GameStatus] fetch status échoué', err)
    return { status: 'unknown', label: 'fetch_error' }
  }
}

function parseMetricPoints(json: unknown): number {
  if (!json || typeof json !== 'object') return 0
  const root = json as { data?: unknown }
  const arr = root.data
  if (!Array.isArray(arr) || arr.length === 0) return 0
  const first = arr[0] as Record<string, unknown> | undefined
  const attrs = first?.attributes as Record<string, unknown> | undefined
  const raw = attrs?.calculated_value ?? attrs?.value
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n) ? n : 0
}

async function fetchPlayers(apiBase: string, metricId: number): Promise<number> {
  try {
    const url = ENDPOINTS.metrics(apiBase, metricId)
    const res = await fetchWithTimeout(url)
    if (!res.ok) return 0

    const json: unknown = await res.json()
    return parseMetricPoints(json)
  } catch (err) {
    console.warn('[GameStatus] fetch metrics échoué', err)
    return 0
  }
}

// ─── Disponibilité : ping /version ───────────────────────────────────────────

async function pingAvailability(apiBase: string): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(ENDPOINTS.version(apiBase), 5_000)
    return res.ok
  } catch {
    return false
  }
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

export function registerGameStatusHandlers(): void {

  // ── Vérification de disponibilité au démarrage ─────────────────────────────
  ipcMain.removeHandler('env:check-availability')
  ipcMain.handle('env:check-availability', async (): Promise<Record<Env, boolean>> => {
    const envs: Env[] = ['universe', 'universe-testing']

    const results = await Promise.all(
      envs.map(async (env) => {
        const base = getApiBase(env)
        if (!base) return false         // var vide → indisponible immédiatement
        return pingAvailability(base)
      })
    )

    return {
      'universe':         results[0],
      'universe-testing': results[1]
    }
  })

  // ── Statut serveur + joueurs pour un env ───────────────────────────────────
  ipcMain.removeHandler('game:get-server-status')
  ipcMain.handle('game:get-server-status', async (_event, env: Env): Promise<GameStatusResult> => {
    const base = getApiBase(env)

    if (!base) {
      return { status: 'unavailable', statusLabel: 'not_configured', players: 0, available: false }
    }

    const componentId = getStatusComponentId(env)
    const metricId = getStatusMetricId(env)

    // Fetch status + players en parallèle
    const [{ status, label }, players] = await Promise.all([
      fetchStatus(base, componentId),
      fetchPlayers(base, metricId)
    ])

    return { status, statusLabel: label, players, available: true }
  })
}