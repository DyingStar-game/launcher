import { APP_PROTOCOL } from './constants'

/** OAuth2 / OpenID client id registered in Keycloak. */
export const AUTH_CLIENT_ID =
  (import.meta.env.VITE_AUTH_CLIENT_ID ?? 'dyingstar-launcher').trim() || 'dyingstar-launcher'

/** Keycloak realm name. */
export const AUTH_REALM = (import.meta.env.VITE_AUTH_REALM ?? 'dyingstar').trim() || 'dyingstar'

/** Redirect URI registered for the desktop OAuth flow. */
export const AUTH_REDIRECT_URI =
  (import.meta.env.VITE_AUTH_REDIRECT_URI ?? `${APP_PROTOCOL}://auth/callback`).trim() ||
  `${APP_PROTOCOL}://auth/callback`

/** OpenID scopes requested during login and refresh. */
export const AUTH_SCOPES = 'openid email profile'

/** Identity provider hint passed to Keycloak (Discord). */
export const AUTH_IDP_HINT = 'discord'

/** In-app OAuth window size (Keycloak / Discord login). */
export const AUTH_WINDOW_BOUNDS = {
  width: 480,
  height: 720,
  minWidth: 400,
  minHeight: 520
} as const
