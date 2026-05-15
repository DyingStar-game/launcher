/** Normalized server operational status from the status API. */
export type ServerStatusValue =
  | 'online'
  | 'degraded'
  | 'offline'
  | 'maintenance'
  | 'unknown'
  | 'unavailable'

/** Server status and player count returned to the renderer. */
export interface GameStatusResult {
  status: ServerStatusValue
  statusLabel: string
  players: number
  available: boolean
}
