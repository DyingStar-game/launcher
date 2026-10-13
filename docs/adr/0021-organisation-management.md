# 0021. Managing one's organisation from the launcher

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** maintainer
- **Scope:** Social, organisations
- **Builds on:** [ADR 0007](./0007-social-player-side.md) (client, `SocialResult`),
  [ADR 0010](./0010-organisation-sheet.md) / [ADR 0012](./0012-sheets-as-pages.md) (organisation
  page), [ADR 0016](./0016-shadcn-radix-interactive-primitives.md) (menus, dialogs, tabs),
  [ADR 0020](./0020-edit-own-profile.md) (edit page pattern),
  [ADR 0022](./0022-forms-react-hook-form-zod.md) (forms), [ADR 0023](./0023-social-page-two-sections.md) (social page sections); lifts "corporation management" out
  of ADR 0007's excluded scope

## Context

A player can create, join or apply to an organisation (corporation in `social`), but nothing
more. The maintainer (2026-10-10) wants its members to run it from the launcher: edit it,
answer applications, change a member's rank, remove a member — and also leave it, invite
players, manage ranks, transfer leadership and disband.

`social` (checked against `social/src` at commit `75eb1ce`, 2026-10-08) decides every right
from the caller's **rank**: `permissions` (`manage_corporation`, `manage_ranks`,
`manage_members`, `invite`, `recruit`), a `priority` (higher wins) and `isCeo` (holds every
permission). Rules that matter to the UI:

| Action                                      | Route                                                         | Right and limits                                                                                                                                |
| ------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Edit name, ticker, description, recruitment | `PATCH /corporations/:id`                                     | `manage_corporation`; name 3–48, ticker 2–5 alphanumeric (upper-cased), description ≤ 2000; name / ticker taken → `409`                         |
| List applications and invitations           | `GET /corporations/:id/requests`                              | `recruit` or `invite`; items carry `kind`, `message`, the player's profile                                                                      |
| Accept / decline an application             | `POST /corporations/:id/requests/:rid/accept` · `decline`     | `recruit`                                                                                                                                       |
| Withdraw an invitation                      | `POST /corporations/:id/requests/:rid/decline`                | `invite`                                                                                                                                        |
| Invite a player                             | `POST /corporations/:id/invitations {playerId}`               | `invite`; a pending application from that player is accepted at once (`joined: true`); already member / invitation pending / block → `409`      |
| Answer an invitation (invited player)       | `POST /me/corporation/requests/:rid/accept` · `decline`       | the invited player                                                                                                                              |
| Change a member's rank                      | `PATCH /corporations/:id/members/:pid {rankId}`               | `manage_members`; not oneself; target's rank **and** new rank strictly below the caller's; never the CEO rank (transfer instead)                |
| Remove a member / leave                     | `DELETE /corporations/:id/members/:pid`                       | oneself: anyone but the CEO; another: `manage_members` and target strictly below                                                                |
| List ranks                                  | `GET /corporations/:id/ranks`                                 | public, highest first                                                                                                                           |
| Create / edit / delete a rank               | `POST` · `PATCH` · `DELETE /corporations/:id/ranks[/:rankId]` | `manage_ranks`; priority 0–99 and strictly below the caller's; CEO rank: name only; default rank: not deletable, always one; name taken → `409` |
| Transfer leadership                         | `POST /corporations/:id/transfer {playerId}`                  | CEO; the new CEO must be a member; the former CEO gets the highest non-CEO rank                                                                 |
| Disband                                     | `DELETE /corporations/:id`                                    | CEO; deletes everything                                                                                                                         |

`GET /me/corporations` already gives the caller's rank in each organisation (`rank` with `id`,
`name`, `priority`, `isCeo`, `permissions`), and member lists give each member's full rank.
Rank permissions may also hold cross-service actions (`economie:treasury:manage`,
`mission:*`…), set elsewhere. Logo (`logoUrl`), holding company and political attachment are
also editable on the service.

## Options considered

Where management happens:

1. **One management page per organisation**, with a tab per area, opened from the organisation
   page — the public page stays a read view; each area has room.
2. **Controls on the public organisation page** (buttons on member rows, an edit mode) — fewer
   screens, but the public page mixes reading and administration, and ranks / requests have no
   natural place there.

How the launcher knows what the player may do:

- **A. From the player's rank** (`/me/corporations`), mirroring the service's rules to hide what
  would be refused; the service stays the authority and its `403` is still handled.
- **B. Show everything** and rely on `403` — simpler, but players see actions they cannot use.

## Decision

Option 1 and A. Logo, holding company and political attachment stay out of scope (no upload;
no UI for the hierarchy yet).

### Rights in the renderer

