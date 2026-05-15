export type ServerStatusValue =
  | 'online'
  | 'degraded'
  | 'offline'
  | 'maintenance'
  | 'unknown'
  | 'unavailable'

export interface GameStatusResult {
  status: ServerStatusValue
  statusLabel: string
  players: number
  available: boolean
}
