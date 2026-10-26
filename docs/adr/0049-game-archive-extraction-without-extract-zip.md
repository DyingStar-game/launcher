# 0049. Game archive extracted with `node-stream-zip`, not `extract-zip`

- **Status:** Accepted
- **Date:** 2026-10-24
- **Deciders:** maintainer
- **Scope:** Game install (`main/services/download/`), dependencies
- **Supersedes:** the `get-stream`, `yauzl`, `buffer-crc32` row of [ADR 0006](./0006-toolchain-versions.md)

## Context

`pnpm audit` and Dependabot report two high-severity advisories on `extract-zip` 2.0.1, its
last release (2020-06): [GHSA-jmr9-qjv8-65gv](https://github.com/advisories/GHSA-jmr9-qjv8-65gv)
and [GHSA-7pqw-9j4j-h8q3](https://github.com/advisories/GHSA-7pqw-9j4j-h8q3) (CWE-22). A
symbolic link entry can point outside the destination folder, and the next entries are then
written through it: anywhere the player's account can write. No patched version exists; the
repository has seen no commit since 2022.

The game archive weighs several gigabytes: the library must stream it to disk, not load it in
memory, and handle ZIP64. The launcher also reads the archive's file list and size with `yauzl`
(`gameFiles.ts`, ADR 0038, 0047). The Linux executable is made executable at launch
(`launch.ts`), so the archive's Unix permissions need not be kept.

## Options considered

State on 2026-10-24 (npm weekly downloads, GitHub stars, last release, advisories):

| Library           | Downloads | Stars | Last release | Fits?                                                                                                                                                                                                   |
| ----------------- | --------- | ----- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `extract-zip`     | 14 M      | 399   | 2020-06      | Unmaintained, two unpatched high advisories.                                                                                                                                                            |
| `adm-zip`         | 14 M      | 2.2 k | 2026-09      | Loads the archive in memory; eight advisories in 2026, one still unpatched (follows symbolic links on extraction).                                                                                      |
| `@zip.js/zip.js`  | 4 M       | 3.9 k | 2026-10      | Well maintained, no advisory, but web-first: no extraction to disk, we would write it (paths, folders, streams) ourselves.                                                                              |
| `fflate`          | 65 M      | 3.1 k | 2026-05      | In memory: unsuited to a multi-gigabyte archive.                                                                                                                                                        |
| `unzipper`        | 17 M      | 475   | 2026-06      | 91 open issues, several on large or ZIP64 archives.                                                                                                                                                     |
| `yauzl`           | 34 M      | 831   | 2026-06      | Maintained, rejects absolute and `..` paths, but only reads: the extraction (folders, streams, symbolic links) would be ours to write and test.                                                         |
| `node-stream-zip` | 3.7 M     | 467   | 2026-07      | Maintained, no advisory, no dependency; streams to disk, ZIP64; `extract()` refuses absolute, drive and `..` paths ("Malicious entry") and writes every entry as a regular file, never a symbolic link. |

## Decision

We will read the game archive with `node-stream-zip` (its promise API), in
`main/services/download/extract.ts`, keeping the function's signature and its progress reports
(one per file). `listArchiveFiles` (`gameFiles.ts`) moves to it too, so the launcher reads ZIP
files with one library.

Its `extract()` is not used: it leaves the write stream's errors unhandled, so a disk filling up
during extraction (`ENOSPC`, ADR 0047) would be an uncaught exception in main instead of a
rejection (checked against `/dev/full`). The launcher writes each file itself, from
`zip.stream(entry)` through `stream/promises`' `pipeline`, after checking every entry's path
stays inside the game folder (on top of the library's own check when it opens the archive).

`extract-zip` and `yauzl` are removed, with the dependencies listed only so they are packaged
(`get-stream`, `pump`, `end-of-stream`, `once`, `wrappy`, `buffer-crc32`, `fd-slicer`, `pend`,
`ms`), after checking nothing else imports them.

## Consequences

- The two `extract-zip` advisories are closed; `pnpm audit` is clean.
- One dependency, with none of its own, instead of `extract-zip` and its packaged chain.
- A symbolic link in the archive is installed as a small file holding its target: the game build
  must not rely on one.
- Tests: an archive with a `..` entry is refused before the game folder is touched; progress and
  disk full (ADR 0047, a file written to `/dev/full`) reject as before (`extract.test.ts`,
  `install.test.ts`).
