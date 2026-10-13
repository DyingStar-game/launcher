# 0026. No pixel values in Tailwind classes

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** maintainer
- **Scope:** Renderer styles
- **Builds on:** [ADR 0015](./0015-component-variants-cva-cn.md) (classes through `cn()` and
  `cva`), [ADR 0017](./0017-classname-layout-only.md) (layout-only `className`)

## Context

The renderer's classes held 38 arbitrary pixel values (2026-10-10): text sizes (`text-[10px]`,
`text-[11px]`), breakpoints (`min-[1400px]:`, `min-[800px]:`), a few sizes and offsets, shadows
and `calc()`s. They bypass Tailwind's scale, so the same size is written several ways, and one of
them caused a visible defect: `text-[11px]` has no line height of its own, so a line was 16.5 px
high and everything below it sat on half pixels — the pending count pill looked off-centre in one
place and not in another.

The maintainer (2026-10-10) does not want sizes in `px` in Tailwind classes.

## Decision

- **No `px` inside a Tailwind arbitrary value or variant** (`-[…px…]`, `[…px…]:`) in the
  renderer, `components/ui/` included. Use the scale, or a theme token in `assets/main.css`
  (`@theme`), in `rem`:
  - spacing and sizes: Tailwind v4's spacing scale, which takes any multiple of 0.25
    (`size-4.5` = 18 px, `p-0.75` = 3 px, `min-w-24` = 96 px); inside a `calc()`, `var(--spacing)`;
  - text: the scale, plus one launcher step, **`text-2xs`** = 0.625rem (10 px) with a 1rem line
    height. What was 11 px becomes `text-xs` (12 px);
  - breakpoints: named in the theme, **`nav-full`** = 87.5rem (the whole navbar, burger menu
    below) and **`nav-env`** = 50rem (environment switch in the navbar, in the menu below);
  - radius, rings, shadows: the scale (`rounded-xs`, `ring-3`) or a `--shadow-ds-*` token.
- CSS files may use `px` where CSS needs it (borders, fonts, scrollbars); the rule is about
  classes.
- **Lint-enforced**: the `launcher/no-px-classes` rule (in `eslint.config.mjs`) reports any string
  in `src/renderer` holding a bracketed value with `px`.

## Consequences

- One scale for sizes; a new size goes through the theme, where it is named once.
- Labels that were 10 px keep their size (`text-2xs`); texts that were 11 px grow to 12 px.
- shadcn code added later is converted when it is copied in (ADR 0016's procedure), the lint
  rule says where.
