# 0027. Take from shadcn/ui what it provides: the Badge

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** maintainer
- **Scope:** Renderer components
- **Extends:** [ADR 0016](./0016-shadcn-radix-interactive-primitives.md), which took only
  interactive primitives from shadcn/ui; **supersedes** the `Badge` atom (ADR 0011's
  "reuse or extend")

## Context

The launcher had its own `atoms/Badge` (frameless uppercase statuses with hand-drawn icons), and a
`count` variant was added to it for the pending requests pill (ADR 0023). The pill sat off-centre
in some places (a half-pixel layout, fixed by ADR 0026), which led the maintainer (2026-10-10) to
ask why the launcher re-creates a badge when shadcn/ui has one, as the adminpanel uses: "no need
to re-create what already exists".

## Decision

- A component shadcn/ui provides is **taken from it** (`components/ui/`, added as in ADR 0016,
  then owned), not written again — interactive or not. Today: `Badge`.
- `components/ui/badge.tsx` is shadcn's Badge (radix-nova, shadcn 4.21.4), with `cn` from
  `@lib/cn` and `ring-3` for `ring-[3px]` (ADR 0026); its colours come from the shadcn variables
  already mapped onto the launcher tokens.
- **One style**: shadcn's variants as they are, no launcher variant (the maintainer, 2026-10-10).
- Uses: the pending count is the `default` variant (`PendingCount`); read-only states (member,
  friend, application or request sent, closed, you) go through `StatusBadge`, the Badge with a
  `lucide-react` icon — `default` for a positive state, `secondary` otherwise.
- `atoms/Badge` goes away.

## Consequences

- Same Badge as the adminpanel; one fewer home-made component.
- Statuses change look: small rounded pills instead of frameless uppercase text.
- Before writing a component, check shadcn/ui's catalogue first.
