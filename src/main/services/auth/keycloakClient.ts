import { getApiBase, ENDPOINTS } from '../../config/api'
import { AUTH_CLIENT_ID, AUTH_REALM, AUTH_REDIRECT_URI, AUTH_SCOPES } from '../../config/auth'
import type { Env } from '@shared/types/env'
import type { TokenSet } from './types'
import { isValidGameLaunchToken } from './jwt'

/** Resolves the Keycloak base URL for an environment, or null if API base is unset. */
export function getKeycloakBase(env: Env): string | null {
  const base = getApiBase(env)
  if (!base) return null
  return ENDPOINTS.authBase(base)
}

/** Exchanges an authorization code for tokens (PKCE). */
export async function exchangeCode(
  kcBase: string,
  code: string,
  verifier: string
): Promise<TokenSet> {
  const res = await fetch(`${kcBase}/realms/${AUTH_REALM}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: AUTH_CLIENT_ID,
      code,
      redirect_uri: AUTH_REDIRECT_URI,
      code_verifier: verifier
    }).toString()
  })
  if (!res.ok) throw new Error(`Token exchange failed (${res.status}): ${await res.text()}`)
  return res.json() as Promise<TokenSet>
}

/** Refreshes tokens using a refresh_token grant. */
export async function refreshToken(kcBase: string, token: string): Promise<TokenSet | null> {
  const res = await fetch(`${kcBase}/realms/${AUTH_REALM}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: AUTH_CLIENT_ID,
      refresh_token: token,
      scope: AUTH_SCOPES
    }).toString()
  })
  if (!res.ok) return null
  return res.json() as Promise<TokenSet>
}

/** Merges refreshed tokens while preserving a valid id_token for game launch. */
export function mergeTokenSet(previous: TokenSet, refreshed: TokenSet): TokenSet {
  const idCandidates = [refreshed.id_token, previous.id_token].filter(Boolean)
  const id_token =
    idCandidates.find((t) => isValidGameLaunchToken(t)) ?? refreshed.id_token ?? previous.id_token

  return { ...previous, ...refreshed, id_token }
}
