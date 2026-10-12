# 0037. Home page: key art slideshow, and Pause in the main action

- **Status:** Accepted
- **Date:** 2026-10-12
- **Deciders:** maintainer
- **Scope:** Renderer home page (`UniverseLayout`, `UniversePage`, `GameActionBar`)
- **Supersedes:** in [ADR 0035](./0035-home-hero-and-action-bar.md), the neutral background and its
  emblem placeholder; in [ADR 0036](./0036-pause-resume-cancel-download.md), the buttons of the
  action bar while downloading

## Context

[ADR 0035](./0035-home-hero-and-action-bar.md) left the home page's hero on a neutral background,
with the faded Dying Star emblem standing in for key art. The maintainer provided the first key art
(2026-10-12), for both universes, and wants several images to loop with a fade.

[ADR 0036](./0036-pause-resume-cancel-download.md) put Pause and Cancel as icon buttons beside the
progress, with the main action greyed out ("Installing…") while downloading and "Resume" once
paused. Seen in place, Pause as a small icon next to a large greyed button read poorly; the
maintainer chose (2026-10-12) to put Pause in the main action, as the original drawing did.

## Decision

- **Key art**: the hero's frame is filled by `KeyArtSlideshow` (the `backdrop` slot of
  `UniverseLayout`), the same images for both universes, listed in `lib/keyArt.ts` (`KEY_ART`). Each
  image covers the whole frame without being stretched (`object-cover`); with several, they fade
  into one another in a loop (8 s each, a 1.5 s fade; no fade when the system asks for reduced
  motion). A light dark gradient over them, from the bottom and the left, and a text shadow under
  the universe's name keep the text readable while the image stays visible. Images are WebP in `assets/key-art/` (the first one: 3440 × 1440,
  230 KB, from a 5.7 MB PNG).
- **Pause in the main action**: while downloading, the main action is **Pause**; once paused, it is
  **Resume** (as in ADR 0036). The only icon button is **Cancel**, at the end of the detail line, right above the end of the
  progress, while
  downloading or paused, in the destructive look (`Button variant="danger"`: what was downloaded is
  lost). Pause and Cancel show a spinner from the click until main has stopped the download
  (ADR 0018); main sends download progress at most every 100 ms, so the renderer is not flooded
  with one event per received chunk. Once extraction starts, the main action is "Installing…" / "Updating…",
  disabled, with no Cancel (as in ADR 0036).

## Consequences

- The emblem placeholder (`KeyArtPlaceholder`, `DyingStarEmblem`) is removed.
- Adding an image is adding a file to `assets/key-art/` and to `KEY_ART`; per-universe images
  would make `KEY_ART` a record keyed by environment.
- The main action is never greyed out while the download can still be stopped.
