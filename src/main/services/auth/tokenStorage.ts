import { app, safeStorage } from 'electron'
import fs from 'fs'
import path from 'path'
import log from 'electron-log'
import type { Env } from '@shared/types/env'
import type { TokenSet } from './types'

let loggedPlainFallback = false

/** Returns the encrypted token file path for the given environment. */
function getTokenPath(env: Env): string {
  const filename = env === 'universe' ? 'tokens.enc' : `tokens-${env}.enc`
  return path.join(app.getPath('userData'), filename)
}

function logPlainFallbackOnce(): void {
  if (loggedPlainFallback) return
  loggedPlainFallback = true
  log.info(
    '[Auth] Token encryption unavailable on this system (common on Linux/WSL without a keyring). ' +
      'Tokens are stored as JSON in userData — use a supported OS keyring for encrypted storage.'
  )
}

/** Encrypts and writes the token set to disk. */
export function storeTokens(env: Env, tokens: TokenSet): void {
  const json = JSON.stringify(tokens)
  if (safeStorage.isEncryptionAvailable()) {
    fs.writeFileSync(getTokenPath(env), safeStorage.encryptString(json))
  } else {
    logPlainFallbackOnce()
    fs.writeFileSync(getTokenPath(env), json, 'utf-8')
  }
}

/** Loads and decrypts the token set, or null if missing / corrupt. */
export function loadTokens(env: Env): TokenSet | null {
  const p = getTokenPath(env)
  if (!fs.existsSync(p)) return null
  try {
    const buf = fs.readFileSync(p)
    if (safeStorage.isEncryptionAvailable()) {
      return JSON.parse(safeStorage.decryptString(buf)) as TokenSet
    }
    return JSON.parse(buf.toString('utf-8')) as TokenSet
  } catch {
    return null
  }
}

/** Deletes stored tokens for the environment. */
export function clearStoredTokens(env: Env): void {
  const p = getTokenPath(env)
  if (fs.existsSync(p)) fs.unlinkSync(p)
}
