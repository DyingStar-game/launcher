# 0009. Player profile sheet

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** maintainer
- **Scope:** Social
- **Builds on:** [ADR 0007](./0007-social-player-side.md), [ADR 0008](./0008-player-search-screen.md)

## Context

The maintainer asked (2026-10-10) to **see a player's sheet when clicking on them**. Players
appear in the friends list (social page and the universe grid's social panel), the player
search results and the friend requests.

`GET /api/profiles/:playerId` ("Joueur" section of `social`'s README, `profiles.routes.ts` at
commit `4df4e0a`) returns the public profile: `displayName`, `avatarUrl`, `faction`,
`biography`, `role`, `reputation`, `playtimeSeconds`, `rpSheet {characterName, story,
alignment}`, `createdAt`, the presence `status` (no location: friends only), and the player's
`corporations [{id, name, ticker}]` and `politics [{id, type, name}]` (`type` ∈ `commune`,
`agglomeration`, `department`, `region`, `country`, `federation`).

## Decision

- A **modal** sheet, mounted once in the shell so it opens from any screen, closed by
  Escape, a click outside or its close button. The social store holds the player being viewed
  (`viewPlayer(id)` / `closePlayer()`).
- **Opened by clicking a player** (avatar and name) in: friends rows, the social panel, player
  search results, incoming and outgoing requests. Buttons in those rows keep their own action.
- **Content**, empty parts hidden: name, status (with the star system for a friend in mission,
  from the friends list), faction and role; biography; role-play sheet (character name,
  alignment, story); corporations (name and ticker); political entities (name and level);
  reputation, playtime in hours, member since.
- **Action** in the sheet: the same relation action as in the search results (ADR 0008) —
  add, accept, or a badge (request sent, friend, you). The row component is shared.
- Main: `social:get-player (env, playerId)` → `SocialResult<PlayerProfile>`; a 404 is
  `playerNotFound`. Mapping in `mapping.ts`, with its test.

## Consequences

- One more request per opened sheet; nothing is cached, so the sheet is always current.
- Removing a friend, blocking or reporting a player could live in this sheet later; not in this
  step.
