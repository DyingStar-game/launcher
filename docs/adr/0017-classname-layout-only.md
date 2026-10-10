# 0017. `className` on components is for layout only; looks are variants

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** maintainer
- **Scope:** Renderer
- **Supersedes:** in [ADR 0015](./0015-component-variants-cva-cn.md), "a caller's class (`hidden`, a
  colour) reliably overrides the atom's" — a caller no longer overrides a colour

## Context

[ADR 0015](./0015-component-variants-cva-cn.md) merges the caller's `className` last with
`cn()`, so a caller can override anything an atom sets. In practice callers used it to restyle
atoms: the donate button was made round (`rounded-full`), the window close button red on hover,
an organisation name bold and underlined, the update alert's close button coloured per alert,
and the shadcn menu, popover, dialog and tabs re-skinned at each call site. The same atom then
looked different from one place to the next, and its variants no longer told the whole story.
The maintainer asked (2026-10-10) that `className` only places a component, never changes its
look.

## Decision

- On every component of the atomic levels (`ui/`, atoms, molecules, organisms, templates), the
  `className` a caller passes is for **layout only**:
  - margin and padding (`m*-`, `p*-`, `space-*`), size (`w-`, `h-`, `min-*`, `max-*`, `size-`);
  - display and visibility, including responsive ones (`hidden`, `min-[1400px]:inline-flex`,
    `contents`);
  - placement in a flex or grid parent and the component's own layout (`flex-*`, `grow`,
    `shrink`, `basis-`, `self-`, `justify-`, `items-`, `gap-`, `order-`, `col-`, `row-`);
  - positioning (`relative`, `absolute`, `inset-`, `top-`…, `z-`), overflow and text alignment
    or truncation (`overflow-`, `truncate`, `text-left`…).
- **Looks are variants.** Colours, backgrounds, borders, radius, rings, shadows, typography
  (size, weight, case, tracking, leading, decoration), opacity, cursor and state styles
  (`hover:`, `focus:`, `active:`, `aria-*:`, `data-*:`…) are declared in the component, as a
  `cva` variant when they differ between uses. A new look is a new variant, not a class at the
  call site.
- **shadcn components** in `components/ui/` carry the launcher look themselves (owned code,
  [ADR 0016](./0016-shadcn-radix-interactive-primitives.md)); callers pass layout only.
- **Enforced by lint**: `no-restricted-syntax` rejects visual classes in the `className` of any
  capitalised JSX element in `src/renderer` (string literals, template literals and `cn()`
  arguments). Plain DOM elements (`<div>`, `<span>`…) keep free classes: they are where a
  component builds its own look.

## Consequences

- An atom looks the same everywhere; reading its variants is enough to know every look it has.
- Some variants are added for looks that callers used to set: `Button` `outline-danger` (window
  close), `name` (organisation name link) and `subtle` (close button taking the colour of its
  container); `link` is the small text action.
- The lint rule works on class names, not on intent: a layout class it does not know can be
  added to its allow list in `eslint.config.mjs`.
