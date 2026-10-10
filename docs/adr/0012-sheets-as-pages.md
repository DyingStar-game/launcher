# 0012. Player and organisation sheets as pages

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** maintainer
- **Scope:** Social, navigation
- **Supersedes:** the modal and the `viewed` store state of [ADR 0009](./0009-player-profile-sheet.md)
  and [ADR 0010](./0010-organisation-sheet.md); their content and actions stand

## Context

The player and organisation sheets open in a modal (ADR 0009, 0010). The maintainer
(2026-10-10) expects them to grow and pointed at the members of an organisation: the modal
already stops at the first 50, and a long list in a small modal reads badly.

`social` pages an organisation's members: `GET /api/corporations/:id/members?limit=&offset=`,
ordered by rank priority (highest first), then join date (`listCorporationMembers` at commit
`4df4e0a`).

## Decision

- **Two pages**, `PlayerPage` and `OrganisationPage`, on a `DetailPageLayout` template: a back
  button, a header (avatar, name, status or recruitment, action), a stats row, then two columns
  — main (biography and role-play sheet; description and members) and aside (organisations and
  political entities; CEO, holding company and subsidiaries).
- **Navigation**: the navigation store gains the views `player` and `organisation`, with the
  subject (`id`, `env`). `openPlayer(id)` / `openOrganisation(id)` open them and remember where
  the player came from; **Back** returns there (a history stack). Navbar links and the
  environment switch start a fresh history. The navbar keeps **Social** highlighted on these
  pages.
- A subject from another environment is not shown: switching environment already navigates to
  that environment's home.
- **Members**: the whole list, 50 at a time, with "Load more"
  (`social:get-organisation-members (env, id, offset)` → `{ members, total }`). The organisation
  sheet no longer carries members (only the CEO, found among the first 50 of the page payload).
- The modals, `SheetModal` and the social store's `viewed` state go away. Loading a sheet uses a
  shared hook (`useSocialResource`), which ignores a late answer for a previous subject.

## Consequences

- Room for more content on both sheets; long lists scroll with the page.
- One more request when an organisation page opens (its first members page).
- Back history lives in memory only; it resets when the launcher restarts.
