# 0036. Pause, resume and cancel the game download

- **Status:** Accepted
- **Date:** 2026-10-12
- **Deciders:** maintainer
- **Scope:** Game install and update (`main/services/download/`, `files:*` IPC, `stores/files`, the
  home action bar)
- **Builds on:** [ADR 0003](./0003-process-boundaries-ipc.md) (IPC),
  [ADR 0035](./0035-home-hero-and-action-bar.md) (home action bar)

## Context

The game archive is close to 1 GB (862 MB for Universe Testing on 2026-10-12) and is downloaded in
one go: `files:install` streams the ZIP into `<installPath>/__game_download.zip`, then wipes the
game folder, extracts and reads `version.json`. Nothing can stop it: closing the launcher loses
the whole download, and a player cannot give up an install started by mistake. The home page
drawn by the maintainer has a Pause button while downloading; the maintainer asked (2026-10-12)
for pause and cancel next to the download progress, and for a paused download to resume after
the launcher is restarted.

The testing archive's server (nginx) answers `Accept-Ranges: bytes`, `206 Partial Content` to a
`Range` request, and an `ETag`. The live server could not be checked (no live ZIP URL configured).

The old game folder is only removed once the archive is fully downloaded: stopping during the
download leaves the installed game intact; stopping during extraction would leave none.

## Options considered

1. **Cancel only.** Simple (abort the request, delete the partial file), but a long download
   interrupted by anything starts over.
2. **Pause / resume with HTTP ranges, and cancel.** The partial archive stays on disk with what
   identifies it; resuming asks for the missing bytes. Works across restarts. Falls back to a full
   download when the server ignores ranges or the archive changed.
3. **A download manager library.** More than this needs, one more dependency.

## Decision

We take option 2.

- **Main** (`download/`):
  - one download per environment at a time, tracked with an `AbortController`;
  - beside the partial archive, `__game_download.json` records the URL, `ETag` / `Last-Modified`
    and total size;
  - resuming sends `Range: bytes=<size>-` with `If-Range`; on `206` it appends, on `200` (archive
    changed, or no range support) it starts over, on `416` with the full size on disk it goes on
    to extraction;
  - **pause** aborts and keeps both files; **cancel** aborts (or, when paused, does nothing more)
    and deletes both; neither is possible once extraction has started (the game folder is being
    replaced): main ignores them then.
- **IPC** (`files:*`, ADR 0003): `files:install` resolves to an outcome,
  `{ status: 'installed', version, releaseDate } | { status: 'paused' } | { status: 'cancelled' }`,
  instead of only the version; new `files:pause-install` (env), `files:cancel-install` (env,
  installPath) and `files:pending-download` (env, installPath → `{ downloaded, total } | null`), used
  at startup and on environment switch to find a paused download. Payload types in
  `shared/types/install.ts`.
- **Store** (`stores/files`): a transient `paused` state per environment with the bytes on disk;
  `pause()`, `resume()` (the same `files:install` call) and `cancel()`. The install folder cannot be
  changed while a download is paused (its partial archive lives there).
- **Home action bar** (`lib/gameAction` gains `paused`):
  - while downloading: two icon buttons right of the progress, Pause and Cancel (tooltips); the
    main action stays "Installing…" / "Updating…", disabled;
  - paused: heading "Paused · 43 %", the bytes downloaded, the progress frozen; the main action
    becomes **Resume**, the Cancel icon stays;
  - while extracting: no Pause nor Cancel.
  - The same applies to an update: a paused update keeps the installed version, still out of
    date, so Play stays blocked until it is resumed (or cancelled, back to "Update required").

## Consequences

- An interrupted download (pause, launcher closed, crash) loses nothing: it resumes where it
  stopped, after a restart too.
- `files:install` changes shape: the files store and its callers are updated with it.
- Two files may stay in the install folder while a download is paused; cancel removes them.
- If the live server does not support ranges, resuming there downloads the whole archive again
  (same as today), without error.
- Tests: main's resume logic (`206` / `200` / `416`, changed `ETag`, abort) against a local HTTP
  server in Node tests; the store's pause / resume / cancel; the bar's buttons per state.
