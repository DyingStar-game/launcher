# 0039. Reconnect a slow download, refresh the game version while the launcher runs

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** maintainer
- **Scope:** Game download (`main/services/download/zipFetch.ts`), version check
  (`main/services/version.ts`, `version:*` IPC, `stores/version`, the home action bar)
- **Builds on:** [ADR 0003](./0003-process-boundaries-ipc.md) (IPC),
  [ADR 0036](./0036-pause-resume-cancel-download.md) (resume with HTTP ranges)

## Context

Two reports after the 1.0.0 release and the game update of 2026-10-13, both fixed by restarting
the launcher:

1. **Slow download (Linux players).** An update crawled at about 67 KB/s (11.5 MB of 837 MB,
   "~209 min"). The archive comes from one nginx server (no CDN), IPv4 only, with ranges and an
   `ETag`. The launcher's download code, run alone on 2026-10-13, reads it at about 84 MB/s: the
   code does not slow it down. What a restart changes is the **TCP connection**: a new one
   replaces a connection that stays slow (opened while every player downloads the new version
   from the same server, losses, a congested route). Pausing then resuming does the same. Nothing
   in the launcher notices a connection that slows down or stalls: the only limit is the
   10-minute request timeout.
2. **Update not offered.** The latest game version (`/version` of each environment) is only read
   at startup and after an install. The server status is polled (every
   `VITE_SERVER_STATUS_POLL_MINUTES`, 5 by default), so players saw the maintenance, but not the
   new version that came with it: the launcher still offered Play on the old client.

## Options considered

### Slow download

1. **Leave it to the player** (pause / resume). Nothing to build; nobody knows it helps.
2. **Reconnect when the connection is too slow or stalls**, resuming with a range (ADR 0036),
   transparently. Covers what a restart fixes; must not keep reconnecting a player whose line is
   simply slow.
3. **Several connections in parallel** (ranges split across sockets). Faster on a congested
   server, but more load on that server when everyone downloads, and much more code.

### Game version

1. **Re-run the whole `version:check`** with the status poll. It also asks GitHub (launcher
   release), limited to 60 requests an hour per IP without a token; a refused request would hide
   the launcher update notice.
2. **A game-only check** (`version:check-game`), run with each status poll.

## Decision

**Slow download: option 2.** In `zipFetch`, while the archive is received:

- every 5 s, main looks at the bytes received over the last 30 s of the current connection;
- **stalled** (nothing received in 30 s) or **slow** (under 1 MB/s,
  `VITE_DOWNLOAD_SLOW_BYTES_PER_SECOND`) → the connection is closed and the download resumes
  where it is, with `Range` / `If-Range` (ADR 0036). The progress goes on without a visible step;
- a reconnection for slowness that does not at least double the speed over its first 30 s means
  the line is the limit: no more reconnecting for slowness during this download (a stall still
  reconnects);
- a connection **dropped or reset** mid-way, or **refused / unanswered** when opening it, is
  replaced the same way (maintainer, 2026-10-13: a player saw the download "pause by itself",
  which was an interrupted download shown as paused); a new connection after one that received
  nothing waits 2 s times the connections in a row that received nothing;
- after 5 connections in a row without receiving anything, the download fails: kept on disk,
  shown as paused, **and a toast tells it was interrupted** (`toast.error`, "Download interrupted:
  the progress made is kept."; "The installation failed." when nothing could be kept). Before,
  nothing was said: the player only saw a pause they had not asked for. `install()`, `update()`
  and `resume()` of the files store resolve to how the install ended, for the action bar to tell;
- without an `ETag` / `Last-Modified`, a reconnection would start over: no reconnecting for
  slowness then.

**Game version: option 2.** `version:check-game` (ADR 0003) returns the latest version per
environment; the store's `refreshGameVersions()` updates `latestGameVersions` only. The home
action bar runs it with each server status poll, so a new version shows ("Update required") at
the latest one poll after the maintenance ends. The launcher release keeps being checked at
startup only.

**Play checks the game version first** (maintainer, 2026-10-13): the click on Play runs
`refreshGameVersions()` and reads the installed `version.json` again
(`syncInstalledVersions()`) before launching. When a newer version is online, the game is not
launched: a warning toast says an update is needed, and the action bar shows "Update required".
The button shows its spinner during the check; an API that does not answer keeps the known
version, so the game still launches.

## Consequences

- A download stuck on a bad connection recovers by itself, the same way a restart did; a player
  on a slow line sees at most one useless reconnection per download.
- The thresholds are guesses tuned for a 1 GB archive; they live in `config/constants.ts`, the
  slowness one overridable by env.
- One more request per poll (the active universe's `/version`, both environments in fact: cheap).
- Play waits for one `/version` request (8 s at most) before launching.
- Tests: the watchdog against a local HTTP server that throttles, stalls, drops or refuses the
  connection (Node tests); the toasts of an interrupted or failed install; the
  store's `refreshGameVersions`; the action bar's poll calling it.
