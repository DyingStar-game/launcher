# 0023. Social page in two sections: friends and organisations

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** maintainer
- **Scope:** Social page navigation
- **Supersedes:** the four sidebar tabs of [ADR 0007](./0007-social-player-side.md) and
  [ADR 0008](./0008-player-search-screen.md) (`friends`, `players`, `requests`, `organizations`);
  their content stands
- **Builds on:** [ADR 0013](./0013-back-restores-page-state.md) (Back restores page state),
  [ADR 0016](./0016-shadcn-radix-interactive-primitives.md) (`Tabs`)

## Context

The social page's sidebar lists four tabs: friends, find players, requests, organisations.
Requests only hold friend requests, and ADR 0021 brings organisation invitations and
applications. The maintainer (2026-10-10) wants the sidebar grouped by subject: **Friends**
gathering "find players" and "requests", and **Organisations** following the same logic.

## Decision

- The sidebar has **two entries**: **Friends** and **Organisations**. Each section has a row of
  **sub-tabs** (Radix `Tabs`, horizontal, nested in the section's panel), the same three for
  both:

  | Section       | Mine                                                   | Find                                               | Requests                                                                                                             |
  | ------------- | ------------------------------------------------------ | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
  | Friends       | my friends (today's friends tab)                       | find players (ADR 0008)                            | incoming friend requests (accept / decline), sent ones (cancel)                                                      |
  | Organisations | my organisations, with my rank; **Create** button here | the directory with search, join / apply (ADR 0007) | invitations received (accept / decline), my pending applications (withdraw: `/me/corporation/requests/:rid/decline`) |

- Under the two sections, a **My profile** entry opens the player's own sheet (a page, not a
  section: Back returns to the social page), where they edit their profile (ADR 0020). Asked by
  the maintainer on 2026-10-10.
- The **Requests** sub-tab shows the number of items waiting for the player (incoming friend
  requests; organisation invitations) as a `Badge`; the sidebar entry shows the same total.
- "Add friend" on _Mine_ opens _Find_; "Create" on the organisations' _Mine_ opens the create
  form in place, as today.
- The applications **to** an organisation the player manages stay on its management page
  (ADR 0021), not here.
- **Page state** (ADR 0013): `section` and the sub-tab per section (`tab:friends`,
  `tab:organisations`) go through `usePageState`; scroll memory is keyed by section and sub-tab.
- The universe grid's social panel is unchanged.

## Consequences

- Two sidebar entries instead of four; the same three sub-tabs in each section are learnt once.
- Nested tabs: two tab lists on screen; keyboard navigation stays Radix's (arrows within a list,
  Tab between lists).
- Existing page-state keys (`tab`) change; Back history is in memory only, so nothing persisted
  breaks.
