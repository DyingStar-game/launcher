# 0035. Home page: the universe in full frame, one action bar at the bottom

- **Status:** Accepted
- **Date:** 2026-10-12
- **Deciders:** maintainer
- **Scope:** Renderer home page (`UniversePage`, `UniverseLayout`, `organisms/universe/`)
- **Builds on:** [ADR 0011](./0011-atomic-design.md), [ADR 0016](./0016-shadcn-radix-interactive-primitives.md),
  [ADR 0018](./0018-loading-states.md), [ADR 0034](./0034-two-header-rows.md)
- **Extends:** [ADR 0028](./0028-buttons-on-shadcn.md) (buttons 36 px high), with two sizes for the
  action bar only

## Context

The home page was a grid of three panels: Game (server status, players, Play, "View status"),
Game files (install folder, install / update / verify / clear cache, progress) and Social. The
main action was split between two panels: Install lived in Game files, Play in Game, and the
messages explaining why Play was disabled piled up above it. The install folder took a panel of
its own although it is set once. A launcher update showed as an alert over the panels.

The maintainer drew the new home page in Claude Design (2026-10-12, "Launcher Accueil"): the
universe over the full frame, the social column kept on the right, and a fixed bar at the bottom
with the game's state and one main action, in its states (not installed, downloading, update,
ready, launcher update).

## Options considered

1. **Keep the panels, restyle them.** Smallest change, keeps the split action.
2. **The drawn layout: hero, side column, action bar.** One place for the action and its reason;
   the files settings move behind a button.

## Decision

We take option 2.

- **Layout** (`templates/UniverseLayout`): `hero` (bottom-aligned over a neutral background until
  key art exists, with the round Dying Star emblem faded in light grey behind it as a placeholder
  (`KeyArtPlaceholder`, the emblem from the website's `logoSvg.tsx`): the universe's name, the line "Public test server · progress is not kept" under
  Universe Testing, the installed version), `side` (380 px column: the social preview, unchanged inside), an optional
  `banner` and the `actionBar`, fixed at the bottom.
- **One action, chosen by state** (`lib/gameAction`), most blocking first: environment
  unavailable, installing, install, update, game running, launching, server not online (offline,
  degraded, maintenance, unknown: as before, Play needs `online`), session being checked, sign in
  (Discord, in Play's place as before), play. The bar shows a heading and a detail line for each
  (the former "Play disabled" messages), and the progress while installing.
- **Update, then play.** The update button reads "Update / then play": once the update is done,
  the game starts when nothing else blocks it (signed in, server online). This is new: an update
  used to stop there.
- **Game files behind ⚙** (`GameFilesPopover`, Radix `Popover`): installed version and release,
  install folder, verify files, clear cache (its outcome as a `PanelMessage`, `success` variant
  added). It opens by itself while the game is not installed, and Install without a folder opens
  it with the field in error.
- **Download speed and time left**, measured in the files store from the progress events (no
  new IPC). Download size before installing, free disk space and pausing a download are not
  shown: main does not provide them.
- **Server status links to the status page** (replaces "View status").
- **What an update brings** (`ReleaseNotesCard`): the installed and new build ids, the first three
  lines of the game's latest changelog entry for the environment (a release in Universe, the
  unreleased notes in Universe Testing), and a link to that entry on the Changelog page.
- **Launcher update**: a strip above the action bar with its download page; the game stays
  playable. The header is not changed.
- **Button sizes, specific to the action bar**: its main action is a call to action, larger than
  the app's buttons, as drawn: 64 px high and 280 px wide (`Button size="cta"`, shadcn `xl`, with
  an accent ring when primary), and the ⚙ button beside it 56 px (`size="icon-cta"`). These two
  sizes are for the action bar only; every other button stays 36 px (ADR 0028).

## Consequences

- `GamePanel`, `FilesPanel` and `UpdateAlert` are removed, with their translations.
- Every state is tested on `GameActionBar`; its fit in the 1024 px minimum window, the files panel
  placement, the layout and the three-line notes are measured in Chromium (ADR 0033).
- Open: key art per universe, a line under Universe's name (none given yet), the download
  size and free space (would need IPC), pausing a download (proposed in [ADR 0036](./0036-pause-resume-cancel-download.md)).
