# 0032. The look lives on the components: no classes of our own in CSS files

- **Status:** Accepted
- **Date:** 2026-10-11
- **Deciders:** maintainer
- **Scope:** Renderer styles
- **Builds on:** [ADR 0011](./0011-atomic-design.md) (atomic design),
  [ADR 0015](./0015-component-variants-cva-cn.md) (variants with `cva`),
  [ADR 0017](./0017-classname-layout-only.md) (layout-only `className`)

## Context

`assets/main.css` held 30 class selectors of our own (2026-10-11): `ds-panel`, `ds-panel-bar`,
`ds-panel-padded(-sm)`, `ds-card`, `ds-modal`, `ds-section-label`, `ds-sidebar`, `ds-page`, the
lore article (`lore-markdown` and its elements), the changelog list (`changelog-list*`) and
TipTap's placeholder. They date from before the atomic design: a shared look was a CSS class, so
reading a component did not tell how it looked, the classes escaped the lint rules
(`ds-section-label` was 11 px against ADR 0026), and `ds-modal` was no longer used.

The maintainer (2026-10-11): every style goes on the components, in Tailwind; CSS and components
are not mixed.

## Decision

- **A shared look is a component**, styled with Tailwind classes and `cva`:
  - `atoms/Panel`: `variant="panel"` (page panel: scrolls inside, accent border on hover) or
    `"card"` (figure, inline form); `asChild` draws it on a `<form>`; its padding is layout,
    passed in `className` (`p-7`, `p-6`);
  - `atoms/SectionLabel`: the small uppercase label (`as="h2" | "h3" | "p"`), now `text-xs`;
  - `atoms/PageSidebar`: the navigation column of the social, lore and changelog pages;
  - a look used once stays in its component: the navbar's surface, the page shell of the three
    templates.
- **Generated HTML is styled through its renderer**: markdown through `react-markdown`'s
  `components` (`molecules/MarkdownArticle` for the lore, `ChangelogEntryItem` for the changelog),
  TipTap through arbitrary variants on the editable element
  (`[&_p.is-editor-empty:first-child]:before:…`). No `@tailwindcss/typography`.
- **The CSS files only hold Tailwind's configuration and what no component carries**:
  - `@theme` (the tokens that make the utilities) and shadcn's `@custom-variant`s;
  - `@font-face`;
  - `@layer base`: `html`, `body`, `#root`, the pointer cursor on buttons, the scrollbars of every
    scrolling element;
  - `@utility` for a property Tailwind has no utility for: `app-drag` / `app-no-drag`
    (`-webkit-app-region`), used like any utility.
- **Enforced by a test**: `assets/styles.test.ts` fails on any class selector in
  `src/renderer/assets/*.css` outside an at-rule (ESLint does not read CSS without another
  dependency).

## Consequences

- A component's file shows its whole look; the lint rules (no px, theme utilities, `size-*`,
  layout-only `className`) apply to every style.
- The lore and changelog keep their look, rewritten in classes (rem instead of px).
- Section labels grow from 11 to 12 px, as ADR 0026 did for the other 11 px texts.
