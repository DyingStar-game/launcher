# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Electron desktop launcher for the game _Dying Star_ (electron-vite, React 19, Tailwind CSS v4, Zustand, i18next, electron-builder). It handles Keycloak/Discord login, game ZIP download/install/update, game launch, server status, launcher update checks, changelog, and a player-side social UI (friends, requests, organisations) on the `social` game service.

## Golden rule — Git

- **Never commit, amend, tag or push on your own.** The maintainer creates every commit; do it only when explicitly asked, for that change.
- Never add `Co-Authored-By` or any AI attribution to commits or PR descriptions.
- Allowed otherwise: creating/switching branches and read-only commands (`git status`, `git diff`, `git log`).
- When asked to commit: thematic commits (`type(scope): subject`, a body per topic or ADR), each passing `make check` on its own — order them so no intermediate commit breaks, and say so when shared files force grouping. Leave personal files out (e.g. `.vscode/settings.json`).
- When asked to push or open/update a PR: keep its description current, including the `CHANGELOG_EN` / `CHANGELOG_FR` sections. `gh pr edit` fails on this repository (Projects classic deprecation): update the body with `gh api -X PATCH repos/DyingStar-game/launcher/pulls/<n> -F body=@<file>`.

## Claude Code setup (ADR 0019)

The rules are enforced, not only written. Do not disable or bypass them (no `--no-verify`, no editing `.claude/settings.json` to skip a hook); personal settings go in `.claude/settings.local.json`.

- After each `Edit` / `Write`, a hook formats and lints the file: fix what it reports before going on.
- Before handing back, a hook runs the `make check` steps when code changed since the last passing run: the turn is not done while it fails.
- Skill `verify-ui`: how to check a renderer change's rendering with a `*.browser.test.tsx` (measured in headless Chromium, no screenshots to read).
- A new rule goes into an ADR and this file, lint-enforced when possible; a repeatable procedure becomes a skill in `.claude/skills/`. Nothing project-related belongs in personal memory.

## Commands

Go through the root `Makefile` (ADR 0002): a thin, host-side wrapper over the pnpm scripts (no Docker — Electron needs a native window). Node 24 (`.nvmrc`), pnpm 12 pinned by `packageManager`; pnpm settings live in `pnpm-workspace.yaml` (`.npmrc` is auth/registry only since pnpm 11). Versions and held-back upgrades: ADR 0006. `make help` lists every target.

| Need                         | Command                                                                                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Install (creates `.env`)     | `make install` — `.env` comes from `.env.example`; `VITE_*` vars are baked in at build time                                                                      |
| Hot-reload dev               | `make dev` (`PLATFORM=x11` or `PLATFORM=wayland` forces the Linux display backend; default: auto)                                                                |
| Production preview (testers) | `make start`                                                                                                                                                     |
| Any pnpm script              | `make pnpm <cmd>`, flags via `ARGS`, e.g. `make pnpm typecheck:web`, `make pnpm add zod ARGS="-D"`                                                               |
| Checks before committing     | `make check` (format, lint, typecheck, test, format check); a change is done only when it passes                                                                 |
| Build / installer            | `make build` (→ `out/`), `make package` (current OS → `release/`), `make package-dir`                                                                            |
| Clean                        | `make clean`                                                                                                                                                     |
| Home page key art            | `make key-art`: PNG / JPEG dropped in `key-art/` (not versioned) → WebP in `src/renderer/assets/key-art/`, read by `lib/keyArt.ts`; never convert images by hand |

`typecheck` covers main/preload (`tsconfig.node.json`) and renderer (`tsconfig.web.json`); `typecheck:node` / `typecheck:web` check one side. Prettier: single quotes, no semicolons, width 100, no trailing commas.

Tests (Vitest, `vitest.config.ts`, three projects): `*.test.ts` run in Node (main, shared, renderer logic); `*.test.tsx` run in jsdom with Testing Library (components), set up by `src/renderer/test/setup.ts` (English strings, silent sounds, `window.api` as auto-mocks reset after each test; `test/seedSocial.ts` seeds the social store); `*.browser.test.tsx` run in headless Chromium with the real CSS (ADR 0033). Tests sit next to the code. Run one file with `make pnpm test src/main/services/social/mapping.test.ts`, or `make pnpm exec vitest` to watch. **Every new or modified component gets a `.test.tsx`** (ADR 0011). CI (`.github/workflows/build.yaml`) runs lint, typecheck and test on every push/PR, then builds Linux and Windows.

