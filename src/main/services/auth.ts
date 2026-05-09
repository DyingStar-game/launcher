import { app, ipcMain, shell, safeStorage, BrowserWindow } from 'electron'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { URL } from 'url'

// ─── Constants ────────────────────────────────────────────────────────────────

const KEYCLOAK_BASE = 'https://auth-preprod.dyingstar-game.com'
const REALM = 'dyingstar'
const CLIENT_ID = 'dyingstar-launcher'
const REDIRECT_URI = 'dyingstar://auth/callback'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TokenSet {
  access_token: string
  refresh_token: string
  id_token: string
  expires_in: number
  token_type: string
}

export interface UserInfo {
  sub: string
  username: string
  email: string
}

interface PKCESession {
  verifier: string
  state: string
}

// ─── State ────────────────────────────────────────────────────────────────────

let pkceSession: PKCESession | null = null
let mainWindow: BrowserWindow | null = null

// ─── Token Storage ────────────────────────────────────────────────────────────
// Uses safeStorage (OS keychain) when available, plain JSON otherwise.
// Plain JSON fallback is acceptable because the tokens are short-lived and the
// file sits in the user's private appData directory.

function getTokenPath(): string {
  return path.join(app.getPath('userData'), 'tokens.enc')
}

function storeTokens(tokens: TokenSet): void {
  const json = JSON.stringify(tokens)
  if (safeStorage.isEncryptionAvailable()) {
    fs.writeFileSync(getTokenPath(), safeStorage.encryptString(json))
  } else {
    console.warn('[Auth] safeStorage unavailable, storing tokens as plain JSON')
    fs.writeFileSync(getTokenPath(), json, 'utf-8')
  }
}

function loadTokens(): TokenSet | null {
  const p = getTokenPath()
  if (!fs.existsSync(p)) return null
  try {
    const buf = fs.readFileSync(p)
    if (safeStorage.isEncryptionAvailable()) {
      return JSON.parse(safeStorage.decryptString(buf)) as TokenSet
    } else {
      return JSON.parse(buf.toString('utf-8')) as TokenSet
    }
  } catch {
    return null
  }
}

function clearStoredTokens(): void {
  const p = getTokenPath()
  if (fs.existsSync(p)) fs.unlinkSync(p)
}

// ─── PKCE ─────────────────────────────────────────────────────────────────────

function generatePKCE(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(32).toString('base64url')
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

function generateState(): string {
  return crypto.randomBytes(16).toString('base64url')
}

// ─── JWT payload decode (no sig verification — trust Keycloak over HTTPS) ────

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid JWT structure')
  return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'))
}

function extractUser(tokens: TokenSet): UserInfo {
  const payload = decodeJwtPayload(tokens.id_token)
  return {
    sub: payload['sub'] as string,
    username: ((payload['preferred_username'] ?? payload['name']) as string | undefined) ?? 'Unknown',
    email: (payload['email'] as string | undefined) ?? '',
  }
}

// ─── Auth Flow ────────────────────────────────────────────────────────────────

export async function startLogin(): Promise<void> {
  const { verifier, challenge } = generatePKCE()
  const state = generateState()
  pkceSession = { verifier, state }

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    kc_idp_hint: 'discord',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  })

  const authUrl = `${KEYCLOAK_BASE}/realms/${REALM}/protocol/openid-connect/auth?${params}`
  await shell.openExternal(authUrl)
}

export async function handleOAuthCallback(rawUrl: string): Promise<void> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return
  }

  // Only handle dyingstar://auth/callback
  if (url.protocol !== 'dyingstar:' || url.host !== 'auth' || url.pathname !== '/callback') return

  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  // Post-logout redirect (no code, no error) — tokens already cleared
  if (!code && !error) return

  if (error) {
    console.error('[Auth] OAuth error:', url.searchParams.get('error_description') ?? error)
    mainWindow?.webContents.send('auth:state-changed', { status: 'error', error })
    return
  }

  if (!code || !state || !pkceSession || state !== pkceSession.state) {
    console.error('[Auth] Invalid callback: missing code/state or state mismatch (CSRF?)')
    mainWindow?.webContents.send('auth:state-changed', { status: 'error', error: 'invalid_callback' })
    return
  }

  const { verifier } = pkceSession
  pkceSession = null

  try {
    const tokens = await exchangeCodeForTokens(code, verifier)
    storeTokens(tokens)
    const user = extractUser(tokens)
    mainWindow?.webContents.send('auth:state-changed', { status: 'connected', user })
  } catch (err) {
    console.error('[Auth] Token exchange failed:', err)
    mainWindow?.webContents.send('auth:state-changed', { status: 'error', error: 'token_exchange_failed' })
  }
}

async function exchangeCodeForTokens(code: string, verifier: string): Promise<TokenSet> {
  const endpoint = `${KEYCLOAK_BASE}/realms/${REALM}/protocol/openid-connect/token`
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  })

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token exchange failed (${res.status}): ${text}`)
  }

  return res.json() as Promise<TokenSet>
}

async function refreshTokens(refreshToken: string): Promise<TokenSet | null> {
  const endpoint = `${KEYCLOAK_BASE}/realms/${REALM}/protocol/openid-connect/token`
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    refresh_token: refreshToken,
  })

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) return null
  return res.json() as Promise<TokenSet>
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

export function registerAuthHandlers(win: BrowserWindow): void {
  mainWindow = win

  // Open browser to start OAuth2 + PKCE login (covers both login & register)
  ipcMain.handle('auth:login', async () => {
    try {
      await startLogin()
    } catch (err) {
      console.error('[Auth] Failed to open browser:', err)
      mainWindow?.webContents.send('auth:state-changed', { status: 'error', error: 'browser_open_failed' })
    }
  })

  // Clear tokens locally and open Keycloak logout URL
  ipcMain.handle('auth:logout', () => {
    const tokens = loadTokens()
    clearStoredTokens()

    if (tokens?.id_token) {
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        post_logout_redirect_uri: REDIRECT_URI,
        id_token_hint: tokens.id_token,
      })
      const logoutUrl =
        `${KEYCLOAK_BASE}/realms/${REALM}/protocol/openid-connect/logout?${params}`
      shell.openExternal(logoutUrl)
    }
  })

  // Restore session on startup: try to refresh stored tokens
  ipcMain.handle('auth:load-user', async (): Promise<UserInfo | null> => {
    const tokens = loadTokens()
    if (!tokens) return null

    const refreshed = await refreshTokens(tokens.refresh_token)
    if (!refreshed) {
      clearStoredTokens()
      return null
    }

    storeTokens(refreshed)
    return extractUser(refreshed)
  })
}
