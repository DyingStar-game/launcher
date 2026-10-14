# 0040. Changelog page: entries by type and area (`global.json` version 2)

- **Status:** Accepted
- **Date:** 2026-10-14
- **Deciders:** maintainer
- **Scope:** Changelog page (`main/services/changelog.ts`, `changelog:fetch` IPC,
  `shared/schemas/changelog.ts`, `lib/changelogEntries`, `stores/changelog`,
  `organisms/changelog/ChangelogContent`)
- **Builds on:** [ADR 0003](./0003-process-boundaries-ipc.md) (IPC),
  [ADR 0027](./0027-shadcn-first-badge.md) (Badge), ADR 0001 of
  [DyingStar-game/changelog](https://github.com/DyingStar-game/changelog/blob/main/docs/adr/0001-changelog-format.md)
  (changelog format)

## Context

The changelog repository moves to `global.json` schema version 2 (its ADR 0001): each entry is
`{type, area, text}` instead of a string — a Keep a Changelog type (`added`, `fixed`…) and an area
of the component (`vehicles`, `download`…), both `null` for entries written before; `types` gives
the types' order and EN / FR labels, each component its `areas` labels; a release carries
`yanked` and a compare `url`; the unreleased entries move under `unreleased.entries`. The
launcher read version 1 without checking it: version 2 breaks the page.

## Options considered

1. **Read both versions.** Nothing to coordinate, but two code paths for a format the changelog
   repository publishes once, at a known date.
2. **Read version 2 only, checked in main.** The launcher and the changelog repository are
   released together; a JSON that does not match is "unavailable", never a broken page.

## Decision

We take option 2.

- **Main** checks the JSON against `globalChangelogSchema` (Zod, `shared/schemas/changelog.ts`,
  the shared types are inferred from it); a mismatch is logged and `changelog:fetch` returns
  null: the page says the changelog is unavailable.
- **`resolveChangelogGroups`** (`lib/changelogEntries`) gives the entries of a version grouped by
  type, in the JSON's `types` order, the entries without a type last; each area as its label in
  the reader's language (its key when the label is missing). English entries when there are none
  in the reader's language, as before.
- **The page** shows a `SectionLabel` heading (`h2`) per type — "Other changes" for the entries
  without a type, no heading at all when a version only has those — then the entries, each
  starting with its area in bold (a space before the colon in French). A withdrawn version shows
  a `destructive` Badge next to its date.
- The unreleased fingerprint (unread badges) is computed on `unreleased.entries`.
- The version's compare `url` is not shown: links leaving the launcher are another decision.

## Consequences

- The launcher must ship with the changelog repository's switch to version 2: from then on an
  older launcher cannot read the changelog (its page breaks), and this one cannot read version 1
  (unavailable).
- Every unreleased section's fingerprint changes once: players see their unread badges once.
- A new type or area needs no launcher change: labels come with the JSON.
