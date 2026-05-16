# Contributor onboarding

Welcome to the **Dying Star Launcher** repository. This guide helps you understand the project and get a working dev environment quickly.

## What this project is

A desktop **Electron** launcher for the game _Dying Star_. It handles:

- Discord / Keycloak authentication (per environment)
- Game download, install, and updates (ZIP from configurable URLs)
- Server status and player count
- Launcher update checks (GitHub Releases)
- Lore articles (bundled markdown) and a **social UI** (currently mock data)

## Repository layout

```
src/
├── main/       # Electron main process (IPC, auth, download, game launch)
├── preload/    # contextBridge API exposed as window.api
├── renderer/   # React UI (views, components, Zustand stores, i18n)
└── shared/     # TypeScript types shared across processes
docs/           # Contributor docs (en/ and fr/)
resources/      # App icons and macOS entitlements
```

Path aliases (Vite/TS): `@shared`, `@components`, `@views`, `@stores`, `@hooks`, `@lib`, `@i18n`, `@content`, `@assets`.

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

- **Node.js 20+**
- **pnpm** (only package manager used in this repo — see root `packageManager` in `package.json`)
- Git

## First-time setup

```bash
git clone https://github.com/DyingStar-game/launcher.git
cd launcher
git checkout develop
pnpm install
cp .env.example .env
# Edit .env — at minimum set API/ZIP URLs for universe-testing if you want installs
pnpm run dev
```

### Environment files

- Copy `.env.example` → `.env` (never commit `.env`)
- Variables prefixed with `VITE_` are embedded at build time in the app binary
- For local UI-only work, testing URLs in `.env.example` may be enough; production URLs are often empty until configured

### Useful scripts

| Command              | Description                  |
| -------------------- | ---------------------------- |
| `pnpm run dev`       | Hot-reload development       |
| `pnpm run typecheck` | TypeScript (main + renderer) |
| `pnpm run lint`      | ESLint                       |
| `pnpm run format`    | Prettier                     |
| `pnpm run build`     | Production build to `out/`   |

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

Recommended workflow before committing:

```bash
pnpm run format
pnpm run typecheck
pnpm run lint
```

### VS Code / Cursor

Recommended workspace files live in `.vscode/`:

1. Install extensions (folder prompt or manually):
   - **ESLint** (`dbaeumer.vscode-eslint`)
   - **Prettier** (`esbenp.prettier-vscode`)
2. `.vscode/settings.json` sets Prettier as the default formatter and enables format on save for TypeScript/JavaScript/JSON.

If format on save does not run, set **Default Formatter** to Prettier and enable **Editor: Format On Save**.

### CI

When GitHub Actions is added, run `pnpm run typecheck` and `pnpm run lint` on every PR to `develop`.

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

### Social page (mock)

`src/renderer/stores/social.ts` uses **in-memory mock data** until backend APIs exist. Friend/org actions simulate latency; errors use `SocialStoreError` codes mapped in `src/renderer/lib/socialErrors.ts`.

### Two game environments

- `universe` — production
- `universe-testing` — test server / data

The navbar env switcher changes `useEnvStore().activeEnv`; most stores are keyed by `Env`.

## Before opening a PR

1. Branch from **`develop`**
2. Run `pnpm run typecheck && pnpm run lint`
3. Keep changes focused; match existing code style
4. Update `docs/en/CHANGELOG.md` and `docs/fr/CHANGELOG.md` for user-visible changes (Unreleased section)
5. Read [CONTRIBUTING.md](CONTRIBUTING.md)

## Getting help

- Open a GitHub Discussion or Issue (for bugs, use the issue template when available)
- Security issues: see [SECURITY.md](SECURITY.md) — do **not** open public issues for vulnerabilities