- `social:load` keeps the player's memberships with their rank: `SocialSnapshot.memberOf`
  becomes `memberships: { id, name, ticker, rank: { id, name, priority, isCeo, permissions } }[]`.
- A pure helper `lib/organisationRights.ts` mirrors the table above: `can(rank, permission)`
  (CEO or listed), `canActOn(myRank, targetRank)` (strictly below), `assignableRanks(myRank,
ranks)` (non-CEO, strictly below). Every control is shown only when the helper allows it; a
  `403` from the service still maps to `forbidden`.

### Organisation page

- A member sees **Manage** when they hold any management right (any of the five permissions,
  or CEO) — it opens the `organisationManage` view (navigation store, Back, ADR 0012) — and
  **Leave** unless CEO (confirmation, then the page reloads as a non-member).
- On a player's page, **Invite to an organisation** appears when the player holds `invite` in at
  least one organisation the viewed player is not a member of: one organisation → a button,
  several → a `DropdownMenu` of them.

### Management page `OrganisationManagePage`

`DetailPageLayout` with the organisation header and `Tabs` (ADR 0016), only those the player
can use; the active tab is page state restored by Back (ADR 0013).

- **Details** (`manage_corporation`): name, ticker, description (BBCode), recruitment (`open` /
  `apply` / `closed`). Same saving rules as ADR 0020 (changed fields only, emptied description
  → `null`).
- **Requests** (`recruit` or `invite`): applications with the player (link to their page), their
  message, Accept / Decline (`recruit`); pending invitations with Withdraw (`invite`).
- **Members** (`manage_members`): the paged member list (ADR 0012) with, on each row the player
  can act on, a rank `DropdownMenu` (radio items: assignable ranks) and **Remove**
  (confirmation).
- **Ranks** (`manage_ranks`): the ranks, highest first; create, rename, set priority, set
  permissions (the five corporation permissions as checkboxes, labelled by our i18n), set as
  default, delete — each only on ranks the helper allows. Permissions the launcher does not
  show (cross-service actions) are **kept as they are** when a rank is saved.
- **Leadership** (CEO only): **Transfer** to a member (picked from the member list,
  confirmation) and **Disband** (confirmation typing the ticker). After a transfer the page
  reloads with the new rights; after disbanding the player goes back to the social page.

### Invited player

Organisation invitations received, and the player's pending applications, are listed under
Organisations → Requests of the social page (ADR 0023), with Accept / Decline and Withdraw
(`/me/corporation/requests/:rid/*`). `social:load` already fetches `/me/corporation/requests`;
invitations are no longer filtered out.

### Forms

The details and rank forms use React Hook Form with shared Zod schemas (ADR 0022).

### Confirmation

Destructive actions (remove, leave, transfer, disband, delete a rank, withdraw) go through a
`ConfirmDialog` molecule over the shadcn `alert-dialog` (Radix), added to `components/ui/`
(ADR 0016). The confirming button uses `Button loading`.

### Main process

- New channels, each → `SocialResult`: `social:update-organisation`,
  `social:get-organisation-requests`, `social:answer-organisation-request` (accept or decline,
  corporation side), `social:invite-to-organisation`, `social:answer-organisation-invitation`
  (player side), `social:set-member-rank`, `social:remove-member` (also leave),
  `social:get-organisation-ranks`, `social:create-rank`, `social:update-rank`,
  `social:delete-rank`, `social:transfer-organisation`, `social:disband-organisation`.
- New `SocialErrorCode`s: `forbidden` (a right missing or outranked — shown, the page reloads
  its rights), `rankNameTaken`, `alreadyMemberOrInvited` (invite `409`), `requestNotFound`
  (`404` on a request already answered elsewhere). `CONFLICT` and `FORBIDDEN` stay mapped per
  action (`SocialAction`), as in ADR 0007.
- Every new mapping and error case comes with its `*.test.ts`, every new component with its
  `*.test.tsx` (ADR 0011).

### Delivery

One branch and PR: ADR 0022 (forms, with `CreateOrganisationForm` migrated) and ADR 0023
(social page sections) first, then ADR 0020 (profile), then this one, area by area (details,
requests and invitations, members, ranks, leadership).

## Consequences

- An organisation can be run from the launcher without the admin panel.
- The rights helper duplicates the service's rules: when `social` changes them, update the
  helper and its tests with the cited commit; a mismatch shows as a `forbidden` error, never as a
  wrong change.
- Cross-service permissions are invisible in the launcher but preserved; a later ADR can show
  them using `GET /me/permissions/catalog`.
- Logo, holding company and political attachment remain to do.
- The management page loads its data per tab (requests, members, ranks), so one request per tab
  opened.
