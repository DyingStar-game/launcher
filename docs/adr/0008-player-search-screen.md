# 0008. Player search screen to add friends

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** maintainer
- **Scope:** Social
- **Extends:** [ADR 0007](./0007-social-player-side.md) (its "what the UI shows today" scope)

## Context

Adding a friend required typing an **exact** username in an inline form (ADR 0007): main
searched `GET /api/profiles?search=` and kept the exact match. The maintainer asked
(2026-10-10) for a list of matching players **while typing**, each with a button to send the
friend request, on a **screen of its own**.

`GET /api/profiles?search=&entityType=player` is a case-insensitive substring match on the
display name (≤ 64 characters), ordered by name; an empty search returns every player.

## Decision

- A fourth tab of the social page, **"Find players"** (`players`); the "Add friend" button of
  the friends tab opens it. The inline exact-username form is removed.
- **Search as you type**: from 2 characters, 300 ms after the last keystroke, first 20 players
  (`limit=20`). An older response never replaces a newer one.
- Each result shows its relation to the player, computed in the renderer from the loaded
  social data (`selfId`, friends, incoming and outgoing requests):

  | Relation         | Shown                                                  |
  | ---------------- | ------------------------------------------------------ |
  | none             | "Add" button → `POST /api/friends/requests {playerId}` |
  | incoming request | "Accept" button (accepts that request)                 |
  | outgoing request | "Request sent" badge                                   |
  | friend           | "Friend" badge                                         |
  | self             | "You" badge                                            |

- Main: `social:search-players (env, query)` → `SocialResult<PlayerSearchResult[]>` and
  `social:send-friend-request (env, playerId)` replace `social:add-friend (env, displayName)`.
  `SocialSnapshot` gains `selfId` (from `GET /api/me`).
- The relation logic is a pure function with its test (`playerRelation.test.ts`).

## Consequences

- Players are found by part of their name; only players who opened the social page once
  exist in `social` (profiles are created on `GET /api/me`).
- More requests to `social` while typing, bounded by the 2-character minimum and the debounce.
- Beyond 20 matches, the player refines the search; no pagination on this screen.
