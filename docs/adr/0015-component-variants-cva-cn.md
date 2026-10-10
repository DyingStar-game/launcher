# 0015. Component variants with `cva` and `cn()`; buttons only through atoms

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** maintainer
- **Scope:** Renderer

## Context

[ADR 0011](./0011-atomic-design.md) organised the renderer in atomic levels, but two gaps showed
up in use:

- **Class composition was ad hoc.** Atoms built their classes with `[...].join(' ')` or template
  strings, with variants in hand-written lookup objects. A class passed by a caller could not
  override an atom's own: the navbar donate button had `hidden` in its `className`, yet stayed
  visible because the atom's `inline-flex` won in the generated CSS.
- **Raw `<button>` elements lived outside the atoms.** Icon buttons (modal and alert close,
  accept / decline a request, navbar icons, sound and menu toggles), text actions ("Cancel") and
  clickable identities each restyled a `<button>` locally, because the `Button` atom had no
  matching variant. Statuses and actions drifted apart, and Tailwind v4 no longer gives buttons
  a pointer cursor, so several of them showed the arrow cursor. Lint did not catch any of this.

`adminpanel` solves the same problem with `class-variance-authority` and a `cn()` helper
(`clsx` + `tailwind-merge`), as shadcn/ui does
([adminpanel ADR 0014](https://github.com/DyingStar-game/adminpanel/blob/develop/docs/adr/0014-atomic-design-shadcn.md)).
The maintainer asked (2026-10-10) for the same tools here.

## Options considered

1. **Keep hand-written lookups**, add the missing variants. No dependency, but caller overrides
   stay broken and every atom keeps its own pattern.
2. **`cva` + `cn()`**, as adminpanel. Three small, widely used dependencies; variants are typed
   (`VariantProps`), and the last class wins on conflicts.
3. **shadcn/ui + Radix now.** Brings `cva` / `cn()` and accessible menus and dialogs, but changes
   the behaviour of the menu, the volume popover and the modal: worth its own decision.

## Decision

We take option 2.

- `src/renderer/lib/cn.ts` exports `cn(...inputs)` = `twMerge(clsx(inputs))`. Any class list
  that is not a single static string goes through `cn()`: no `[...].join(' ')`, no template
  strings in `className`.
- A component with visual variants declares them with `cva` (`variants`, `compoundVariants`,
  `defaultVariants`) and types its props with `VariantProps`. The caller's `className` is merged
  last: `cn(xxxVariants({ … }), className)`.
- **Buttons only through atoms.** Outside `components/atoms/`, `<button>` is forbidden
  (`react/forbid-elements` in `eslint.config.mjs`; test files may use one as slot content). The
  button atoms are:
  - `Button`: variants `primary`, `secondary`, `danger`, `success`, `ghost`, `outline` (framed),
    `link` (text action) and `bare` (no style, for clickable content laid out by the caller);
    sizes `chip`, `sm`, `md`, `icon`, `icon-sm`, `icon-xs` and `none`;
  - `TabButton`: one button of a segmented group (`tone` `accent` | `neutral`, `selected`);
  - `MenuItemButton`: an entry of a dropdown menu (`role="menuitem"`, `selected`);
  - `SidebarItemButton`: a sidebar navigation entry (`active`).

  A new kind of button extends one of them (a variant) before a new atom is added (ADR 0011).

- Statuses are not buttons: `Badge` is an icon and text with no frame, so it never reads as an
  action.
- Every enabled button gets a pointer cursor from a base rule in `main.css`.

## Consequences

- One place per look: changing a variant changes every button using it, and a caller's class
  (`hidden`, a colour) reliably overrides the atom's.
- New dependencies: `class-variance-authority` 0.7, `clsx` 2, `tailwind-merge` 3 (the versions
  adminpanel uses).
- Migrating to shadcn/ui later is mostly mechanical: its primitives use the same `cva` / `cn()`
  pattern. Adopting it, with Radix for the menu, the volume popover and the modal, is left to
  its own ADR.
