import type { Env } from '@shared/types/env'

/** Token set persisted after OAuth code exchange or refresh. */
export interface TokenSet {
  access_token: string
  refresh_token: string
  id_token: string
  expires_in: number
  token_type: string
}

/** In-memory PKCE session while the user completes login in the browser. */
export interface PKCESession {
  env: Env
  verifier: string
  state: string
}