## Architecture

The rules behind this structure are ADRs 0003 (process boundaries), 0004 (environments) and 0005 (auth).

Three Electron processes plus shared types, under `src/`:

- `main/` — Node side: all filesystem, network, OAuth, and child-process work. `index.ts` registers the custom protocol, single-instance lock, frameless `BrowserWindow`, and calls each service's `register*Handlers()`.
- `preload/index.ts` — the **only** bridge: exposes `window.api` via `contextBridge`. Each method is an `ipcRenderer.invoke` to a channel handled in main, or an `on*` subscription for main→renderer pushes. Types for `window.api` live in `preload/index.d.ts`.
- `renderer/` — React app in **atomic design** (ADR 0011): `components/{ui,atoms,molecules,organisms/<feature>,templates}`, `pages/` (templates + data), `App.tsx` (page routing from the navigation store; `openPlayer` / `openOrganisation` / `back` handle the player and organisation pages and their history, ADR 0012; page UI state that Back must restore goes through `usePageState` / `useScrollMemory`, ADR 0013), Zustand stores (`stores/`), hooks, `lib/` helpers and shared constants, i18n JSON.
- `shared/` — types used across processes (`@shared/types/*`) and `env.d.ts` declaring every `VITE_*` variable.

Path aliases (`electron.vite.config.ts` + tsconfigs): main/preload only get `@shared`; renderer also gets `@components`, `@pages`, `@stores`, `@hooks`, `@lib`, `@i18n`, `@assets`.

### Atomic design (ADR 0011)

- Imports go down only: atoms → molecules → organisms → templates → pages (enforced by `no-restricted-imports` per folder in `eslint.config.mjs`).
- Atoms, molecules and templates are pure: no `@stores/*`, no `window.api` (lint-enforced); `@hooks/useUiSound` is allowed. Rows take callbacks (`onOpen`) and slots (`action`); organisms and pages wire them to stores.
- Reuse or extend before creating (e.g. `Button` `variant="outline" size="chip"`, `Avatar`); what shadcn/ui provides is taken from it, not rewritten (ADR 0027): `Badge` (`components/ui/badge`, statuses through `StatusBadge`, counts through `PendingCount`). Constants shared by components go in `lib/` (fast refresh: component files export components only).
- Classes go through `cn()` (`@lib/cn`) and variants through `cva` (ADR 0015). The `className` passed to a component is **layout only** (spacing, size, display, flex/grid placement, position; ADR 0017): a different look (colour, border, radius, typography, `hover:`…) is a variant of the component, never a class at the call site. No raw `<button>` outside `atoms/` and `ui/`: use `Button` (incl. `size="icon"`, `variant="link"` / `"bare"`), `TabButton`, `MenuItemButton` or `SidebarItemButton`.
- Style and code conventions are lint-enforced, the error names the ADR: no `px` in classes (ADR 0026: the scale, or a `rem` theme token like `text-2xs`, `nav-full:`); theme utilities (`text-ds-muted`, not `text-[var(--color-ds-muted)]`), `size-*` for equal sides, `<Component>Props` types with variant props from `VariantProps<typeof xVariants>`, file names by kind (ADR 0031).
- No class of our own in a CSS file (ADR 0032): a shared look is a component (`Panel`, `SectionLabel`, `PageSidebar`), markdown is styled through `react-markdown`'s `components` (`ChangelogEntryItem`).
- **Every message telling how an action went is a toast** (saved, created, cache cleared, partly done, failed…): `toast.success` / `.warning` / `.error` from `sonner`, shown by `ui/sonner`'s `Toaster` in `AppLayout` (top left, under the header rows, its duration from `toastDurationMs`). Never an inline message box or a coloured line in the page, and a form does not wait to show one before closing. What stays inline: field errors and a form's refusal by the server (`role="alert"` next to the form, which the player has to fix).
- While data loads, show a skeleton of the content (`ListSkeleton`, `DetailHeaderSkeleton` / `StatsSkeleton`, `TextSkeleton`, built on `ui/skeleton`), only after 150 ms (`useDelayedFlag`); an action button that waits uses `Button loading` (spinner, same width). No "Loading…" text placeholders (ADR 0018).
- Interactive primitives (menus, popovers, tooltips, tabs; `Dialog` when a modal is needed) come from shadcn/ui on Radix in `components/ui/` (ADR 0016), at the atom level, triggered by our atoms through `asChild`: `DropdownMenu` (burger), `Popover` + `Slider` (volume), `LabelTooltip` (icon buttons, instead of `title`), `Tabs` (social page). Their portalled content carries `app-no-drag`. Add one with `make pnpm dlx shadcn@4.21.4 add <name> --view <path>` and copy it in: the CLI resolves `utils` to a bogus `cn` package (import `cn` from `@lib/cn`), and the `shadcn` package is not installed (its `data-*` variants live in `assets/shadcn.css`; animations come from `tw-animate-css`).

