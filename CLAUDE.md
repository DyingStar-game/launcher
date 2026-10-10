# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Electron desktop launcher for the game _Dying Star_ (electron-vite, React 19, Tailwind CSS v4, Zustand, i18next, electron-builder). It handles Keycloak/Discord login, game ZIP download/install/update, game launch, server status, launcher update checks, changelog, lore, and a player-side social UI (friends, requests, organisations) on the `social` game service.

## Golden rule — Git

- **Never commit, amend, tag or push on your own.** The maintainer creates every commit; do it only when explicitly asked, for that change.
- Never add `Co-Authored-By` or any AI attribution to commits or PR descriptions.
- Allowed otherwise: creating/switching branches and read-only commands (`git status`, `git diff`, `git log`).

## Commands

Go through the root `Makefile` (ADR 0002): a thin, host-side wrapper over the pnpm scripts (no Docker — Electron needs a native window). Node 24 (`.nvmrc`), pnpm 12 pinned by `packageManager`; pnpm settings live in `pnpm-workspace.yaml` (`.npmrc` is auth/registry only since pnpm 11). Versions and held-back upgrades: ADR 0006. `make help` lists every target.

| Need                         | Command                                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| Install (creates `.env`)     | `make install` — `.env` comes from `.env.example`; `VITE_*` vars are baked in at build time        |
| Hot-reload dev               | `make dev` (`PLATFORM=x11` or `PLATFORM=wayland` forces the Linux display backend; default: auto)  |
| Production preview (testers) | `make start`                                                                                       |
| Any pnpm script              | `make pnpm <cmd>`, flags via `ARGS`, e.g. `make pnpm typecheck:web`, `make pnpm add zod ARGS="-D"` |
| Checks before committing     | `make check` (format, lint, typecheck, test, format check); a change is done only when it passes   |
| Build / installer            | `make build` (→ `out/`), `make package` (current OS → `release/`), `make package-dir`              |
| Clean                        | `make clean`                                                                                       |

`typecheck` covers main/preload (`tsconfig.node.json`) and renderer (`tsconfig.web.json`); `typecheck:node` / `typecheck:web` check one side. Prettier: single quotes, no semicolons, width 100, no trailing commas.

Tests (Vitest, `vitest.config.ts`, two projects): `*.test.ts` run in Node (main, shared, renderer logic); `*.test.tsx` run in jsdom with Testing Library (components), set up by `src/renderer/test/setup.ts` (English strings, silent sounds, `window.api` as auto-mocks reset after each test; `test/seedSocial.ts` seeds the social store). Tests sit next to the code. Run one file with `make pnpm test src/main/services/social/mapping.test.ts`, or `make pnpm exec vitest` to watch. **Every new or modified component gets a `.test.tsx`** (ADR 0011). CI (`.github/workflows/build.yaml`) runs lint, typecheck and test on every push/PR, then builds Linux and Windows.

## Architecture

The rules behind this structure are ADRs 0003 (process boundaries), 0004 (environments) and 0005 (auth).

Three Electron processes plus shared types, under `src/`:

- `main/` — Node side: all filesystem, network, OAuth, and child-process work. `index.ts` registers the custom protocol, single-instance lock, frameless `BrowserWindow`, and calls each service's `register*Handlers()`.
- `preload/index.ts` — the **only** bridge: exposes `window.api` via `contextBridge`. Each method is an `ipcRenderer.invoke` to a channel handled in main, or an `on*` subscription for main→renderer pushes. Types for `window.api` live in `preload/index.d.ts`.
- `renderer/` — React app in **atomic design** (ADR 0011): `components/{atoms,molecules,organisms/<feature>,templates}`, `pages/` (templates + data), `App.tsx` (page routing from the navigation store; `openPlayer` / `openOrganisation` / `back` handle the player and organisation pages and their history, ADR 0012; page UI state that Back must restore goes through `usePageState` / `useScrollMemory`, ADR 0013), Zustand stores (`stores/`), hooks, `lib/` helpers and shared constants, i18n JSON, bundled markdown in `content/`.
- `shared/` — types used across processes (`@shared/types/*`) and `env.d.ts` declaring every `VITE_*` variable.

Path aliases (`electron.vite.config.ts` + tsconfigs): main/preload only get `@shared`; renderer also gets `@components`, `@pages`, `@stores`, `@hooks`, `@lib`, `@i18n`, `@content`, `@assets`.

### Atomic design (ADR 0011)

- Imports go down only: atoms → molecules → organisms → templates → pages (enforced by `no-restricted-imports` per folder in `eslint.config.mjs`).
- Atoms, molecules and templates are pure: no `@stores/*`, no `window.api` (lint-enforced); `@hooks/useUiSound` is allowed. Rows take callbacks (`onOpen`) and slots (`action`); organisms and pages wire them to stores.
- Reuse or extend before creating (e.g. `Button` `variant="outline" size="chip"`, `Badge`, `Avatar`, `Modal`). Constants shared by components go in `lib/` (fast refresh: component files export components only).
- Classes go through `cn()` (`@lib/cn`, `clsx` + `tailwind-merge`) and variants through `cva` (ADR 0015). No raw `<button>` outside `atoms/` (lint-enforced): use `Button` (incl. `size="icon"`, `variant="link"` / `"bare"`), `TabButton`, `MenuItemButton` or `SidebarItemButton`.

### Adding an IPC call

