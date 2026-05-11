import { app, ipcMain, shell, safeStorage, BrowserWindow } from 'electron'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { URL } from 'url'
import { getApiBase, ENDPOINTS } from '../config/env'
import type { Env } from '../../renderer/store/env'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TokenSet {
  access_token:  string
  refresh_token: string
  id_token:      string
  expires_in:    number
  token_type:    string
}

export interface UserInfo {
  sub:      string
  username: string
  email:    string
}

interface PKCESession {
  env:      Env
  verifier: string
  state:    string
}

// ─── State ────────────────────────────────────────────────────────────────────

const REDIRECT_URI  = 'dyingstar://auth/callback'
const CLIENT_ID     = 'dyingstar-launcher'
const REALM         = 'dyingstar'

let pkceSession: PKCESession | null = null
let mainWindow:  BrowserWindow | null = null

// ─── Auth base dérivé de l'API base ───────────────────────────────────────────

function getKeycloakBase(env: Env): string | null {
  const base = getApiBase(env)
  if (!base) return null
  return ENDPOINTS.authBase(base)
}

// ─── Token Storage ────────────────────────────────────────────────────────────

function getTokenPath(env: Env): string {
  const filename = env === 'universe' ? 'tokens.enc' : `tokens-${env}.enc`
  return path.join(app.getPath('userData'), filename)
}

function storeTokens(env: Env, tokens: TokenSet): void {
  const json = JSON.stringify(tokens)
  if (safeStorage.isEncryptionAvailable()) {
    fs.writeFileSync(getTokenPath(env), safeStorage.encryptString(json))
  } else {
    console.warn('[Auth] safeStorage unavailable, plain JSON fallback')
    fs.writeFileSync(getTokenPath(env), json, 'utf-8')
  }
}

function loadTokens(env: Env): TokenSet | null {
  const p = getTokenPath(env)
  if (!fs.existsSync(p)) return null
  try {
    const buf = fs.readFileSync(p)
    if (safeStorage.isEncryptionAvailable()) {
      return JSON.parse(safeStorage.decryptString(buf)) as TokenSet
    }
    return JSON.parse(buf.toString('utf-8')) as TokenSet
  } catch { return null }
}

function clearStoredTokens(env: Env): void {
  const p = getTokenPath(env)
  if (fs.existsSync(p)) fs.unlinkSync(p)
}

// ─── PKCE ─────────────────────────────────────────────────────────────────────

function generatePKCE(): { verifier: string; challenge: string } {
  const verifier  = crypto.randomBytes(32).toString('base64url')
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

function generateState(): string {
  return crypto.randomBytes(16).toString('base64url')
}

// ─── JWT ──────────────────────────────────────────────────────────────────────

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid JWT')
  return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'))
}

function extractUser(tokens: TokenSet): UserInfo {
  const p = decodeJwtPayload(tokens.id_token)
  return {
    sub:      p['sub']       as string,
    username: ((p['preferred_username'] ?? p['name']) as string | undefined) ?? 'Unknown',
    email:    (p['email']    as string | undefined) ?? ''
  }
}

// ─── Auth Flow ────────────────────────────────────────────────────────────────

export async function startLogin(env: Env): Promise<void> {
  const kcBase = getKeycloakBase(env)
  if (!kcBase) throw new Error(`Auth non disponible pour l'env: ${env}`)

  const { verifier, challenge } = generatePKCE()
  const state = generateState()
  pkceSession = { env, verifier, state }

  const params = new URLSearchParams({
    client_id:             CLIENT_ID,
    redirect_uri:          REDIRECT_URI,
    response_type:         'code',
    scope:                 'openid email profile',
    kc_idp_hint:           'discord',
    code_challenge:        challenge,
    code_challenge_method: 'S256',
    state
  })

  await shell.openExternal(
    `${kcBase}/realms/${REALM}/protocol/openid-connect/auth?${params}`
  )
}

export async function handleOAuthCallback(rawUrl: string): Promise<void> {
  let url: URL
  try { url = new URL(rawUrl) } catch { return }
  if (url.protocol !== 'dyingstar:' || url.host !== 'auth' || url.pathname !== '/callback') return

  const code  = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (!code && !error) return // post-logout

  const envForEvent = pkceSession?.env ?? 'universe-testing'

  if (error) {
    mainWindow?.webContents.send('auth:state-changed', { env: envForEvent, status: 'error', error })
    return
  }

  if (!code || !state || !pkceSession || state !== pkceSession.state) {
    mainWindow?.webContents.send('auth:state-changed', {
      env: envForEvent, status: 'error', error: 'invalid_callback'
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
    mainWindow?.webContents.send('auth:state-changed', {
      env, status: 'connected', user: extractUser(tokens)
    })
  } catch (err) {
    console.error('[Auth] Token exchange failed:', err)
    mainWindow?.webContents.send('auth:state-changed', {
      env, status: 'error', error: 'token_exchange_failed'
    })
  }
}

async function exchangeCode(kcBase: string, code: string, verifier: string): Promise<TokenSet> {
  const res = await fetch(
    `${kcBase}/realms/${REALM}/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        client_id:     CLIENT_ID,
        code,
        redirect_uri:  REDIRECT_URI,
        code_verifier: verifier
      }).toString()
    }
  )
  if (!res.ok) throw new Error(`Token exchange failed (${res.status}): ${await res.text()}`)
  return res.json() as Promise<TokenSet>
}

async function refreshToken(kcBase: string, token: string): Promise<TokenSet | null> {
  const res = await fetch(
    `${kcBase}/realms/${REALM}/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        client_id:     CLIENT_ID,
        refresh_token: token
      }).toString()
    }
  )
  if (!res.ok) return null
  return res.json() as Promise<TokenSet>
}

/** Access token JWT valide (rafraîchit si besoin) — pour lancement du client jeu. */
export async function loadFreshAccessToken(env: Env): Promise<string | null> {
  const kcBase = getKeycloakBase(env)
  const tokens = loadTokens(env)
  if (!kcBase || !tokens) return null

  const refreshed = await refreshToken(kcBase, tokens.refresh_token)
  if (!refreshed) {
    clearStoredTokens(env)
    return null
  }
  storeTokens(env, refreshed)
  return refreshed.access_token
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

export function registerAuthHandlers(win: BrowserWindow): void {
  mainWindow = win

  ipcMain.handle('auth:login', async (_event, env: Env) => {
    try {
      await startLogin(env)
    } catch (err) {
      console.error('[Auth] Failed to open browser:', err)
      mainWindow?.webContents.send('auth:state-changed', {
        env, status: 'error', error: 'browser_open_failed'
      })
    }
  })

  ipcMain.handle('auth:logout', (_event, env: Env) => {
    const kcBase = getKeycloakBase(env)
    const tokens = loadTokens(env)
    clearStoredTokens(env)

    if (kcBase && tokens?.id_token) {
      const params = new URLSearchParams({
        client_id:                CLIENT_ID,
        post_logout_redirect_uri: REDIRECT_URI,
        id_token_hint:            tokens.id_token
      })
      shell.openExternal(
        `${kcBase}/realms/${REALM}/protocol/openid-connect/logout?${params}`
      )
    }
  })

  ipcMain.handle('auth:load-user', async (_event, env: Env): Promise<UserInfo | null> => {
    const kcBase = getKeycloakBase(env)
    const tokens = loadTokens(env)
    if (!kcBase || !tokens) return null

    const refreshed = await refreshToken(kcBase, tokens.refresh_token)
    if (!refreshed) { clearStoredTokens(env); return null }

    storeTokens(env, refreshed)
    return extractUser(refreshed)
  })
}