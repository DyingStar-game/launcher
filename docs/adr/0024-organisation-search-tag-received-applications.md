# 0024. Organisation search as you type, "tag", and received applications in the social page

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** maintainer
- **Scope:** Social page, organisations
- **Supersedes:** the directory loaded by `social:load` with a search button
  ([ADR 0007](./0007-social-player-side.md)); in [ADR 0023](./0023-social-page-two-sections.md),
  "applications to an organisation stay on its management page"; in
  [ADR 0021](./0021-organisation-management.md), the applications part of the management page's
  **Requests** tab and the renderer-only rights helper
- **Builds on:** [ADR 0008](./0008-player-search-screen.md) (player search)

## Context

After seeing the two-section social page (ADR 0023), the maintainer (2026-10-10) asked for:

1. **Find an organisation** to search like **Find players**: results while typing, not a
   directory loaded with the page and filtered by a button.
2. The word **"tag"** instead of "ticker" in the UI — the short code shown in brackets after an
   organisation's name. `social` names it `ticker`.
3. Under **Organisations → Requests**, the applications **received** by the organisations where
   the player may accept or refuse them, next to the invitations received and applications sent.

`social` (commit `75eb1ce`): `GET /corporations?search=&limit=` matches name or ticker,
ordered by member count; `GET /corporations/:id/requests` lists an organisation's pending
applications and invitations (`recruit` or `invite`), each with the player's profile and
`message`; accepting or declining an application needs `recruit` (the CEO holds everything); a
player who joined meanwhile gives `409 CONFLICT`.

## Decision

### Search

- **Find an organisation** works as ADR 0008: from 2 characters, 300 ms after the last
  keystroke, first 20 organisations (`limit=20`), an older answer never replacing a newer one;
  below 2 characters, the same "type at least 2 characters" message. The query is page state
  (ADR 0013).
- The debounce and ordering logic is one hook, `useLiveSearch`, used by both searches.
- Main: `social:search-organisations (env, query)` → `SocialResult<OrganisationSearchResult[]>`
  (`id`, `name`, `ticker`, `members`, `recruitment`). Membership and pending application are
  derived in the renderer from the loaded memberships and applications, as for players.
- `social:load` no longer loads the directory: `SocialSnapshot.organisations`, the store's
  `orgaSearch` / `searchOrgas` and the `OrganisationSearch` box go away.

### "Tag"

- Every user-facing string says **tag** (en) / **tag** (fr) instead of ticker. Code, types and
  the API keep `ticker`, the service's name.

### Received applications

- `src/shared/organisationRights.ts` (pure, used by main and renderer, with its test) holds
  `can(rank, permission)`: CEO, or the permission listed. It replaces ADR 0021's renderer-only
  `lib/organisationRights.ts`; the other helpers of ADR 0021 join it when needed.
- `social:load` also fetches `GET /corporations/:id/requests?limit=100` for each membership
  whose rank `can(…, 'recruit')`, and keeps the applications:
  `SocialSnapshot.receivedApplications: { organisation, applications: { id, player, message? }[] }[]`.
- **Organisations → Requests** shows, in this order: invitations received, then one group per
  organisation ("Applications to Nova [NOVA]") with Accept / Decline on each application (the
  player opens the applicant's page; the message shows under the name), then applications
  sent. The Requests count (sub-tab and sidebar) adds the received applications.
- Main: `social:answer-organisation-request (env, organisationId, requestId, accept)`; errors:
  `403` → `forbidden`, `404` → `requestNotFound`, `409` → `alreadyMember` (the applicant joined
  meanwhile). Each answer reloads the social data.
- The management page (ADR 0021) keeps, in its **Requests** tab, only the **invitations sent**
  (withdraw, `invite`); applications are answered from the social page.

## Consequences

- Both searches behave the same; opening the social page makes one request fewer, and one more
  per organisation the player recruits for.
- A recruiter sees waiting applications in the sidebar count without opening any organisation.
- Lists of received applications are capped at 100 per organisation, like the others.
