# 0047. Disk full during an install: checked before writing, said plainly

- **Status:** Accepted
- **Date:** 2026-10-21
- **Deciders:** maintainer
- **Scope:** Game install (`main/services/download/`, `files:install`, `stores/files`,
  `GameActionBar`)
- **Builds on:** [ADR 0036](./0036-pause-resume-cancel-download.md) (pause, resume),
  [ADR 0038](./0038-keep-player-files-on-update.md) (files removed before extraction),
  [ADR 0039](./0039-slow-download-reconnect-and-game-version-refresh.md) (download failures)

## Context

A player whose disk was full saw "Download interrupted: progress is kept", like a dropped
connection, and Resume failed again. Writing the archive fails with `ENOSPC`; the error crosses
IPC as a message only, and the renderer shows any failure with a download on disk as interrupted.
Worse, when the disk fills up during extraction, the previous game's files are already removed
(ADR 0038) and the archive was deleted with the failure: the player had no game and a whole
download to start again.

## Options considered

1. **Recognise `ENOSPC` in the error message** in the renderer. Small, but the space is only seen
   missing once the disk is full, and the extraction case still loses the archive.
2. **Check the free space before writing, and report a lack of space as an outcome** with the
   sizes, the archive kept so that Resume only does what is left.

## Decision

We take option 2.

- **Free space** is read with `fs.statfs` on the install folder (`freeBytes`).
- **Before downloading**, once the archive's size is known: the part still to download must fit.
- **Before extracting**: the archive's uncompressed size, less the size of the previous game's
  files that the install removes, must fit. The check comes before anything is removed: the
  installed game stays playable.
- **`ENOSPC`** while writing the archive or extracting it is the same lack of space.
- **Outcome:** `files:install` resolves to `{ status: 'diskFull', needed, available }` (bytes)
  instead of throwing. The archive stays on disk, extraction included: once space is freed,
  Resume downloads what is missing or goes straight to extraction.
- **The player** sees the download paused (Resume) and an error toast with both sizes: "Not
  enough disk space: 1.2 GB needed, 300 MB free on this disk. Free some space or choose another
  folder, then resume."

## Consequences

- A full disk is said as such, with what to free, before the game is touched when it can be.
- The check is an estimate (other programs write meanwhile, the file system's overhead): `ENOSPC`
  remains caught.
- A disk filled during extraction leaves a partly extracted game until Resume: its file list
  (ADR 0038) already holds both sets, so Resume removes them before extracting again.