1. Handler in a `src/main/services/**` module, using the `ipcMain.removeHandler(ch); ipcMain.handle(ch, …)` pattern (handlers can be re-registered when the window is recreated). Channels are namespaced: `files:*`, `game:*`, `auth:*`, `window:*`, `version:*`, `changelog:*`, `env:*`, `app:*`.
2. Expose it in `src/preload/index.ts` and type it in `src/preload/index.d.ts`.
3. Put payload types in `src/shared/types/` when shared.

### Environments (`Env`)

`Env = 'universe' | 'universe-testing'` (prod vs test). Nearly everything is keyed by env: API base URLs, ZIP URLs, status pages, Keycloak tokens (stored per env in `userData` via `safeStorage`, with plain-JSON fallback when no keyring, e.g. WSL), and renderer store state. The renderer's active env is `useEnvStore().activeEnv`; IPC calls pass `env` explicitly. Env URL resolution lives in `src/main/config/api.ts`; tunables with defaults in `src/main/config/constants.ts` and `src/renderer/lib/env.ts`. When adding a `VITE_*` variable, declare it in `src/shared/env.d.ts` and document it in `.env.example`.

### Key flows

- **Auth** (`main/services/auth/`): PKCE OAuth against Keycloak (Discord IdP hint) in an in-app window; callback arrives via the custom `dyingstar://` protocol (`open-url` on macOS, `second-instance` argv on Windows, `.desktop` registration on Linux in `main/protocol/`). State changes are pushed to the renderer on `auth:state-changed`.
- **Install** (`main/services/download/`): download ZIP → wipe and extract into `<installPath>/<GAME_INSTALL_SUBDIR>` → read `version.json`. Progress is pushed on `files:progress` as a structured `InstallProgressLabel` key (`shared/types/installProgress.ts`), which the renderer translates via `installProgress.*` i18n keys — main never sends user-facing text.
- **Launch** (`main/services/game/`): fetches a fresh JWT and spawns the executable with `--token=<jwt>`; `processWatch` tracks the child and pushes `game:running-changed`. A `SESSION_EXPIRED` error means re-login is needed.
- **Startup** (`renderer/App.tsx`): env availability check, version check (launcher vs GitHub Releases, game vs API), changelog fetch.
- Persisted renderer state uses `zustand/persist` (`stores/files.ts` install metadata, `stores/changelog.ts` read-state with a `migrate`, `stores/sound.ts`).
- **Social** (`main/services/social/`, ADR 0007): main calls the `social` service (`VITE_SOCIAL_BASE_*`; preprod by default for testing, none for prod) with the player's Keycloak access token. `social:*` handlers resolve to `SocialResult` (`{ ok, data } | { ok: false, error: SocialErrorCode }`) instead of throwing; the store turns errors into `SocialStoreError`, translated as `universe.socialPage.errors.<code>`. The service README (`DyingStar-game/services/social`) is the reference; check its code too before relying on a shape.

## ADRs are binding

Significant decisions are recorded in [`docs/adr/`](./docs/adr/) (Nygard format, `template.md`, index in `README.md`), on the model of `DyingStar-game/adminpanel`.

- Analyse before coding: a non-trivial decision is drafted as an ADR (`Proposed`), and is `Accepted` before implementation.
- An **accepted ADR is a rule, not a suggestion**; passing lint/typecheck is not proof of compliance. Before working in an area, reread its ADRs; before calling the work done, check them rule by rule, then `make check`.
- Which ADRs govern which area:
  - any IPC, main or preload change: [0003](./docs/adr/0003-process-boundaries-ipc.md);
  - anything env-dependent, any `VITE_*` variable: [0004](./docs/adr/0004-two-game-environments.md);
  - sign-in, tokens, game launch: [0005](./docs/adr/0005-keycloak-pkce-authentication.md);
  - tooling, Makefile, CI setup: [0002](./docs/adr/0002-makefile-tooling.md); dependency and toolchain versions: [0006](./docs/adr/0006-toolchain-versions.md);
  - social (friends, requests, organisations), tests: [0007](./docs/adr/0007-social-player-side.md); player search screen: [0008](./docs/adr/0008-player-search-screen.md); player sheet: [0009](./docs/adr/0009-player-profile-sheet.md); organisation sheet: [0010](./docs/adr/0010-organisation-sheet.md); both as pages with back history: [0012](./docs/adr/0012-sheets-as-pages.md); Back restoring tab, search, scroll: [0013](./docs/adr/0013-back-restores-page-state.md); BBCode in player texts: [0014](./docs/adr/0014-bbcode-player-texts.md);
  - any renderer component: [0011](./docs/adr/0011-atomic-design.md); classes, variants and buttons: [0015](./docs/adr/0015-component-variants-cva-cn.md).
- A rule that cannot be followed is raised with the maintainer, never skipped silently. An accepted ADR is never rewritten: a new ADR supersedes it.

## Conventions

- User-facing strings go through i18n (`src/renderer/i18n/en.json` + `fr.json`, both must be updated); never hardcode text in TSX. Native dialogs in main use `src/main/l10n/dialogs.ts`.
- Code comments and JSDoc in English; existing code documents exported functions with a one-line JSDoc.
- Branch from and open PRs into **`develop`** (`main` is release-only). Branch names `feature/…` / `fix/…`; commit subjects like `feat(files): …`, `fix(auth): …`.
- For user-visible changes, fill the `<!-- CHANGELOG_EN -->` / `<!-- CHANGELOG_FR -->` sections of the PR template; a workflow records them on merge.
- Contributor docs are bilingual in `docs/en/` and `docs/fr/` — keep both in sync when editing them.
