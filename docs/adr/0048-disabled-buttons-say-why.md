# 0048. Disabled buttons: a not-allowed cursor, and why in a tooltip

- **Status:** Accepted
- **Date:** 2026-10-21
- **Deciders:** maintainer
- **Scope:** Buttons (`ui/button`, `atoms/SidebarItemButton`), tooltips
  (`molecules/LabelTooltip`), every disabled button
- **Builds on:** [ADR 0016](./0016-shadcn-radix-interactive-primitives.md) (tooltips),
  [ADR 0028](./0028-buttons-on-shadcn.md) (Button)

## Context

shadcn's Button gives a disabled button `pointer-events-none`: the pointer goes through it, so it
shows no cursor of its own and no tooltip. A disabled button looked like a dimmed one that did
nothing when clicked. Two places (the account block while sign-in is off, the donate button
without a link) worked around it with a focusable `span` carrying the tooltip; the others said
nothing.

## Decision

- **Look:** a disabled button keeps the pointer and shows a `not-allowed` cursor; its hover
  colours are for enabled buttons only (`not-disabled:hover:`), in `ui/button` and
  `SidebarItemButton` alike. Measured in a rendering test.
- **Why:** a button disabled for a reason the player cannot see says it in a tooltip:
  `LabelTooltip` with `disabled`, which puts the tooltip on a wrapper the keyboard can reach (a
  disabled button takes no focus), its `label` null when the button is enabled and needs none.
  Now: everything read (changelog), a link not configured (top bar), the game installing (game
  files), no successor chosen (handing over an organisation), sign-in unavailable (account).
- **No tooltip** when the reason is already on screen: an action under way (`Button loading`), a
  form that cannot be sent (its field errors), the home action bar's main button (its reason is
  written beside it).

## Consequences

- One look and one way to explain a disabled button; the hand-written wrappers are gone.
- A new disabled button needs its reason, unless one of the cases above applies; the rule is
  not lint-enforced.
- Disabled menu items (`MenuItemButton`) already showed the cursor; their reason is left for
  later.
