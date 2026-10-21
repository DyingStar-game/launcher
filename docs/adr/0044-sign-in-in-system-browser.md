# 0044. Sign-in in the system browser

- **Status:** Accepted
- **Date:** 2026-10-21
- **Deciders:** maintainer
- **Scope:** Authentication (`main/services/auth/`, `stores/account`)
- **Supersedes:** the in-app window of [ADR 0005](./0005-keycloak-pkce-authentication.md)
  (option 3); the rest of ADR 0005 (PKCE, tokens in main, custom protocol, game launch) stands.

## Context

Since v0.3.0, sign-in opens Keycloak in an in-app `BrowserWindow`, which then shows Discord's
login page. Until v1.0.0 it shared the launcher's cookies, so a player signed in once was rarely
asked again. v1.0.0 gave it its own session (`persist:auth`), cleared on sign-out, so that the next
sign-in asks for the account again: since then, players have to type their Discord credentials
(or scan a QR code) in a window of the launcher, while they are already signed in to Discord in
their browser. Players reported it; the browser sign-in of the versions before v0.3.0 worked
better for them.

## Options considered

1. **Keep the in-app window, share the launcher's cookies again.** Asks less often, but the
   Discord login page stays in a window the player does not trust, without their password
   manager, and sign-out no longer forgets the account.
2. **Sign in in the system browser** (option 2 of ADR 0005): Keycloak's authorize URL opens in
   the player's browser, where Discord already knows them; Keycloak redirects to
   `dyingstar://auth/callback`, which the OS hands back to the launcher. In development the OS
   hands it to the installed launcher, not to `make dev` (under WSL, the browser and the protocol
   are Windows ones), so the sign-in cannot be tested there.
3. **Redirect to a loopback address** (`http://127.0.0.1:<port>/callback`, RFC 8252): works in
   development too, but needs a change of the Keycloak clients and a local HTTP server.

## Decision

We take option 2 for the packaged launcher, and keep the in-app window in development
(`is.dev`), where the redirect is caught in the window and nothing depends on the OS.

- `auth:login` opens the authorize URL (PKCE, `state`, `kc_idp_hint=discord`) with
  `shell.openExternal` and resolves at once; the account block shows "Signing in…" until the
  callback arrives on `auth:state-changed`, and a click on it cancels (the PKCE session is
  dropped, a late callback is refused as `invalid_callback`).
- The callback comes only through the custom protocol already registered (`open-url` on macOS,
  `second-instance` on Windows and Linux, which also brings the launcher to the front).
- The in-app window (`authWindow.ts`, its `persist:auth` session cleared on sign-out) is only
  used in development. Sign-out stays in the background (ADR 0005, v1.0.0): it ends the Keycloak
  session with the refresh token and opens nothing.

## Consequences

- The player signs in where Discord already knows them, with their password manager: usually one
  click on "Authorize".
- Sign-out ends the Keycloak session but not the browser's Discord session: the next sign-in does
  not ask for the Discord account again. Changing account means signing out of Discord in the
  browser.
- The browser asks to open the launcher on the redirect, and the Keycloak tab stays open
  afterwards.
- Development does not exercise the browser sign-in: it is checked on a packaged build
  (`make package`).
- Sign-in depends on the OS routing `dyingstar://` to the launcher: an install that did not
  register it (Linux without `xdg-mime`, a portable copy) stays on "Signing in…" until the player
  cancels.
