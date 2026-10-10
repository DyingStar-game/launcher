# 0016. shadcn/ui on Radix for interactive primitives

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** maintainer
- **Scope:** Renderer
- **Supersedes:** the "shadcn/ui" item of "Not adopted from adminpanel" in
  [ADR 0011](./0011-atomic-design.md)

## Context

The renderer builds its interactive primitives by hand:

- the navbar burger menu (`NavbarMoreMenu`): open state, click outside, Escape and a
  `matchMedia` listener, but no arrow-key navigation, no typeahead, no focus return to the
  toggle, and a fixed position that does not avoid the window edges;
- the sound volume panel (`SoundVolumeMenu`): opens on hover only, so it cannot be reached
  with the keyboard (a click on the speaker toggles mute, and must keep doing so);
- `Modal`: Escape and click outside, but no focus trap, no initial focus, no focus return and no
  scroll lock;
- tooltips are native `title` attributes (browser look, mouse only); the social page tabs are
  plain buttons.

[ADR 0011](./0011-atomic-design.md) kept shadcn/ui out "for now" and asked to revisit it in its
own ADR for accessible dialogs and menus. [ADR 0015](./0015-component-variants-cva-cn.md) since
put `cva` and `cn()` in place, the pattern shadcn components are written in.

`adminpanel` uses shadcn/ui on Radix (`radix-ui` package, `radix-nova` style) with components in
`components/ui/` and lucide icons
([adminpanel ADR 0014](https://github.com/DyingStar-game/adminpanel/blob/develop/docs/adr/0014-atomic-design-shadcn.md)).

State on 2026-10-10: `radix-ui` 1.7.0 (published 2026-10-09, React 19 supported), shadcn CLI
4.21, Base UI (`@base-ui/react`) 1.9, which shadcn also offers as a base.

## Options considered

1. **Keep hand-made primitives**, add keyboard and focus handling ourselves. No dependency, but
   we would reimplement and maintain what Radix does (roving focus, focus trap, collision-aware
   positioning, ARIA), with the risk of getting it subtly wrong.
2. **Radix primitives directly**, styled by our atoms. Behaviour solved, but every wrapper is
   written from scratch and diverges from adminpanel.
3. **shadcn/ui on Radix**, as adminpanel: the CLI copies the components into the repo (owned
   code, written with `cva` / `cn()`), on top of `radix-ui`. Same stack and conventions across
   DyingStar repositories.
4. **shadcn/ui on Base UI.** Same idea, maintained base too, but differs from adminpanel for no
   need of ours.

## Decision

We will take option 3, **for interactive primitives only**.

- **Scope.** shadcn components are added only where they bring behaviour: `DropdownMenu` (burger
  menu), `Popover` + `Slider` (sound volume: hover or the down arrow opens it, a click on the
  speaker still toggles mute), `Tooltip` (every tooltip; no native `title` attribute,
  lint-enforced), `Tabs` (social page tabs). The visual atoms stay ours (`Button`, `Badge`,
  `TabButton`, `Avatar`…, ADR 0015): no shadcn `button`, `badge` or theme.
- **Setup.** `components.json` like adminpanel's (`radix-nova` style, `rsc: false`, `utils` →
  `@lib/cn`), with components in `src/renderer/components/ui/`. Dependencies: `radix-ui`,
  `lucide-react` (the icons shadcn components import) and `tw-animate-css` (their open / close
  animations, as in adminpanel). The `shadcn` package is not installed: the `data-*` variants its
  stylesheet defines are copied into `assets/shadcn.css`.
- **Theme.** The shadcn CSS variables (`--background`, `--popover`, `--accent`, `--ring`…) are
  mapped onto the launcher tokens (`--color-ds-*`) in `main.css`; generated components are then
  restyled to the launcher look where needed. The launcher's identity does not change.
- **Atomic levels.** `components/ui/` sits at the atom level: pure (no store, no `window.api`),
  may be imported by every level, imports nothing from the other levels. Lint gets the same
  rules as `atoms/`, and `ui/` is allowed raw `<button>` elements (ADR 0015's
  `react/forbid-elements` ignores it).
- **Frameless window.** Radix renders menus, popovers, tooltips and dialogs in a portal at the
  end of `<body>`, outside the navbar's `app-drag` region. Their content must carry
  `app-no-drag`, set once in the generated `ui/` components, or clicks on the parts that overlap
  the navbar are taken by window dragging.
- **Tests.** Every migrated component keeps or gains a test, including keyboard (open with
  Enter / Space, arrows, Escape) and focus return. The jsdom setup gets the polyfills Radix needs
  (`ResizeObserver`, `scrollIntoView`, pointer capture).
- **Delivery.** In its own pull request, after the one introducing ADR 0015; one primitive at a
  time (menu, volume, modal, tooltips, tabs), each checked in the running launcher.

## Consequences

- Keyboard and screen-reader access for menus, popovers, dialogs and tabs comes from Radix, not
  from our code; `NavbarMoreMenu` and `SoundVolumeMenu` lose their hand-written
  open / close / outside-click logic.
- New dependencies: `radix-ui`, `lucide-react`, `tw-animate-css`, and the shadcn CLI as a
  one-off tool (run with `make pnpm dlx shadcn@latest add …`, not installed).
- shadcn code is ours: upstream changes are pulled on purpose, component by component.
- `Modal` turned out to be unused (its only caller, `ChangelogModal`, was imported nowhere):
  both are removed, and shadcn's `Dialog` is added when a modal is needed again.
- Most inline SVG icons stay (the wiki and language icons use lucide, as in adminpanel);
  switching the others is a separate, optional change.
- If Radix stalled, moving the `ui/` components to Base UI would be contained to that folder.
