# 0028. Buttons on shadcn's Button, 36 px high

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** maintainer
- **Scope:** Renderer buttons
- **Supersedes:** the button looks of [ADR 0015](./0015-component-variants-cva-cn.md) and the
  36 px rule of CLAUDE.md ("text and icon buttons are 36px high (`h-9`)")
- **Builds on:** [ADR 0027](./0027-shadcn-first-badge.md) (take from shadcn/ui what it provides)

## Context

Our `Button` atom drew its own variants at 36 px, while shadcn's `Input` (now used by every
field, ADR 0027) is 32 px: a field and its button did not line up. The maintainer (2026-10-10)
asked why our buttons are not 32 px, and to try them on shadcn's base. Tried on 2026-10-10, 32 px
buttons looked wrong to him: the height stays 36 px, on shadcn's base.

shadcn's Button (radix-nova, shadcn 4.21.4): variants `default`, `outline`, `secondary`, `ghost`,
`destructive`, `link`; sizes `default` (32 px), `xs` (24), `sm` (28), `lg` (36), `icon` (32),
`icon-xs`, `icon-sm`, `icon-lg`.

## Decision

- `components/ui/button.tsx` is shadcn's Button (radius caps in `rem`, ADR 0026).
- The `Button` atom keeps what shadcn does not have — UI sounds and the `loading` spinner — and
  draws each launcher variant with a shadcn one: `primary` → `default`, `secondary`, `outline`,
  `ghost`, `danger` → `destructive`, `success` → `success` (a variant added to shadcn's Button,
  the green twin of `destructive`, asked by the maintainer on 2026-10-10), `outline-danger` → `outline`,
  `link` / `name` → `link`, `subtle` → `ghost`; `bare` stays unstyled. Sizes: `md` / `sm` →
  `lg` (36 px), `icon` → `icon-lg` (36 px), `chip` → `xs`, `icon-sm` / `icon-xs` → the same;
  `none` adds no height nor padding (inline text).
- Text and icon buttons stay **36 px** high, `TabButton` too.

## Consequences

- One look, shadcn's, at the launcher's height; fields (shadcn's `Input`, 32 px) stay lower than
  the buttons next to them.
- Visible changes: the window close button no longer turns red on hover; a pressed button moves
  down by one pixel (shadcn's `active:translate-y-px`); the alert's close button is a ghost button
  in the alert's colour.
- The launcher variant names remain an adapter; callers can move to shadcn's names later.
