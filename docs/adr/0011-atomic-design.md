# 0011. Renderer components: atomic design

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** maintainer
- **Scope:** Renderer

## Context

Renderer components were grouped by feature and kind (`components/layout`, `panel`,
`ui/{primitives,feedback,social,lore,changelog,overlays,sound}`) with views in `views/`. Nothing
said which component may depend on which, and the same building blocks were rewritten in
several places (modal frame, pill badges, small action buttons, avatar initials). The
maintainer asked (2026-10-10) to follow the atomic design of
[`adminpanel`'s ADR 0014](https://github.com/DyingStar-game/adminpanel/blob/develop/docs/adr/0014-atomic-design-shadcn.md),
for the whole renderer, **without shadcn/ui for now**, and with component tests as a rule
**for new and modified components**.

## Decision

### Levels

```
src/renderer/components/
├── atoms/       # Button, ChipButton, Badge, Avatar, SidebarItemButton, icons/…
├── molecules/   # InputField, Modal, PageHeader, PlayerIdentity, FriendRow, OrgaRow, UpdateAlert…
├── organisms/   # by feature: layout/, universe/, social/, lore/, changelog/
└── templates/   # AppLayout, SidebarPageLayout, UniverseLayout (layout only, slots)
src/renderer/pages/   # UniversePage, SocialPage, LorePage, ChangelogPage (templates + data)
```

`App.tsx` picks the page from the navigation store and renders it in `AppLayout`, with the
navbar and the sheets (ADR 0009, 0010) as slots.

### Rules

- A level imports only from **lower** levels: atoms → molecules → organisms → templates →
  pages. Never upwards; organisms of one feature do not reach into another feature's folder.
- **Atoms and molecules are pure**: props in, events out; no store (`@stores/*`), no
  `window.api`. The UI sound hook (`@hooks/useUiSound`) is allowed: it plays feedback, it
  loads no data.
- **Templates are layout only**: slots and structure, no store, no `window.api`.
- Organisms may use stores; pages wire templates and organisms to data.
- Before creating a component, reuse or extend one (a `variant` prop) — no near-duplicates.
- Constants and helpers shared by components live in `lib/`, not in component files (fast
  refresh requires component files to export components only).
- Enforced by lint: `no-restricted-imports` / `no-restricted-properties` per level in
  `eslint.config.mjs`.

### Tests

- Testing Library + jsdom, run by Vitest as a second project (`dom`: `*.test.tsx`; logic
  stays in the `node` project: `*.test.ts`). `src/renderer/test/setup.ts` loads English UI
  strings, silences UI sounds and replaces `window.api` with auto-mocks reset after each test;
  `src/renderer/test/seedSocial.ts` seeds the social store.
- **Every new or modified component gets a test next to it** (`Component.test.tsx`). Existing
  untouched components are covered when they next change.

### Not adopted from adminpanel

- **shadcn/ui** (Radix primitives): the launcher keeps its own visual identity (`ds-*` classes)
  and primitives as atoms. Revisit in its own ADR, e.g. for accessible dialogs and menus.
- `eslint-plugin-boundaries`: `no-restricted-imports` per folder is enough at this size.

## Consequences

- Files moved: imports change across the renderer; `@views` becomes `@pages`.
- Store-bound behaviour leaves the rows: rows take `onOpen` / action slots, organisms and pages
  pass them.
- The first component tests come with this change (social atoms and molecules, the social
  action organisms, the player search).
