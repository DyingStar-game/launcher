# 0042. Changelog page: dev releases folded under their version

- **Status:** Accepted
- **Date:** 2026-10-14
- **Deciders:** maintainer
- **Scope:** Changelog page (`shared/schemas/changelog.ts`, `lib/changelogEntries`,
  `stores/changelog`, `organisms/changelog/ChangelogSidebar`, `ChangelogContent`,
  `ui/collapsible`)
- **Builds on:** [ADR 0040](./0040-changelog-types-and-areas.md) (entries by type and area),
  [ADR 0016](./0016-shadcn-radix-interactive-primitives.md) (shadcn primitives), ADR 0003 of
  [DyingStar-game/changelog](https://github.com/DyingStar-game/changelog/blob/main/docs/adr/0003-dev-releases.md)
  (dev releases)

## Context

The game and Horizon are built for Universe Testing several times a week. Until now nothing cut
their changelog: Universe Testing showed one "New features" section that had grown to about 450
entries. The changelog repository now cuts a **dev release** at each testing build
(`0.1.0-dev.202610141530`, `"dev": true` in `global.v2.json`) and keeps them when the stable
version (`0.1.0`) is cut, whose own section may then be nearly empty. There will be dozens of dev
releases per stable version: listed flat, they would bury the stable ones.

## Options considered

1. **List every release flat.** Nothing to build, but dozens of build entries in Universe and a
   near-empty `0.1.0`.
2. **Fold the dev releases under the version they lead to.** One line per version; the builds one
   click away; a stable version shows everything that went into it.

## Decision

We take option 2.

- **Schema:** a release has an optional `dev` (absent from a JSON written before it: `false`).
  A dev release leads to the version without its pre-release part (`0.1.0-dev.…` → `0.1.0`).
- **Universe Testing:** the "New features" section (unreleased, the next build), then the dev
  releases of each version, newest version and newest build first. Stable releases are still
  not listed there.
- **Universe:** the stable releases as before, each followed by its dev releases. Dev releases of
  a version not released yet are not listed. A stable release with dev releases is listed even
  without entries of its own; its page shows its entries and those of its dev releases, grouped
  by type (ADR 0040), and says how many builds it includes.
- **Sidebar:** the dev releases of a version sit in a shadcn `Collapsible` (`ui/collapsible`,
  ADR 0016) under a trigger: "v0.1.0 · in progress" (or "v0.1.0" once released) on Universe
  Testing, "N development builds" under the release on Universe. A group is open when it holds
  the selected version, and on Universe Testing for the newest version. The trigger shows how
  many of its builds are unread (`PendingCount`).
- **A dev release** is named by its build time, read from its version (UTC) and shown in the
  reader's locale ("Build 14/10/2026 17:30"); its page shows the version under the title.
- **Unread:** on Universe Testing a dev release is a build the tester received: unread until
  opened. On Universe it is a detail of its release: never unread, not counted.

## Consequences

- Universe Testing keeps a short list: one entry per testing build since the last stable version,
  folded, instead of one growing section.
- The first launch after the catch-up of the changelog repository shows every weekly dev release
  as unread on Universe Testing, once.
- The installed build's `version.json` names its dev release (`devRelease`): pointing the player
  to its section is left for later.
