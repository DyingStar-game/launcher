import crypto from 'crypto'

/** Generates a PKCE code verifier and S256 challenge pair. */
export function generatePKCE(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(32).toString('base64url')
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

/** Generates a random OAuth state parameter. */
export function generateState(): string {
  return crypto.randomBytes(16).toString('base64url')
}
