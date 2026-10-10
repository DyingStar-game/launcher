# 0010. Organisation sheet, with join / apply

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** maintainer
- **Scope:** Social
- **Builds on:** [ADR 0007](./0007-social-player-side.md), [ADR 0009](./0009-player-profile-sheet.md)

## Context

The player sheet (ADR 0009) lists the player's organisations — a player may belong to several
corporations ("Corporations" section of `social`'s README). The maintainer asked (2026-10-10)
to **see an organisation** the same way, and to **apply** from it.

`GET /api/corporations/:corporationId` (public page, `corporations.service.ts`
`getCorporationPage` at commit `4df4e0a`) returns the corporation (`name`, `ticker`,
`description`, `logoUrl`, `recruitment`, `ceoId`, `createdAt`), `memberCount`, its `ranks`,
the **first 50** `members` (profile, `rank`, presence `status`), its `parent` (holding company,
or null) and its first 20 `subsidiaries` with `subsidiaryCount`. Joining is
`POST /api/corporations/:id/join` (ADR 0007): direct when `open`, an application when `apply`,
refused when `closed`.

## Decision

- **One sheet open at a time**: the store's `viewed` holds the env, the kind (`player` or
  `organisation`) and the id; it replaces ADR 0009's `viewedPlayer`. Opening a sheet from
  another sheet replaces it; there is no back history.
- The organisation sheet is a modal like the player sheet, mounted in the shell, opened by
  clicking an organisation's name in: the organisations tab, the player sheet, and its own
  parent / subsidiaries.
- **Content**, empty parts hidden: name and ticker, recruitment mode, member count, creation
  date, CEO, description, holding company, subsidiaries (with the total when more than 20),
  members sorted by rank then name (rank, presence; "and N more" past 50). Clicking a member
  opens their player sheet.
- **Action**, shared with the organisations tab's rows: "Join" (`open`), "Apply" (`apply`), or a
  badge — member, application sent, closed. Membership and pending applications come from the
  loaded social data, which gains `memberOf` and `appliedTo` (ids), so the action is right even
  for an organisation outside the directory page.
- Main: `social:get-organisation (env, id)` → `SocialResult<OrganisationProfile>`; a 404 is the
  new error code `organisationNotFound`. Mapping in `mapping.ts`, with its test.

## Consequences

- Applying sends no message (the service accepts an optional one); a message field can come
  later.
- Members past the first 50 are not listed (`GET /api/corporations/:id/members` pages them, not
  used yet).
- Leaving an organisation, answering invitations and managing one (ranks, members) stay out of
  the launcher for now.
