# 0007. Social, player side: wire the existing UI to the `social` service

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** maintainer
- **Scope:** Social (friends, friend requests, organisations)
- **Builds on:** [ADR 0003](./0003-process-boundaries-ipc.md) (main does the network calls),
  [ADR 0004](./0004-two-game-environments.md) (per env), [ADR 0005](./0005-keycloak-pkce-authentication.md) (player token)

## Context

The launcher already has a social UI — social panel on the universe grid, a social page with
three tabs — backed by **mock data** in `src/renderer/stores/social.ts`:

| UI feature                                                        | Mock action                       |
| ----------------------------------------------------------------- | --------------------------------- |
| Friends with status `online` / `ingame` (+ game name) / `offline` | `fetchAll`                        |
| Add a friend **by username**                                      | `addFriend(username)`             |
| Incoming friend requests: accept / decline                        | `acceptRequest`, `declineRequest` |
| Organisations: name, member count, member badge, join             | `joinOrga`                        |
| Create an organisation **by name**                                | `createOrga(name)`                |
| Remove a friend (store only, no button)                           | `removeFriend`                    |

The `social` service of [`DyingStar-game/services`](https://github.com/DyingStar-game/services/tree/develop/social)
covers all of it. Its README is the reference, section by section; the facts below were checked
against its code (`src/routes`, `src/services`) at commit `4df4e0a` (2026-10-06), and the
OpenAPI served in preprod is identical to that commit's (checked 2026-10-10, GET only).

- **Deployment**: preprod only, at `https://services-preprod.dyingstar-game.space/social`
  (`/api/health` → 200), trusting the issuer `https://auth-preprod.dyingstar-game.com/realms/dyingstar`
  — the Keycloak the launcher already signs in to for `universe-testing`. **No production
  deployment** yet (the `kubernetes` repository has `dev` and `preprod` only).
- **Auth** ("Joueur" section): `Authorization: Bearer <JWT Keycloak>`; any token of the realm,
  audience not checked; `player_id` = `sub`. A player is suspended or banned → `403 SANCTIONED`.
- **Profile creation**: a player's profile (`displayName` = `preferred_username`, unique) is
  created on their first `GET /api/me` only. Before it, they cannot be found nor befriended.
- **Lists** are paginated: `{ items, total, limit, offset }`, `limit` 1..100 (default 20);
  `GET /api/friends/requests` → `{ incoming, outgoing, incomingTotal, outgoingTotal, … }`.
- **Errors**: `{ error: CODE, message, status }`. Codes are coarse (`CONFLICT` covers
  "already friends", "request pending", "name taken"…); `message` is localised by `Accept-Language`.

Mapping the UI to the service:

| UI                     | Service                                                                                      | Gap                                                                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Friends + status       | `GET /api/friends` → `FriendView` (profile + `status` + `location`)                          | Presence is `online` / `mission` / `offline` with a `location {system, scene}`, not `ingame` + game name.                                                             |
| Add friend by username | `GET /api/profiles?search=` then `POST /api/friends/requests {playerId}`                     | The service wants a `playerId`: search, then keep the case-insensitive exact `displayName` match. A reverse pending request is accepted at once (`status: accepted`). |
| Requests               | `GET /api/friends/requests`, `POST …/:id/accept`, `POST …/:id/decline`                       | Request ids are numbers.                                                                                                                                              |
| Remove friend          | `DELETE /api/friends/:playerId`                                                              | —                                                                                                                                                                     |
| Organisations          | `GET /api/corporations` (directory, `memberCount`) + `GET /api/me/corporations` (membership) | "Organisation" = corporation. A corporation has `recruitment` `open` / `apply` / `closed`.                                                                            |
| Join                   | `POST /api/corporations/:id/join` → `joined: true` (open) or a pending application (apply)   | The UI only knows "member"; "application sent" and "closed" are new states.                                                                                           |
| Create                 | `POST /api/corporations {name, ticker}`                                                      | **`ticker` is required**: 2–5 alphanumeric characters, upper-cased. Name 3–48 characters.                                                                             |

The [adminpanel](https://github.com/DyingStar-game/adminpanel/blob/develop/docs/adr/0024-game-services-social-first.md)
calls the same service through a BFF, with a pinned OpenAPI, generated Zod schemas, MSW mocks
and the moderation / internal routes. The launcher is player-only and needs a small part of it.

## Options considered

How the launcher describes the API:

1. **Pinned OpenAPI + generated schemas** (adminpanel's way) — exact and checked, but a
   generator, a contracts folder and a sync test for about twelve routes and six shapes.
2. **Hand-written TypeScript types** for the routes used, in `src/shared/types/social.ts`, with
   the service commit they were checked against — small; drift is caught by reading the
   service's README / code when bumping the commit.

Where the calls run:

- **A. Renderer `fetch`** — fewer files, but the access token would reach the renderer, against
  ADR 0003 and 0005.
- **B. Main process client, `social:*` IPC** — as every other network call.

## Decision

Option 2 and B. **Scope: what the UI shows today**, nothing more (no groups, blocks, reports,
corporation management, politics, profile editing).

### Main process (`src/main/services/social/`)

- **Base URL per env**: `VITE_SOCIAL_BASE_UNIVERSE` / `VITE_SOCIAL_BASE_TESTING` (without `/api`).
  Defaults: testing `https://services-preprod.dyingstar-game.space/social`, universe **empty**.
  Empty → social is unavailable for that env (ADR 0004), not an error.
- **Token**: the env's Keycloak `access_token`, refreshed when expired (same refresh as
  `loadFreshGameToken`); on `401`, refresh once and retry, then `invalidateSession(env)`.
- **Client**: `fetch` with the HTTP timeout of `HTTP_TIMEOUT_MS.api`, JSON in and out. No
  `Accept-Language`: the service's localised `message` is never shown, only our codes.
- **Profile first**: every load starts with `GET /api/me`, so the player exists for others.
- **Lists**: one page of 100 (the service's maximum) — enough for friends and requests today;
  the organisation directory shows the first 100 by member count, with the service's `search`.
- **Errors never cross IPC as text** (ADR 0003): handlers resolve to
  `{ ok: true, data } | { ok: false, error: SocialErrorCode }` — a thrown `Error` loses its
  fields through IPC. Codes: `unavailable` (no URL, network, timeout, 5xx), `notSignedIn`,
  `sessionExpired`, `sanctioned`, `playerNotFound`, `alreadyFriendsOrPending`, `blocked`,
  `invalidTarget`, `nameOrTickerTaken`, `alreadyMemberOrPending`, `recruitmentClosed`,
  `invalidInput`, `unknown`. `CONFLICT` is mapped by the route that got it.
- **Channels**: `social:load` (me + friends + requests + my corporations + my corporation
  requests + directory filtered by `search`), `social:add-friend`, `social:remove-friend`,
  `social:accept-request`, `social:decline-request`, `social:join-organisation`,
  `social:create-organisation`.
- **Code**: `src/main/services/social/` — `client.ts` (token, retry, error codes), `mapping.ts`
  (pure: API → launcher types, error mapping), `service.ts` (one function per action),
  `handlers.ts` (IPC). Types in `src/shared/types/social.ts`.

### Renderer

- `stores/social.ts` keeps its shape (`Record<Env, …>`) and actions; the mock goes away. State
  per env gains `status: 'idle' | 'loading' | 'ready' | 'unavailable' | 'notSignedIn' | 'error'`.
- Friend status: `online`, `mission` (shown with `location.system` when known, replacing the
  mock's `ingame` + game name), `offline`.
- Organisations: show the ticker; badge "member"; "application sent" for a pending application;
  no join button when `recruitment` is `closed`.
- Create organisation: the form gains a **ticker** field (2–5 letters or digits).
- Outgoing friend requests: listed under the requests tab, with "cancel" (`decline` by sender).
- Data is loaded when the social page or panel mounts, on env switch and after each action.
  No polling in this step.
- Every new string in `en.json` and `fr.json`.

### Tests

Vitest (as in adminpanel), run by `make check` and CI: `pnpm test` runs `src/**/*.test.ts` in
Node. This step covers the pure mapping (`mapping.test.ts`) and the HTTP client with `fetch`,
auth and configuration mocked (`client.test.ts`). Renderer component tests (Testing Library)
are not set up yet.

## Consequences

- Social works on `universe-testing` as soon as this ships; on `universe` it shows
  "unavailable" until production `social` exists and `VITE_SOCIAL_BASE_UNIVERSE` is set.
- Hand-written types can drift: when the service changes, re-check the routes above against
  its README and code, and update the commit cited here.
- A new mapping or error case comes with its test next to the code (`*.test.ts`).
- Friends list and directory are capped at 100; pagination in the UI comes when lists grow.
- Presence only refreshes on load; live presence would need polling or a push channel.
