# 0031. Styling and code conventions, lint-enforced

- **Status:** Accepted
- **Date:** 2026-10-11
- **Deciders:** maintainer
- **Scope:** `src/` (renderer styles and components; file names everywhere)
- **Builds on:** [ADR 0011](./0011-atomic-design.md) (atomic design),
  [ADR 0015](./0015-component-variants-cva-cn.md) (classes through `cn()`, variants with `cva`),
  [ADR 0026](./0026-no-px-in-tailwind-classes.md) (no px, theme tokens)

## Context

A review of the renderer (2026-10-11) found the same things written several ways, each one a
small source of drift rather than a design choice:

- theme tokens read as arbitrary values (`text-[var(--color-ds-muted)]`, about 125 times, then
  `text-(--color-ds-accent)`), although `@theme` already generates `text-ds-muted`;
- square elements sized with `w-8 h-8` in 14 files, next to `size-8` elsewhere;
- props typed as a local `Props` (47 components), inline (19), or named (3); and variants
  restated by hand next to their `cva` (`Avatar`'s `size?: 'sm' | 'lg'`), so they could drift;
- file names in three cases, following an unwritten rule.

The maintainer (2026-10-11) settled each one. They are conventions, not architecture: one ADR
records them, and lint applies them.

## Decision

| Convention                                                                                                                                                                                                                                                                                              | Enforced by                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| A theme token goes through its utility (`text-ds-muted`, `bg-ds-accent/15`, `shadow-ds-modal`), never `-[var(--color-…)]` nor `-(--color-…)`; same for `shadow`, `radius`, `text`, `font`, `spacing`. Variables outside the theme (`--radix-*`) and expressions (`calc()`, `color-mix()`) stay allowed. | `launcher/no-theme-var-classes`                         |
| An equal width and height is one `size-*` class (`size-8`, `size-full`, `md:size-4`), never `w-8 h-8` in the same class string.                                                                                                                                                                         | `launcher/prefer-size`                                  |
| A component's props are a named `<Component>Props` type, exported with an exported component, local otherwise; never `Props`, never inline.                                                                                                                                                             | `no-restricted-syntax` (`.tsx` outside `ui/` and tests) |
| Variant props come from the `cva` (`VariantProps<typeof avatarVariants>`), defaults in `defaultVariants`; a union restating another component's prop is derived from it (`NonNullable<AvatarProps['shape']>`).                                                                                          | Review                                                  |
| File names: kebab-case in `components/ui/` (as the shadcn CLI writes them), PascalCase for another `.tsx` (its component; `main.tsx` aside), camelCase for a `.ts`; a test takes its subject's name (`useDelayedFlag.test.tsx`).                                                                        | `launcher/filename-case`                                |

The rules live in `eslint.config.mjs` and report this ADR's number.

## Consequences

- One way to write each thing; the post-edit hook reports a deviation as it is written.
- No file was renamed; the existing code was converted when the rules were added.
- shadcn code copied in later is converted the same way, the lint rules say where.
