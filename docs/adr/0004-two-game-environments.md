# 0004. Two game environments, configured at build time

- **Status:** Accepted (recorded retroactively)
- **Date:** 2026-10-10
- **Scope:** Configuration, every feature

## Context

Players reach two universes: production and a test server, each with its own API, game
archives, Keycloak, status page and player accounts. A single launcher binary serves both,
and the player switches between them in the navbar. URLs differ per deployment and must not
be hard-coded.

## Options considered

1. **One launcher per environment** — simple code, but two binaries to build, sign and
   distribute.
2. **One launcher, environment as a runtime dimension** — every feature takes an `Env`
   parameter; configuration per environment.
3. **Runtime configuration file** (downloaded or next to the binary) — flexible, but adds a
   bootstrap fetch and a failure mode before anything works.

## Decision

We keep option 2, with configuration baked in at build time:

- `Env = 'universe' | 'universe-testing'` (`src/shared/types/env.ts`). `universe` is
  production, `universe-testing` the test server.
- **Every env-dependent operation takes `env` explicitly**: IPC calls pass it as an argument,
  main never reads a "current env" global. The renderer's active env is
  `useEnvStore().activeEnv`; env-scoped stores keep their data as `Record<Env, …>` so switching
  does not lose the other env's state.
- **Configuration comes from `VITE_*` variables**, embedded at build time by electron-vite,
  read in `src/main/config/` (main) and `src/renderer/lib/env.ts` (renderer). Each variable is
  declared in `src/shared/env.d.ts` and documented in `.env.example`. Optional values are
  trimmed and fall back to a default; an empty required URL disables the feature (button
  disabled, env unavailable) instead of failing.
- **Derived hosts**: from the API base, the status host is `status.<host>` and the Keycloak
  host `auth-preprod.<host>` unless already prefixed (`ENDPOINTS` in `src/main/config/api.ts`).
  Game archives come from `VITE_GAME_ZIP_*` when set, else `<download base>/game/latest-<os>.zip`.
- **Availability is checked at startup**: `env:check-availability` pings each env's
  `/version`; the account, files and game panels read `useAvailabilityStore().available[env]`
  and degrade when their env is unavailable.
- Per-env persisted data (tokens, install path and metadata) is stored separately for each env.

## Consequences

- Adding a feature means asking, every time, whether it differs per env.
- `.env` is never committed; a build carries the URLs of the `.env` it was built with, so
  release builds need the production values set in CI.
- Changing a URL requires a new launcher release.
- A third environment would mean widening `Env` and every `Record<Env, …>`; TypeScript points
  at each place to update.
