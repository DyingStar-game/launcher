# 0025. TanStack Query for data loaded through main

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** maintainer
- **Scope:** Renderer data loading (social first)
- **Supersedes:** the social Zustand store of [ADR 0007](./0007-social-player-side.md)
  ("`stores/social.ts` keeps its shape… reloaded after each action") and the `useSocialResource`
  hook of [ADR 0012](./0012-sheets-as-pages.md); their IPC channels and `SocialResult` stand
- **Builds on:** [ADR 0003](./0003-process-boundaries-ipc.md) (main does the network calls)

## Context

The social data the renderer shows comes from main through `window.api.social*`. The renderer
manages it by hand: a Zustand store per environment with a load sequence number (a late answer
must not overwrite a newer one), a reload after every action, `useSocialResource` for the
player and organisation pages, `useLiveSearch` for the searches, and "Load more" paging in
`OrganisationMembers`. ADR 0020 and ADR 0021 add many more reads (ranks, members, requests) and
writes, each needing the same care.

The [adminpanel](https://github.com/DyingStar-game/adminpanel/blob/develop/docs/adr/0010-frontend-stack.md)
uses **TanStack Query** for server state: query keys, `useQuery` / `useInfiniteQuery`,
`useMutation` with an invalidation after success, and a fresh retry-free client per test
(`renderWithProviders`). The maintainer (2026-10-10) wants the same here.

## Decision

- **Dependency**: `@tanstack/react-query`, latest major (ADR 0006). One `QueryClient`
  (`lib/queryClient.ts`), provided in `main.tsx`.
- **Server state goes through TanStack Query; Zustand keeps client state only** (environment,
  navigation, account, sound, persisted install metadata…). The social store goes away.
- **Query functions call `window.api`** and unwrap `SocialResult`: `{ ok: false }` throws a
  `SocialStoreError` carrying the code, translated where shown (`universe.socialPage.errors.*`).
- **Query keys** live in `lib/socialQueries.ts` (`socialKeys`), all starting with
  `['social', env]`, so one environment never shows another's data and an action can refresh
  everything social for its environment: `snapshot`, `player(id)`, `organisation(id)`,
  `members(id)`, `searchPlayers(query)`, `searchOrganisations(query)`, and the keys ADR 0020 /
  0021 add.
- **Hooks** in `hooks/social/`: one per read (`useSocialSnapshot`, `usePlayer`,
  `useOrganisation`, `useOrganisationMembers` with `useInfiniteQuery`, `usePlayerSearch`,
  `useOrganisationSearch`) and one per write (`useSendFriendRequest`, `useJoinOrganisation`…),
  each mutation invalidating `['social', env]` on success. Organisms and pages use these hooks;
  atoms, molecules and templates stay pure (ADR 0011).
- **Options**: `retry: false` for social (main already refreshes the token and retries a `401`
  once, ADR 0007; a coded error must show at once); default `staleTime` (0), so opening a page
  reloads its data as before; `refetchOnWindowFocus` on, so coming back to the launcher refreshes
  presence. A failed refresh keeps the data on screen (TanStack's default), as the store did.
- **Searches** keep ADR 0008 / 0024's behaviour: the query is debounced (300 ms,
  `useDebouncedValue`) and only enabled from 2 characters; the query key makes a late answer for
  an older query harmless. `useLiveSearch` goes away.
- **Load states** map as before: the snapshot's error code gives `unavailable` / `notSignedIn` /
  `error`; skeletons still wait 150 ms (ADR 0018). A sign-in or sign-out invalidates the
  environment's social queries.
- **Tests**: `src/renderer/test/render.tsx` renders with a fresh `QueryClient` (`retry: false`)
  and re-exports Testing Library; `seedSocial` mocks `window.api` answers instead of filling a
  store. Every hook has its test.

## Consequences

- Caching, deduplication, late-answer handling, refresh after an action and paging come from
  one library instead of code per screen; new screens (ADR 0020, 0021) are mostly hooks.
- One more runtime dependency; contributors need to know query keys and invalidation.
- Other data loaded through main (changelog, versions, server status) still uses its stores;
  it moves to TanStack Query when next changed, under this ADR.
