import log from 'electron-log'
import type { Env } from '@shared/types/env'
import type { ApiError, SocialResult } from '@shared/types/social'
import { getSocialBase } from '../../config/api'
import { HTTP_TIMEOUT_MS } from '../../config/constants'
import { invalidateSession, loadFreshAccessToken } from '../auth'
import { toSocialErrorCode, type SocialAction } from './mapping'

type Method = 'GET' | 'POST' | 'DELETE'

/** One HTTP attempt with a bearer token; resolves to the response or null on network failure. */
async function send(
  url: string,
  method: Method,
  token: string,
  body: unknown
): Promise<Response | null> {
  try {
    return await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {})
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS.api)
    })
  } catch (err) {
    log.warn(`[Social] ${method} ${url} failed:`, err)
    return null
  }
}

/** Reads the `social` error code from an error response, if any. */
async function readApiCode(res: Response): Promise<string | undefined> {
  try {
    return ((await res.json()) as ApiError).error
  } catch {
    return undefined
  }
}

/**
 * Calls the `social` API as the signed-in player of `env` (ADR 0007).
 * Refreshes the token once on 401; errors come back as launcher error codes.
 * @param path - Route under `/api`, e.g. `/friends`.
 */
export async function socialRequest<T>(
  env: Env,
  action: SocialAction,
  method: Method,
  path: string,
  body?: unknown
): Promise<SocialResult<T>> {
  const base = getSocialBase(env)
  if (!base) return { ok: false, error: 'unavailable' }
  const url = `${base}/api${path}`

  let auth = await loadFreshAccessToken(env)
  if ('error' in auth) return { ok: false, error: auth.error }

  let res = await send(url, method, auth.token, body)
  if (res?.status === 401) {
    auth = await loadFreshAccessToken(env, true)
    if ('error' in auth) return { ok: false, error: auth.error }
    res = await send(url, method, auth.token, body)
    if (res?.status === 401) invalidateSession(env)
  }
  if (!res) return { ok: false, error: 'unavailable' }

  if (!res.ok) {
    const code = await readApiCode(res)
    log.warn(`[Social] ${method} ${path} → ${res.status} ${code ?? ''}`)
    return { ok: false, error: toSocialErrorCode(res.status, code, action) }
  }
  if (res.status === 204) return { ok: true, data: undefined as T }
  try {
    return { ok: true, data: (await res.json()) as T }
  } catch {
    return { ok: false, error: 'unknown' }
  }
}
