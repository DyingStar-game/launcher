# Contributor onboarding

Welcome to the **Dying Star Launcher** repository. This guide helps you understand the project and get a working dev environment quickly.

## What this project is

A desktop **Electron** launcher for the game _Dying Star_. It handles:

- Discord / Keycloak authentication (per environment)
- Game download, install, and updates (ZIP from configurable URLs)
- Server status and player count
- Launcher update checks (GitHub Releases)
- Lore articles (bundled markdown) and a **social UI** (friends, requests, organisations) on the `social` game service

## Repository layout

```
src/
├── main/       # Electron main process (IPC, auth, download, game launch)
├── preload/    # contextBridge API exposed as window.api
├── renderer/   # React UI in atomic design (components/{atoms,molecules,organisms,templates}, pages/), Zustand stores, i18n
└── shared/     # TypeScript types shared across processes
docs/           # Contributor docs (en/ and fr/)
resources/      # App icons and macOS entitlements
```

Path aliases (Vite/TS): `@shared`, `@components`, `@pages`, `@stores`, `@hooks`, `@lib`, `@i18n`, `@content`, `@assets`.

Components follow **atomic design** ([ADR 0011](../adr/0011-atomic-design.md)): imports go down only, atoms / molecules / templates are pure (no store), and every new or modified component comes with a `*.test.tsx` (Testing Library). Its rendering (sizes, alignment, colours, breakpoints) is measured by a `*.browser.test.tsx`, run in headless Chromium with the real Tailwind CSS ([ADR 0033](../adr/0033-rendering-tests-vitest-browser.md)); `make install` downloads Chromium.

## Branches

| Branch           | Purpose                                                     |
| ---------------- | ----------------------------------------------------------- |
| **`develop`**    | **Default branch for development.** Open PRs here.          |
| `main`           | Stable / release-aligned (maintainers merge from `develop`) |
| Feature branches | `feature/your-topic` from `develop`                         |

```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-change
```

## Prerequisites

- **Node.js 24** (pinned in `.nvmrc`: `nvm use`)
- **pnpm 12** (only package manager used in this repo, pinned by `packageManager` in `package.json`; its settings live in `pnpm-workspace.yaml`)
- Git
- **make** (optional: Linux / macOS / WSL / Git Bash; every target wraps a pnpm script)

## First-time setup

```bash
git clone https://github.com/DyingStar-game/launcher.git
cd launcher
git checkout develop
make install   # creates .env from .env.example, then pnpm install
# Edit .env — at minimum set API/ZIP URLs for universe-testing if you want installs
make dev
```

### Environment files

- Copy `.env.example` → `.env` (never commit `.env`)
- Variables prefixed with `VITE_` are embedded at build time in the app binary
- For local UI-only work, testing URLs in `.env.example` may be enough; production URLs are often empty until configured

### Makefile

The root `Makefile` is the common entry point, as in the other DyingStar repositories
([ADR 0002](../adr/0002-makefile-tooling.md)). `make help` lists every target.

| Command           | Description                                                 |
| ----------------- | ----------------------------------------------------------- |
| `make start`      | Build and run the production preview (testers)              |
| `make install`    | Create `.env` if missing, install dependencies              |
| `make dev`        | Hot-reload development                                      |
| `make pnpm <cmd>` | Any pnpm script, e.g. `make pnpm typecheck:web`             |
| `make check`      | Format, lint, typecheck, format check — before every commit |
| `make build`      | Production build to `out/`                                  |
| `make package`    | Installer for the current OS in `release/`                  |

On Linux, Electron picks X11 or Wayland from the session. To reproduce a display bug on the
other backend, force it with `make dev PLATFORM=wayland` or `make dev PLATFORM=x11` (same for
`make start`). Under WSLg, the Wayland socket is found automatically.
| `make clean` | Remove `out/`, `release/` and the ESLint cache |

Without `make` (e.g. plain Windows), call the pnpm scripts directly: `pnpm run dev`,
`pnpm run typecheck`, `pnpm run lint`, `pnpm run format`, `pnpm run build`.

## ESLint and Prettier

The repo ships with **ESLint 9** (flat config) and **Prettier**. They are installed with `pnpm install` — no global install required.

### Configuration files

| File                | Role                                                                |
| ------------------- | ------------------------------------------------------------------- |
| `eslint.config.mjs` | ESLint flat config (TypeScript, React, Hooks, Prettier integration) |
| `.prettierrc.yaml`  | Prettier rules (single quotes, no semicolons, print width 100)      |
| `.prettierignore`   | Paths excluded from formatting (`out/`, lockfiles, etc.)            |

ESLint uses `@electron-toolkit/eslint-config-prettier` so formatting is handled by Prettier, not duplicate ESLint style rules.

### Commands (repo root)

```bash
# Lint check (required before a PR)
pnpm run lint

# Auto-fix what ESLint can (including Prettier issues reported via eslint)
pnpm run lint:fix

# Format the whole project with Prettier
pnpm run format
```

Before committing, run everything at once:

```bash
make check
```

### VS Code / Cursor

Recommended workspace files live in `.vscode/`:

1. Install extensions (folder prompt or manually):
   - **ESLint** (`dbaeumer.vscode-eslint`)
   - **Prettier** (`esbenp.prettier-vscode`)
2. `.vscode/settings.json` sets Prettier as the default formatter and enables format on save for TypeScript/JavaScript/JSON.

If format on save does not run, set **Default Formatter** to Prettier and enable **Editor: Format On Save**.

### CI

`.github/workflows/build.yaml` runs `pnpm run lint` and `pnpm run typecheck` on every push and PR, then builds Linux and Windows.

## How the app is structured (mental model)

1. **Renderer** (React + Zustand) calls **`window.api.*`** from the preload script.
2. **Preload** forwards calls via `ipcRenderer.invoke` to **main** handlers.
3. **Main** performs filesystem, network, OAuth, and game process work, then pushes events back (e.g. auth state, install progress).

Install progress uses **structured keys** (`InstallProgressLabel` in `src/shared/types/installProgress.ts`) sent from main; the renderer translates them with i18next (`installProgress.*` keys).

## Internationalization (i18n)

- UI strings: `src/renderer/i18n/en.json` and `fr.json`
- Use `useTranslation()` and `t('key')` in components — no user-facing hardcoded strings in TSX
- Language: browser detection + `localStorage` key `ds-language`; navbar flags switch EN/FR
- Native folder picker (main): `src/main/l10n/dialogs.ts` (OS locale fr/en)

## Features to know about

### Social page

The main process calls the `social` service (`src/main/services/social/`, [ADR 0007](../adr/0007-social-player-side.md)) with the player's Keycloak token. It is available on `universe-testing` (preprod service by default, `VITE_SOCIAL_BASE_TESTING`) and shows "unavailable" on `universe` until production is deployed. Sign in on `universe-testing` to try it. Errors come back as codes, translated under `universe.socialPage.errors.*`.

### Two game environments

- `universe` — production
- `universe-testing` — test server / data

The navbar env switcher changes `useEnvStore().activeEnv`; most stores are keyed by `Env`.

## Before opening a PR

1. Branch from **`develop`**
2. Run `make check`
3. Keep changes focused; match existing code style
4. For user-visible changes, fill in the `<!-- CHANGELOG_EN -->` and `<!-- CHANGELOG_FR -->` sections in the PR description — entries are recorded automatically on merge
5. Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [ADRs](../adr/README.md) of the area you touch

## Getting help

- Open a GitHub Discussion or Issue (for bugs, use the issue template when available)
- Security issues: see [SECURITY.md](SECURITY.md) — do **not** open public issues for vulnerabilities
