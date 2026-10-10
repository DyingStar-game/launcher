# 0005. Authentication: Keycloak PKCE in an in-app window, per environment

- **Status:** Accepted (recorded retroactively)
- **Date:** 2026-10-10
- **Scope:** Authentication, game launch

## Context

Players sign in with Discord through the DyingStar Keycloak, one per environment
([ADR 0004](./0004-two-game-environments.md)). The game itself expects a JWT on its command
line. A desktop app is a public OAuth client: it cannot keep a client secret.

## Options considered

1. **Resource-owner password grant** — the launcher collects credentials. Deprecated by
   OAuth 2.1, and Discord login cannot work that way.
2. **Authorization code + PKCE in the system browser**, callback through a custom protocol —
   standard for desktop apps, but leaves the launcher and depends on the browser handing the
   `dyingstar://` URL back to the OS.
3. **Authorization code + PKCE in an in-app `BrowserWindow`**, intercepting the redirect —
   stays in the launcher, while keeping the custom protocol as a fallback.

## Decision

We keep option 3:

- **Flow** (`src/main/services/auth/`): main generates the PKCE verifier / challenge and a
  `state`, opens a modal, sandboxed `BrowserWindow` on Keycloak's authorize URL with
  `kc_idp_hint=discord`, and intercepts navigation to `AUTH_REDIRECT_URI`
  (`dyingstar://auth/callback`). The code is exchanged for tokens in main; `state` must match.
- **Custom protocol as fallback**: `dyingstar://` is registered with the OS (`open-url` on
  macOS, `second-instance` argv on Windows with a single-instance lock, a `.desktop` file +
  `xdg-mime` on Linux, `src/main/protocol/linuxDesktop.ts`), and routed to the same callback
  handler.
- **Tokens stay in main**, one file per env in `userData`, encrypted with `safeStorage`; when
  no OS keyring is available (Linux / WSL without one) they fall back to plain JSON, logged
  once. The renderer only receives the user profile.
- **Game launch** refreshes the session first and passes a valid `id_token` as
  `--token=<jwt>`; an invalid or unrefreshable session clears tokens and reports
  `SESSION_EXPIRED` so the UI asks to sign in again.
- **State changes** are pushed to the renderer on `auth:state-changed` with structured
  `status` / `error` codes, never display text ([ADR 0003](./0003-process-boundaries-ipc.md)).
- Client id, realm, redirect URI and protocol are configurable through `VITE_AUTH_*` and
  `VITE_APP_PROTOCOL`.

## Consequences

- No secret ships in the binary; a stolen token file is encrypted where the OS allows it.
- The plain-JSON fallback is weaker; it is accepted for development and keyring-less Linux.
- Discord deep links (`discord://`) opened from the auth window must be handled so they do
  not break the flow.
- The in-app window spoofs a desktop Chrome user agent so Discord treats it as a normal browser;
  this may need updating when Discord changes its checks.
