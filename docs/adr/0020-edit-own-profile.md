# 0020. Editing one's own profile

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** maintainer
- **Scope:** Social, player profile
- **Builds on:** [ADR 0007](./0007-social-player-side.md) (client, `SocialResult`),
  [ADR 0009](./0009-player-profile-sheet.md) (what the sheet shows),
  [ADR 0012](./0012-sheets-as-pages.md) (pages and Back), [ADR 0014](./0014-bbcode-player-texts.md)
  (BBCode in player texts); lifts "profile editing" out of ADR 0007's excluded scope

## Context

A player can read their own sheet in the launcher but not change it; ADR 0007 left profile
editing out. The maintainer (2026-10-10) wants it now.

`social` (checked against `social/src` at commit `75eb1ce`, 2026-10-08) has
`PATCH /api/me`, with at least one field:

| Field                                       | Rule                                                                          |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| `displayName`                               | 2–32 characters, unique (`409 CONFLICT` when taken)                           |
| `avatarUrl`                                 | an URL, ≤ 512 characters, or `null` — no upload                               |
| `faction`                                   | ≤ 64 characters, or `null`                                                    |
| `biography`                                 | ≤ 2000 characters, or `null`                                                  |
| `rpSheet {characterName, story, alignment}` | ≤ 64 / 4000 / 32 characters; the whole object replaces the old one, or `null` |

It answers the updated profile. `displayName` is created from the Keycloak
`preferred_username` and the game receives the Keycloak JWT, so renaming in `social` would make
the social name differ from the in-game one.

## Options considered

Where the form lives:

1. **An edit page** opened from the player's own sheet, with Back (ADR 0012) — room for the long
   texts (biography 2000, story 4000).
2. **A modal** (`Dialog`) over the sheet — cramped for long texts, and ADR 0012 moved sheets out
   of modals for that reason.
3. **Edit in place** on the sheet — two modes in one page, harder to test and to read.

## Decision

Option 1. The maintainer chose (2026-10-10): **display name not editable**, **avatar out of
scope** (URL only on the service side; no field until an upload exists).

- **Fields**: faction, biography (BBCode, ADR 0014), and the role-play sheet — character name,
  alignment, story. Lengths are capped in the inputs with the service's limits.
- **Entry**: on the player's own sheet (`relation === 'self'`), the header action is an
  **Edit** button (`Button`, h-9) instead of the friend action. It opens a `profileEdit` view of
  the navigation store (ADR 0012); Back returns to the sheet.
- **Page** `ProfileEditPage` on `DetailPageLayout`: a form organism (`ProfileEditForm`) built
  with React Hook Form and a shared Zod schema (ADR 0022), with `InputField` for short texts and
  a new `TextareaField` molecule for long ones (label, counter `n / max`). Buttons **Save** (`Button loading` while saving, ADR 0018) and **Cancel** (Back).
  Leaving with unsaved changes does not warn in this step.
- **Saving** sends only the changed fields; a field emptied is sent as `null`; the role-play sheet
  is sent whole when one of its fields changed (the service replaces it), `null` when all three
  are empty. Nothing changed → Save is disabled. Success → back to the sheet, reloaded.
- **IPC**: `social:update-profile (env, patch)` → `SocialResult<void>` (`PATCH /api/me` answers
  the bare profile row, not a sheet; the sheet is reloaded instead, ADR 0025); the patch type
  `ProfilePatch` lives in `src/shared/types/social.ts`. Main parses it with the same Zod schema (ADR 0022) before sending.
- **Errors**: `400` → `invalidInput`, others as ADR 0007; shown above the form, the form keeps
  its values.
- Strings in `en.json` and `fr.json`; tests for the mapping of the patch (`*.test.ts`), the form
  and the page (`*.test.tsx`).

## Consequences

- Players fill in their sheet from the launcher; the in-game name stays the Keycloak one.
- Avatar and display name need a later ADR (an upload service; a rename policy shared with the
  game).
- A player who closes the page loses unsaved edits; a guard can come later if players complain.
