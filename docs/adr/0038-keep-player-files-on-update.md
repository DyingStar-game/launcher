# 0038. Keep the player's files in the game folder on update

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** maintainer
- **Scope:** Game install and update (`main/services/download/`)
- **Builds on:** [ADR 0036](./0036-pause-resume-cancel-download.md) (download, then extraction)

## Context

Installing or updating the game removes the whole game folder (`<installPath>/<GAME_INSTALL_SUBDIR>`)
before extracting the new archive into it (`install.ts`). The game writes into that folder too:
the maintainer reported (2026-10-13) that an update through the launcher loses the screenshots and
videos. Which folders the game writes, and under which names, is not known to the launcher and
may change from one build to the next (a recording was also found in
`Documents/DyingStar/records/`, outside the install folder).

Removing the old files is still needed: a file dropped from the archive must not stay behind
(an old library, an old `.pck` next to a renamed one).

## Options considered

1. **Remove only the files the launcher installed.** The launcher records the archive's file
   list after extracting it; an update removes those files (and the folders left empty), then
   extracts. Whatever the game or the player created stays, without knowing its name.
2. **Keep a list of named folders** (`screenshots/`, `videos/`…): moved aside before the folder
   is removed, moved back after. Needs the exact names and a launcher change each time the game
   adds a folder.
3. **Have the game write outside its install folder** (Godot's `user://`, Documents). The right
   place for player data, but it is the game team's change and does not protect what is already
   there.

## Decision

We take option 1.

- After a successful extraction, main records the archive's file list (paths relative to the game
  folder, from the ZIP entries) in the launcher's data folder (`app.getPath('userData')`, like the
  stored tokens), not in the install path, which is the player's: `game-files.json` holds one list
  per game folder, keyed by its absolute path
  (`{ "<installPath>/<GAME_INSTALL_SUBDIR>": ["version.json", …] }`).
- On install or update, instead of removing the game folder, main:
  1. reads the list; before extracting, rewrites it as the union of the old list and the new
     archive's entries, so an extraction that fails midway leaves nothing untracked;
  2. removes each listed file still on disk, skipping any path that would resolve outside the
     game folder, then the listed folders left empty, deepest first;
  3. extracts the archive (overwriting), then writes the new archive's list alone.
- No list (a game installed before this change, found with Detect installation, moved by hand,
  or the launcher's data cleared): nothing is removed, the archive is extracted over the folder. Files dropped from the archive since that
  install stay (see Consequences); the list written after it makes the next updates clean.
- A file that is both in the archive and changed by the player (`client.ini`, which the player
  may edit) is replaced by the archive's copy, as today: the maintainer chose (2026-10-13) to keep
  the archive's `client.ini`.

## Consequences

- Screenshots, videos and anything else the game or the player creates in the game folder
  survive updates, whatever their names.
- From the second update on, no obsolete game file stays: every file of the previous archive is
  listed, so one missing from the new archive is removed with the others.
- The first update after this change has no list: files the new archive no longer ships stay in
  the game folder, untracked, until the player removes them or reinstalls in an empty folder. A
  Godot export keeps the same file names from one build to the next (executable, `.pck`,
  libraries), so this should be rare.
- The install path holds only the game and, while a download is paused, its partial archive
  (ADR 0036). The list follows the game folder's path: moving the folder by hand, or clearing the
  launcher's data, loses it, and the next update removes nothing.
- Removing files one by one is slower than removing the folder, negligible beside the download
  and extraction.
- Tests: Node tests on temporary folders (the launcher's data folder mocked): player files kept, listed files and emptied folders
  removed, paths outside the game folder ignored, no list → nothing removed, union written before
  extraction.
