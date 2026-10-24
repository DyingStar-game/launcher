import type { Env } from '@shared/types/env'
import { pollIntervalMinutes } from './env'

/** Query keys of the status page answers (ADR 0025), one per environment. */
export const statusKeys = {
  all: ['status'] as const,
  server: (env: Env) => ['status', env, 'server'] as const,
  auth: (env: Env) => ['status', env, 'auth'] as const
}

/**
 * How long a status answer is reused: switching universes back and forth stays under the status
 * page's rate limit (60 requests a minute), whose refusals showed the server as down.
 */
export const STATUS_STALE_MS = 30_000

/** How often the status shown is read again (`VITE_SERVER_STATUS_POLL_MINUTES`). */
export function statusRefetchMs(): number {
  return pollIntervalMinutes() * 60 * 1000
}

/** The status page did not answer: the query fails, so the last answer read stays shown. */
export class StatusUnreadError extends Error {}
