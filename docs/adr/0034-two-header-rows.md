# 0034. Two header rows: the app, then the chosen universe

- **Status:** Accepted
- **Date:** 2026-10-11
- **Deciders:** maintainer (suggested by a contributor's review)
- **Scope:** Renderer header (`Navbar`, `UniverseBar`, `NavbarMoreMenu`, `AppLayout`)
- **Builds on:** [ADR 0004](./0004-two-game-environments.md) (two environments),
  [ADR 0011](./0011-atomic-design.md), [ADR 0026](./0026-no-px-in-tailwind-classes.md)
  (breakpoints in `rem`)

## Context

The header was one row: logo, universe switch (Universe / Universe Testing), the sections (Social,
Lore, Changelog), language, community links, sound, donate, account, window controls. Social,
Changelog and the account depend on the chosen universe (friends, unread versions, sign-in are per
environment), yet they sat beside the switch as if they were its siblings. The row was full: below
1400 px the sections, language, links and donate went into a burger menu, and the player's name
was cut to 96 px. The testing environment was announced by a banner on its home page only.

## Options considered

1. **Keep one row, regroup** (links in one menu, done before this ADR). Saves room, keeps the
   wrong hierarchy, still needs the burger below 1400 px.
2. **Two rows: the app, then the universe.** The top row holds what belongs to the whole app; a
   second row holds what depends on the chosen universe, and replaces the testing banner. Costs
   about 64 px of height on the live universe (the testing one already had the banner).
3. **A sidebar for the sections.** Takes width from the universe panels and the social page, which
   need it more than height.

## Decision

We will split the header in two rows (option 2):

- **Top bar** (`Navbar`, the window's drag area): logo, universe switch, language, community
  links, sound, donate, window controls.
- **Universe bar** (`UniverseBar`, under it, on every page): Home (the chosen universe's panels),
  Social, Changelog with its unread count; the account (`AccountMenu`) on the right. In the
  testing environment the row is tinted amber and says "Testing environment" (with "data is not
  from the live server" from the wide breakpoint up), in place of the old banner.
- Below the wide breakpoint the universe bar folds like the top bar: Home, Social and
  Changelog go into one menu (showing the current section and the unread count), the account
  block stays, and the testing notice moves, whole, to an amber strip under the bar.
- The wide breakpoint `nav-full` drops from 87.5rem (1400 px) to 64rem (1024 px, the default
  minimum window): the top bar fits whole at any window the launcher allows by default, the burger
  menu only serves narrower windows set through `VITE_WINDOW_MIN_WIDTH`. It no longer lists the
  sections, which are always in the universe bar.

## Consequences

- The hierarchy reads at a glance: pick a universe above, move within it below; the testing
  environment is visible on every page, not only its home.
- About 64 px less height for the pages in the live universe.
- Rendering tests (ADR 0033) guard both rows at 1024 px in French (the longest labels).
- Lore is not linked from the header any more: the maintainer judged the page useless.
