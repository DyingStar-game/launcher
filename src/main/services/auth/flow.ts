import { shell } from 'electron'
import { URL, URLSearchParams } from 'url'
import {
  AUTH_CLIENT_ID,
  AUTH_IDP_HINT,
  AUTH_REALM,
  AUTH_REDIRECT_URI,
  AUTH_SCOPES
} from '../../config/auth'
import { APP_PROTOCOL } from '../../config/constants'
import type { Env } from '@shared/types/env'
import type { UserInfo } from '@shared/types/auth'
import type { PKCESession } from './types'
import { generatePKCE, generateState } from './pkce'
import { describeGameTokenIssue, extractUser, pickGameLaunchToken } from './jwt'
import { exchangeCode, getKeycloakBase, mergeTokenSet, refreshToken } from './keycloakClient'
import { clearStoredTokens, loadTokens, storeTokens } from './tokenStorage'

let pkceSession: PKCESession | null = null

type AuthEventSender = {
  send(channel: 'auth:state-changed', payload: unknown): void
}

let eventSender: AuthEventSender | null = null

/** Registers the object used to push auth state events to the renderer. */
export function setAuthEventSender(sender: AuthEventSender): void {
  eventSender = sender
}

/** Opens the system browser on the Keycloak authorization URL (PKCE). */
export async function startLogin(env: Env): Promise<void> {
  const kcBase = getKeycloakBase(env)
  if (!kcBase) throw new Error(`Auth unavailable for env: ${env}`)

  const { verifier, challenge } = generatePKCE()
  const state = generateState()
  pkceSession = { env, verifier, state }

  const params = new URLSearchParams({
    client_id: AUTH_CLIENT_ID,
    redirect_uri: AUTH_REDIRECT_URI,
    response_type: 'code',
    scope: AUTH_SCOPES,
    kc_idp_hint: AUTH_IDP_HINT,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state
  })

  await shell.openExternal(`${kcBase}/realms/${AUTH_REALM}/protocol/openid-connect/auth?${params}`)
}

/** Handles `dyingstar://auth/callback` deep links after OAuth redirect. */
export async function handleOAuthCallback(rawUrl: string): Promise<void> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return
  }

  if (url.protocol !== `${APP_PROTOCOL}:` || url.host !== 'auth' || url.pathname !== '/callback') {
    return
  }

  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (!code && !error) return

  const envForEvent = pkceSession?.env ?? 'universe-testing'

  if (error) {
    eventSender?.send('auth:state-changed', { env: envForEvent, status: 'error', error })
    return
  }

  if (!code || !state || !pkceSession || state !== pkceSession.state) {
    eventSender?.send('auth:state-changed', {
      env: envForEvent,
      status: 'error',
      error: 'invalid_callback'
    })
    return
  }

  const { env, verifier } = pkceSession
  pkceSession = null

  const kcBase = getKeycloakBase(env)
  if (!kcBase) return

  try {
    const tokens = await exchangeCode(kcBase, code, verifier)
    storeTokens(env, tokens)
    eventSender?.send('auth:state-changed', {
      env,
      status: 'connected',
      user: extractUser(tokens)
    })
  } catch (err) {
    console.error('[Auth] Token exchange failed:', err)
    eventSender?.send('auth:state-changed', {
      env,
      status: 'error',
      error: 'token_exchange_failed'
    })
  }
}

/** Clears stored tokens and notifies the renderer (e.g. session expired). */
export function invalidateSession(env: Env): void {
  clearStoredTokens(env)
  eventSender?.send('auth:state-changed', {
    env,
    status: 'disconnected',
    reason: 'session_expired'
  })
}

/** Returns a fresh id_token suitable for game launch, refreshing if needed. */
export async function loadFreshGameToken(env: Env): Promise<string | null> {
  const kcBase = getKeycloakBase(env)
  if (!kcBase) return null

  const tokens = loadTokens(env)
  if (!tokens) {
    invalidateSession(env)
    return null
  }

  const refreshed = await refreshToken(kcBase, tokens.refresh_token)
  if (!refreshed) {
    invalidateSession(env)
    return null
  }

  const merged = mergeTokenSet(tokens, refreshed)
  storeTokens(env, merged)
  const launchToken = pickGameLaunchToken(merged)
  if (!launchToken) {
    console.error('[Auth] Invalid game token:', describeGameTokenIssue(merged))
    invalidateSession(env)
    return null
  }
  return launchToken
}

/** Refreshes tokens and returns the user profile, or null when session is invalid. */
export async function loadUserProfile(env: Env): Promise<UserInfo | null> {
  const kcBase = getKeycloakBase(env)
  const tokens = loadTokens(env)
  if (!kcBase || !tokens) return null

  const refreshed = await refreshToken(kcBase, tokens.refresh_token)
  if (!refreshed) {
    invalidateSession(env)
    return null
  }

  const merged = mergeTokenSet(tokens, refreshed)
  storeTokens(env, merged)
  return extractUser(merged)
}

/** Clears local tokens and opens Keycloak logout in the browser. */
export function logout(env: Env): void {
  const kcBase = getKeycloakBase(env)
  const tokens = loadTokens(env)
  clearStoredTokens(env)

  if (kcBase && tokens?.id_token) {
    const params = new URLSearchParams({
      client_id: AUTH_CLIENT_ID,
      post_logout_redirect_uri: AUTH_REDIRECT_URI,
      id_token_hint: tokens.id_token
    })
    void shell.openExternal(
      `${kcBase}/realms/${AUTH_REALM}/protocol/openid-connect/logout?${params}`
    )
  }
}