### Checking a UI change

- Component tests (jsdom) check behaviour, not layout. When a change's rendering depends on layout, a breakpoint (≥1024px, the minimum window, full top bar; below 1024px burger menu; below 800px universe switch in the menu) or a state (hover, focus, inherited colour), measure it in a `*.browser.test.tsx` (skill `verify-ui`, ADR 0033); a test that only restates a class (`text-xs` is 12px) is not worth writing. Running the launcher (`make dev`) is for what lives outside the renderer (window, IPC, sign-in), with the maintainer's agreement.
- Two header rows (ADR 0034): the top bar holds what belongs to the whole app (universe switch, language, community links, sound, donate, window); the universe bar under it holds what depends on the chosen universe (Home, Social, Changelog, the testing notice, the account).
- Same kind, same look: text and icon buttons are 36px high (shadcn's `lg` / `icon-lg` sizes, ADR 0028), and so are single-line inputs (`ui/input`), spacing comes from the parent's `gap`, never from per-call margins or classes (ADR 0017); icons share the same visual size; every tooltip is Radix (`LabelTooltip`).
- A behaviour players rely on (e.g. a click on the speaker mutes) does not change without the maintainer's agreement, even when an ADR seems to suggest it.
- After fixing a defect, look for its other occurrences (every native `title`, every `asChild` wrapper overriding our atoms' classes…).

### Adding an IPC call

1. Handler in a `src/main/services/**` module, using the `ipcMain.removeHandler(ch); ipcMain.handle(ch, …)` pattern (handlers can be re-registered when the window is recreated). Channels are namespaced: `files:*`, `game:*`, `auth:*`, `window:*`, `version:*`, `changelog:*`, `env:*`, `app:*`.
2. Expose it in `src/preload/index.ts` and type it in `src/preload/index.d.ts`.
3. Put payload types in `src/shared/types/` when shared.

### Environments (`Env`)

`Env = 'universe' | 'universe-testing'` (prod vs test). Nearly everything is keyed by env: API base URLs, ZIP URLs, status pages, Keycloak tokens (stored per env in `userData` via `safeStorage`, with plain-JSON fallback when no keyring, e.g. WSL), and renderer store state. The renderer's active env is `useEnvStore().activeEnv`; IPC calls pass `env` explicitly. Env URL resolution lives in `src/main/config/api.ts`; tunables with defaults in `src/main/config/constants.ts` and `src/renderer/lib/env.ts`. When adding a `VITE_*` variable, declare it in `src/shared/env.d.ts` and document it in `.env.example`.

### Key flows

- **Auth** (`main/services/auth/`): PKCE OAuth against Keycloak (Discord IdP hint) in an in-app window; callback arrives via the custom `dyingstar://` protocol (`open-url` on macOS, `second-instance` argv on Windows, `.desktop` registration on Linux in `main/protocol/`). State changes are pushed to the renderer on `auth:state-changed`. Sign-out opens nothing: it ends the Keycloak session in the background (refresh token) and clears the sign-in window's own session (`persist:auth`: Keycloak and Discord cookies), so the next sign-in asks for the account again.
- **Install** (`main/services/download/`): download ZIP (resumed with an HTTP range when a partial one is on disk; pause and cancel until extraction, ADR 0036) → remove the files the previous archive installed (listed in `__game_files.json`; the player's screenshots, videos… stay, ADR 0038) and extract into `<installPath>/<GAME_INSTALL_SUBDIR>` → read `version.json`. `files:install` resolves to an `InstallOutcome` (installed, paused or cancelled). Progress is pushed on `files:progress` as a structured `InstallProgressLabel` key (`shared/types/installProgress.ts`), which the renderer translates via `installProgress.*` i18n keys — main never sends user-facing text.
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
  - game download (pause, resume, cancel): [0036](./docs/adr/0036-pause-resume-cancel-download.md), [0037](./docs/adr/0037-home-key-art-and-pause-in-main-action.md); game update keeping the player's files: [0038](./docs/adr/0038-keep-player-files-on-update.md);
  - tooling, Makefile, CI setup: [0002](./docs/adr/0002-makefile-tooling.md); Claude Code hooks, skills and instructions: [0019](./docs/adr/0019-claude-code-shared-setup.md); rendering tests in a browser: [0033](./docs/adr/0033-rendering-tests-vitest-browser.md); dependency and toolchain versions: [0006](./docs/adr/0006-toolchain-versions.md);
  - social (friends, requests, organisations), tests: [0007](./docs/adr/0007-social-player-side.md); player search screen: [0008](./docs/adr/0008-player-search-screen.md); player sheet: [0009](./docs/adr/0009-player-profile-sheet.md); organisation sheet: [0010](./docs/adr/0010-organisation-sheet.md); both as pages with back history: [0012](./docs/adr/0012-sheets-as-pages.md); Back restoring tab, search, scroll: [0013](./docs/adr/0013-back-restores-page-state.md); BBCode in player texts: [0014](./docs/adr/0014-bbcode-player-texts.md);
  - any renderer component: [0011](./docs/adr/0011-atomic-design.md); classes, variants and buttons: [0015](./docs/adr/0015-component-variants-cva-cn.md); menus, popovers, dialogs, tooltips, tabs (`components/ui/`): [0016](./docs/adr/0016-shadcn-radix-interactive-primitives.md); header rows: [0034](./docs/adr/0034-two-header-rows.md); home page: [0035](./docs/adr/0035-home-hero-and-action-bar.md), [0037](./docs/adr/0037-home-key-art-and-pause-in-main-action.md); `className` layout only: [0017](./docs/adr/0017-classname-layout-only.md); loading states: [0018](./docs/adr/0018-loading-states.md); no `px` in classes: [0026](./docs/adr/0026-no-px-in-tailwind-classes.md); style and code conventions: [0031](./docs/adr/0031-styling-and-code-conventions.md); no component CSS: [0032](./docs/adr/0032-no-component-css.md).
- A rule that cannot be followed is raised with the maintainer, never skipped silently. An accepted ADR is never rewritten: a new ADR supersedes it.

## Conventions

- User-facing strings go through i18n (`src/renderer/i18n/en.json` + `fr.json`, both must be updated); never hardcode text in TSX. Native dialogs in main use `src/main/l10n/dialogs.ts`.
- Code comments and JSDoc in English; existing code documents exported functions with a one-line JSDoc.
- Branch from and open PRs into **`develop`** (`main` is release-only). Branch names `feature/…` / `fix/…`; commit subjects like `feat(files): …`, `fix(auth): …`.
- For user-visible changes, fill the `<!-- CHANGELOG_EN -->` / `<!-- CHANGELOG_FR -->` sections of the PR template; a workflow records them on merge into `DyingStar-game/changelog`, which the launcher's Changelog page shows to players. Write them for players: one short line per change, what they see rather than how it is built, and impersonal — no "you" / "tu" ("Profile editing added: faction, biography…", « Modification du profil ajoutée : faction, biographie… »).
- Contributor docs are bilingual in `docs/en/` and `docs/fr/` — keep both in sync when editing them.
