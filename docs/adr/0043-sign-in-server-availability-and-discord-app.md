# 0043. Sign-in server availability, and Discord opened in its app

- **Status:** Accepted
- **Date:** 2026-10-17
- **Deciders:** maintainer
- **Scope:** Authentication (`main/services/gameStatus`, `stores/availability`, `stores/account`,
  `AccountMenu`, `GameActionBar`, `lib/gameAction`), external links
  (`main/services/externalLinks`)
- **Builds on:** [ADR 0005](./0005-keycloak-pkce-authentication.md) (Keycloak sign-in),
  [ADR 0003](./0003-process-boundaries-ipc.md) (IPC),
  [ADR 0039](./0039-slow-download-reconnect-and-game-version-refresh.md) (status polling)

## Context

A universe is available when its API answers `/version`. Keycloak is another server: when it is
down and the API is up, the launcher still offers "Sign in", and the sign-in window fails. A
player already signed in shows as signed out (the profile cannot be refreshed), and Play fails:
a launch always refreshes the token.

The status page (Cachet) already gives the game server's status (component 3, bottom left of the
home page); it has a component for the sign-in server too (4, "Authentification").

The Discord link of the top bar is an invite (`discord.gg/<code>`), opened in the browser even
for a player already on the server, who then goes through the invite page to reach the app.

## Options considered

1. **Sign-in server:** keep showing "Sign in" and report the failure after a click. Nothing to
   build, but the player learns it only by trying.
2. **Sign-in server:** request Keycloak itself (its public OpenID configuration). Exact, but a
   second way of telling a server's state next to the status page.
3. **Sign-in server:** read its component on the status page, like the game server. One source
   for every status, kept by the team.
4. **Discord:** open the server with `discord://-/channels/<guild id>`. Straight to the server,
   but nothing useful for a player not on it, and one more variable.
5. **Discord:** open the invite in the Discord app (`discord://-/invite/<code>`) when one is
   installed, the web page otherwise. The app goes to the server for a member and offers to
   join otherwise.

## Decision

We take options 3 and 5.

- **Check:** `env:check-auth-availability` (main) reads the Cachet component of the sign-in
  server (`VITE_STATUS_AUTH_COMPONENT_ID_*`, default 4). Sign-in is off when it is in a major
  outage or in maintenance; a status that cannot be read does not block it (the status page may
  be down while Keycloak is not).
- **When:** the sign-in server status and the game server status are TanStack queries
  ([ADR 0025](./0025-tanstack-query-server-state.md)) per universe (`lib/statusQueries`,
  `hooks/status/`), read while the universe is available, and again every
  `VITE_SERVER_STATUS_POLL_MINUTES` while the window is shown, or when it gets the focus back.
  The sign-in flag is true until a first answer, so sign-in never shows unavailable before the
  check. When it turns back to true, the session kept on disk is restored (`auth:load-user`), once
  per read.
- **Status page answers:** the status page allows 60 requests a minute, and each universe switch
  asks for the game server, its players and the sign-in server. An answer is reused for 30 s
  (`staleTime`), and a request already on its way is shared. Main tells when the status page did
  not answer (`reached: false`, `null` for the sign-in server): the query fails and keeps its last
  answer, instead of showing the server as down until the next poll.
- **Account block:** signed out while the sign-in server is down, it reads "Sign-in unavailable /
  Server unreachable", disabled, with a tooltip saying why. A signed-in player keeps the menu.
- **Main action:** a new `authDown` state, after `serverDown`, blocks Play and Sign in alike
  (a launch needs a fresh token), with the same disabled button as a server down.
- **Discord:** main opens every link of the launcher window through one function. An invite link
  (`discord.gg/<code>`, `discord.com/invite/<code>`) opens as `discord://-/invite/<code>` when
  the OS has an app for `discord://` (`app.getApplicationNameForProtocol`), and as the web page
  otherwise or when opening the app fails. Other links open in the browser as before.

## Consequences

- An outage of the sign-in server is shown as soon as the team (or its monitoring) sets it on the
  status page, and clears at the next poll after it is set back (every
  `VITE_SERVER_STATUS_POLL_MINUTES`). An outage not reported there is not seen.
- The account block reads the sign-in server status on every page, the action bar the game
  server's on the home page; both share one query per universe.
- On Linux, `getApplicationNameForProtocol` relies on the `x-scheme-handler/discord` MIME
  association: a Discord install that does not register it gets the web page.
