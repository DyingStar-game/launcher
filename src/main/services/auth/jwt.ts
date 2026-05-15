import type { UserInfo } from '@shared/types/auth'
import type { TokenSet } from './types'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Decodes the payload segment of a JWT without verifying the signature. */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid JWT')
  return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'))
}

/** Returns the JWT `sub` claim or null. */
export function getJwtSub(token: string): string | null {
  try {
    const sub = decodeJwtPayload(token)['sub']
    return typeof sub === 'string' && sub.length > 0 ? sub : null
  } catch {
    return null
  }
}

/** Returns true when `sub` is a valid player UUID. */
export function isValidPlayerSub(sub: string): boolean {
  return UUID_RE.test(sub)
}

/** Returns true when the JWT is not expired. */
export function isJwtNotExpired(token: string): boolean {
  try {
    const exp = decodeJwtPayload(token)['exp']
    if (typeof exp !== 'number') return false
    return exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

/** Returns the JWT `preferred_username` claim or null. */
export function getJwtPreferredUsername(token: string): string | null {
  try {
    const username = decodeJwtPayload(token)['preferred_username']
    return typeof username === 'string' && username.length > 0 ? username : null
  } catch {
    return null
  }
}

/** Returns true when the token satisfies game-launch requirements. */
export function isValidGameLaunchToken(token: string): boolean {
  const sub = getJwtSub(token)
  return (
    sub !== null &&
    isValidPlayerSub(sub) &&
    getJwtPreferredUsername(token) !== null &&
    isJwtNotExpired(token)
  )
}

/** Picks the id_token used to launch the game client. */
export function pickGameLaunchToken(tokens: TokenSet): string | null {
  const token = tokens.id_token
  if (!token || !isValidGameLaunchToken(token)) return null
  return token
}

/** Maps token claims to the renderer user profile. */
export function extractUser(tokens: TokenSet): UserInfo {
  const p = decodeJwtPayload(tokens.id_token)
  return {
    sub: p['sub'] as string,
    username: ((p['preferred_username'] ?? p['name']) as string | undefined) ?? 'Unknown',
    email: (p['email'] as string | undefined) ?? ''
  }
}

/** Human-readable reason when a game token is rejected. */
export function describeGameTokenIssue(tokens: TokenSet): string {
  const token = tokens.id_token
  if (!token) return 'id_token missing — sign in again'
  if (!isJwtNotExpired(token)) return 'id_token expired — sign in again'
  const sub = getJwtSub(token)
  if (!sub || !isValidPlayerSub(sub)) return `invalid sub UUID (${sub ?? 'empty'})`
  if (!getJwtPreferredUsername(token)) {
    return 'preferred_username missing from id_token (check Keycloak / profile scope)'
  }
  return 'unknown reason'
}
