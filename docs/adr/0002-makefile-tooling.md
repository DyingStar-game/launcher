# 0002. Local tooling: a host Makefile over the pnpm scripts

- **Status:** Accepted
- **Date:** 2026-10-10
- **Scope:** Project-wide

## Context

Contributors run the launcher through the pnpm scripts of `package.json`, listed in the README
and the onboarding docs. Other DyingStar web repositories
([`adminpanel`](https://github.com/DyingStar-game/adminpanel/blob/develop/docs/adr/0012-docker-makefile-tooling.md),
`website`) share a common entry point: a self-documented `Makefile` (`## …` comments,
`make help` as default goal, a generic `make pnpm <cmd>`, a `make check` before every commit,
a testers profile and a dev profile), wrapping a Docker / podman compose setup.

The launcher differs from those web apps:

- Electron opens a native window: running it in a container needs X11 / Wayland forwarding,
  GPU flags and differs per host OS (Linux, WSL, macOS, Windows).
- Packaging is per OS (`build:win` on Windows, `build:mac` on macOS, `build:linux` on Linux):
  a Linux container cannot produce signed macOS builds, and Windows builds need Wine.
- The OAuth callback relies on the `dyingstar://` protocol registered with the host OS.

## Options considered

1. **Makefile + Docker compose, as in adminpanel** — same commands as the other repos. Cons:
   the app itself cannot reasonably run in the container; only lint / typecheck would.
2. **Host Makefile, no Docker** — same target names and conventions, commands run on the
   host with the pinned pnpm. Cons: needs `make` (not native on Windows: Git Bash / WSL).
3. **pnpm scripts only** — status quo. Cons: no shared entry point with the other repos, no
   single "check before commit" command.

## Decision

We will add a root `Makefile` modelled on adminpanel's (option 2), without Docker:

| Element         | Launcher adaptation                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Skeleton        | Coloured output, `## …` self-documentation, `make help` grouped by profile, `.DEFAULT_GOAL := help`.                         |
| Testers profile | `make start`: builds and runs the production preview (`electron-vite preview`).                                              |
| Dev profile     | `make install`, `make dev`, `make pnpm <cmd>` (flags through `ARGS="…"`), `make check`.                                      |
| `make check`    | `format`, `lint`, `typecheck`, `format:check` (no test suite yet).                                                           |
| Build           | `make build`, `make package` (installer for the current OS), `make package-dir`.                                             |
| Utilities       | `make clean` (`out/`, `release/`, `.eslintcache`). No `logs` / `shell` / `status`: no containers.                            |
| First run       | `.env` created from `.env.example`; `node_modules` installed when missing.                                                   |
| Versions        | `.nvmrc` = Node 22 (the version CI already used); CI reads it through `node-version-file`. pnpm pinned via `packageManager`. |

The pnpm scripts stay the source of truth: the Makefile only calls them, so CI and
contributors without `make` keep working.

## Consequences

- Same command vocabulary as the other DyingStar repositories (`make help`, `make check`,
  `make pnpm …`).
- Windows contributors need `make` from Git Bash or WSL, or keep calling `pnpm` directly.
- Contributor docs (README, `docs/en` and `docs/fr` onboarding and contributing) present the
  Makefile first and the raw pnpm scripts as a fallback.
- `engines` in `package.json` still accepts Node `>=20`; `.nvmrc` is the version we develop
  and build with.
