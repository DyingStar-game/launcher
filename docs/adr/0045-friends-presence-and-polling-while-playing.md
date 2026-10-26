# 0045. Friends' presence refreshed every minute, nothing polled while playing

- **Status:** Accepted
- **Date:** 2026-10-21
- **Deciders:** maintainer
- **Scope:** Social data (`hooks/social/useSocialSnapshot`, `main/services/social`), status
  queries (`hooks/status/`), game versions (`hooks/version/`, `stores/version`), game launch
  (`main/services/game`)
- **Supersedes:** the `staleTime` (0) of the social snapshot in
  [ADR 0025](./0025-tanstack-query-server-state.md); the rest of ADR 0025 stands
- **Builds on:** [ADR 0025](./0025-tanstack-query-server-state.md),
  [ADR 0043](./0043-sign-in-server-availability-and-discord-app.md) (status queries)

## Context

Friends and their presence (online, in mission, offline) come with the social snapshot: `/me`,
`/friends`, the friend requests, the player's organisations and their requests, five requests or
more. Nothing refreshes it on a timer: a player who stays on a page sees the same statuses until
they change page, come back to the window or act. With `staleTime` 0, every page change reloads
the whole snapshot.

The `social` service gets presence from the game servers' heartbeat, about once a minute, kept
90 s in its cache: reading it more often than once a minute shows nothing new.

While the game runs, the launcher stays open behind it, and its polls (game server and sign-in
server status, game versions) keep running for nobody. The game versions are still a store with
its own `setInterval`, which ADR 0025 moves to TanStack Query when next changed.

## Options considered

1. **Refetch the whole snapshot every minute.** Simple, but five requests or more a minute per
   player for one changing field.
2. **`/friends/online` every minute**, merged into the snapshot: a small answer, offline friends
   being the absent ones.
3. **`/friends` alone every minute**, merged into the snapshot: one request, every friend with an
   explicit status, the same shape the snapshot already maps.

## Decision

We take option 3, and stop polling while playing.

- **Friends:** `social:load-friends` (main) reads `/friends` alone. `useSocialSnapshot` reads it
  as its own query (`['social', env, 'friends']`, under the environment's key, so actions and
  sign-in still refresh it) and shows whichever of the two lists was read last. Only the
  components that show friends' presence (`SocialPanel`, `FriendsSection`) ask for it every
  minute; the others share the cache without a timer.
- **Snapshot:** `staleTime` 30 s: a page change within 30 s reuses it; actions, sign-in and the
  window getting the focus back still reload it.
- **Game versions:** a query (`['versions', 'game']`, `useLatestGameVersion`) read at each poll
  like the status (ADR 0039); a universe whose API does not answer keeps the version known. Play
  reads it again first (`fetchLatestGameVersion`), an install that ends refreshes it. The version
  store keeps the launcher's version only (`version:check`, once at startup: GitHub limits
  unauthenticated requests).
- **While playing** (`gameRunning`, pushed by main): the timers of the status, versions and
  friends queries stop; the data, stale by then, is read again when the player comes back to the
  launcher (focus) or when the game exits (`useRefreshAfterGame`).
- **Game launch:** the launcher window is minimized once the game has started; a minimized window
  is hidden, which stops every TanStack timer too. When the game exits, or crashes, the launcher
  is restored if it is still minimized.

## Consequences

- One request a minute per signed-in player looking at friends, instead of none (stale statuses)
  or five and more.
- A friend's status can lag behind by up to two minutes (heartbeat, then the poll).
- The launcher no longer stays in front of the game at launch, and comes back when the game
  closes.
- While playing, the status shown in the launcher is the last one read before launch, until the
  player comes back to it.
