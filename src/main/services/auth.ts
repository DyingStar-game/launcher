import { app, ipcMain, shell, safeStorage, BrowserWindow } from 'electron'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { URL } from 'url'
import type { Env } from '../../renderer/store/env'

// ─── Config par env ───────────────────────────────────────────────────────────
// null = fonctionnalité non disponible pour cet env

interface AuthConfig {
  base:     string
  realm:    string
  clientId: string
}

const AUTH_CONFIG: Record<Env, AuthConfig | null> = {
  'universe': null, // TODO: renseigner quand l'URL auth prod est prête
  'universe-testing': {
    base:     'https://auth-preprod.dyingstar-game.com',
    realm:    'dyingstar',
    clientId: 'dyingstar-launcher'
  }
}

const REDIRECT_URI = 'dyingstar://auth/callback'

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

let pkceSession: PKCESession | null = null
let mainWindow:  BrowserWindow | null = null

// ─── Token Storage — un fichier chiffré par env ────────────────────────────────

function getTokenPath(env: Env): string {
  const filename = env === 'universe' ? 'tokens.enc' : `tokens-${env}.enc`
  return path.join(app.getPath('userData'), filename)
}

function storeTokens(env: Env, tokens: TokenSet): void {
  const json = JSON.stringify(tokens)
  if (safeStorage.isEncryptionAvailable()) {
    fs.writeFileSync(getTokenPath(env), safeStorage.encryptString(json))
  } else {
    console.warn('[Auth] safeStorage unavailable, storing tokens as plain JSON')
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
    } else {
      return JSON.parse(buf.toString('utf-8')) as TokenSet
    }
  } catch {
    return null
  }
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
  if (parts.length !== 3) throw new Error('Invalid JWT structure')
  return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'))
}

function extractUser(tokens: TokenSet): UserInfo {
  const payload = decodeJwtPayload(tokens.id_token)
  return {
    sub:      payload['sub'] as string,
    username: ((payload['preferred_username'] ?? payload['name']) as string | undefined) ?? 'Unknown',
    email:    (payload['email'] as string | undefined) ?? ''
  }
}

// ─── Auth Flow ────────────────────────────────────────────────────────────────

export async function startLogin(env: Env): Promise<void> {
  const cfg = AUTH_CONFIG[env]
  if (!cfg) throw new Error(`Auth non disponible pour l'env: ${env}`)

  const { verifier, challenge } = generatePKCE()
  const state = generateState()
  pkceSession = { env, verifier, state }

  const params = new URLSearchParams({
    client_id:             cfg.clientId,
    redirect_uri:          REDIRECT_URI,
    response_type:         'code',
    scope:                 'openid email profile',
    kc_idp_hint:           'discord',
    code_challenge:        challenge,
    code_challenge_method: 'S256',
    state
  })

  const authUrl = `${cfg.base}/realms/${cfg.realm}/protocol/openid-connect/auth?${params}`
  await shell.openExternal(authUrl)
}

export async function handleOAuthCallback(rawUrl: string): Promise<void> {
  let url: URL
  try { url = new URL(rawUrl) } catch { return }

  if (url.protocol !== 'dyingstar:' || url.host !== 'auth' || url.pathname !== '/callback') return

  const code  = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (!code && !error) return // post-logout redirect

  if (error) {
    console.error('[Auth] OAuth error:', url.searchParams.get('error_description') ?? error)
    mainWindow?.webContents.send('auth:state-changed', {
      env: pkceSession?.env ?? 'universe-testing',
      status: 'error',
      error
    })
    return
  }

  if (!code || !state || !pkceSession || state !== pkceSession.state) {
    console.error('[Auth] Invalid callback: CSRF?')
    mainWindow?.webContents.send('auth:state-changed', {
      env: pkceSession?.env ?? 'universe-testing',
      status: 'error',
      error: 'invalid_callback'
    })
    return
  }

  const { env, verifier } = pkceSession
  pkceSession = null

  const cfg = AUTH_CONFIG[env]
  if (!cfg) return

  try {
    const tokens = await exchangeCodeForTokens(cfg, code, verifier)
    storeTokens(env, tokens)
    const user = extractUser(tokens)
    mainWindow?.webContents.send('auth:state-changed', { env, status: 'connected', user })
  } catch (err) {
    console.error('[Auth] Token exchange failed:', err)
    mainWindow?.webContents.send('auth:state-changed', { env, status: 'error', error: 'token_exchange_failed' })
  }
}

async function exchangeCodeForTokens(cfg: AuthConfig, code: string, verifier: string): Promise<TokenSet> {
  const endpoint = `${cfg.base}/realms/${cfg.realm}/protocol/openid-connect/token`
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      client_id:     cfg.clientId,
      code,
      redirect_uri:  REDIRECT_URI,
      code_verifier: verifier
    }).toString()
  })
  if (!res.ok) throw new Error(`Token exchange failed (${res.status}): ${await res.text()}`)
  return res.json() as Promise<TokenSet>
}

async function refreshTokens(cfg: AuthConfig, refreshToken: string): Promise<TokenSet | null> {
  const endpoint = `${cfg.base}/realms/${cfg.realm}/protocol/openid-connect/token`
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      client_id:     cfg.clientId,
      refresh_token: refreshToken
    }).toString()
  })
  if (!res.ok) return null
  return res.json() as Promise<TokenSet>
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

export function registerAuthHandlers(win: BrowserWindow): void {
  mainWindow = win

  // Login — reçoit l'env pour savoir quelle config Keycloak utiliser
  ipcMain.handle('auth:login', async (_event, env: Env) => {
    try {
      await startLogin(env)
    } catch (err) {
      console.error('[Auth] Failed to open browser:', err)
      mainWindow?.webContents.send('auth:state-changed', {
        env,
        status: 'error',
        error: 'browser_open_failed'
      })
    }
  })

  // Logout — efface les tokens de l'env concerné
  ipcMain.handle('auth:logout', (_event, env: Env) => {
    const cfg    = AUTH_CONFIG[env]
    const tokens = loadTokens(env)
    clearStoredTokens(env)

    if (cfg && tokens?.id_token) {
      const params = new URLSearchParams({
        client_id:                cfg.clientId,
        post_logout_redirect_uri: REDIRECT_URI,
        id_token_hint:            tokens.id_token
      })
      shell.openExternal(
        `${cfg.base}/realms/${cfg.realm}/protocol/openid-connect/logout?${params}`
      )
    }
  })

  // Restauration au démarrage — par env
  ipcMain.handle('auth:load-user', async (_event, env: Env): Promise<UserInfo | null> => {
    const cfg    = AUTH_CONFIG[env]
    const tokens = loadTokens(env)
    if (!cfg || !tokens) return null

    const refreshed = await refreshTokens(cfg, tokens.refresh_token)
    if (!refreshed) { clearStoredTokens(env); return null }

    storeTokens(env, refreshed)
    return extractUser(refreshed)
  })
}