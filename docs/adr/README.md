# Architecture Decision Records

This folder records the significant decisions taken on the DyingStar Launcher, using
lightweight ADRs ([Michael Nygard format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)),
on the model of [`DyingStar-game/adminpanel`](https://github.com/DyingStar-game/adminpanel/tree/develop/docs/adr).

## Conventions

- One file per decision: `NNNN-short-title-in-kebab-case.md` (4-digit sequence, never reused).
- Start from [`template.md`](./template.md).
- Statuses: `Proposed` → `Accepted` | `Rejected`; later `Deprecated` or `Superseded by NNNN`.
- An accepted ADR is not rewritten: write a new ADR that supersedes it.
- **An accepted ADR is binding, to the letter.** Reread the ADRs of an area before working in
  it and check each of their rules before calling the work done: lint and typecheck enforce
  only part of them.
- Written in English, like code comments; ADRs are not translated into `docs/fr/`.

## Index

| #                                                                  | Title                                                                                | Status                                                                     | Date       |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | ---------- |
| [0001](./0001-record-architecture-decisions.md)                    | Record architecture decisions                                                        | Proposed                                                                   | 2026-10-10 |
| [0002](./0002-makefile-tooling.md)                                 | Local tooling: a host Makefile over the pnpm scripts                                 | Accepted (versions superseded by 0006)                                     | 2026-10-10 |
| [0003](./0003-process-boundaries-ipc.md)                           | Process boundaries: privileged main, typed preload bridge, React renderer            | Accepted (retroactive)                                                     | 2026-10-10 |
| [0004](./0004-two-game-environments.md)                            | Two game environments, configured at build time                                      | Accepted (retroactive)                                                     | 2026-10-10 |
| [0005](./0005-keycloak-pkce-authentication.md)                     | Authentication: Keycloak PKCE in an in-app window, per environment                   | Accepted (retroactive; in-app window superseded by 0044)                   | 2026-10-10 |
| [0006](./0006-toolchain-versions.md)                               | Toolchain versions: Node 24, pnpm 12, Electron 44                                    | Proposed                                                                   | 2026-10-10 |
| [0007](./0007-social-player-side.md)                               | Social, player side: wire the existing UI to the `social` service                    | Accepted (add friend superseded by 0008, directory by 0024, store by 0025) | 2026-10-10 |
| [0008](./0008-player-search-screen.md)                             | Player search screen to add friends                                                  | Accepted                                                                   | 2026-10-10 |
| [0009](./0009-player-profile-sheet.md)                             | Player profile sheet                                                                 | Accepted (modal superseded by 0012)                                        | 2026-10-10 |
| [0010](./0010-organisation-sheet.md)                               | Organisation sheet, with join / apply                                                | Accepted (modal superseded by 0012)                                        | 2026-10-10 |
| [0011](./0011-atomic-design.md)                                    | Renderer components: atomic design                                                   | Accepted                                                                   | 2026-10-10 |
| [0012](./0012-sheets-as-pages.md)                                  | Player and organisation sheets as pages                                              | Accepted (useSocialResource superseded by 0025)                            | 2026-10-10 |
| [0013](./0013-back-restores-page-state.md)                         | Back restores where the player was                                                   | Accepted                                                                   | 2026-10-10 |
| [0014](./0014-bbcode-player-texts.md)                              | BBCode in player texts                                                               | Accepted                                                                   | 2026-10-10 |
| [0015](./0015-component-variants-cva-cn.md)                        | Component variants with `cva` and `cn()`; buttons only through atoms                 | Accepted (caller overrides superseded by 0017)                             | 2026-10-10 |
| [0016](./0016-shadcn-radix-interactive-primitives.md)              | shadcn/ui on Radix for interactive primitives                                        | Accepted                                                                   | 2026-10-10 |
| [0017](./0017-classname-layout-only.md)                            | `className` on components is for layout only; looks are variants                     | Accepted                                                                   | 2026-10-10 |
| [0018](./0018-loading-states.md)                                   | Loading states: skeletons for content, a spinner in action buttons                   | Accepted                                                                   | 2026-10-10 |
| [0019](./0019-claude-code-shared-setup.md)                         | Claude Code: shared instructions, hooks and skills in the repository                 | Accepted                                                                   | 2026-10-10 |
| [0020](./0020-edit-own-profile.md)                                 | Editing one's own profile                                                            | Accepted                                                                   | 2026-10-10 |
| [0021](./0021-organisation-management.md)                          | Managing one's organisation from the launcher                                        | Accepted (applications tab superseded by 0024)                             | 2026-10-10 |
| [0022](./0022-forms-react-hook-form-zod.md)                        | Forms with React Hook Form and Zod                                                   | Accepted                                                                   | 2026-10-10 |
| [0023](./0023-social-page-two-sections.md)                         | Social page in two sections: friends and organisations                               | Accepted (received applications superseded by 0024)                        | 2026-10-10 |
| [0024](./0024-organisation-search-tag-received-applications.md)    | Organisation search as you type, "tag", and received applications in the social page | Accepted                                                                   | 2026-10-10 |
| [0025](./0025-tanstack-query-server-state.md)                      | TanStack Query for data loaded through main                                          | Accepted (snapshot staleTime superseded by 0045)                           | 2026-10-10 |
| [0026](./0026-no-px-in-tailwind-classes.md)                        | No pixel values in Tailwind classes                                                  | Accepted                                                                   | 2026-10-10 |
| [0027](./0027-shadcn-first-badge.md)                               | Take from shadcn/ui what it provides: the Badge                                      | Accepted                                                                   | 2026-10-10 |
| [0028](./0028-buttons-on-shadcn.md)                                | Buttons on shadcn's Button, 36 px high                                               | Accepted                                                                   | 2026-10-10 |
| [0029](./0029-bbcode-toolbar.md)                                   | A BBCode toolbar and a live preview to write player texts                            | Accepted (editing superseded by 0030)                                      | 2026-10-10 |
| [0030](./0030-wysiwyg-bbcode-editor.md)                            | Writing player texts in a WYSIWYG editor, stored as BBCode                           | Accepted                                                                   | 2026-10-10 |
| [0031](./0031-styling-and-code-conventions.md)                     | Styling and code conventions, lint-enforced                                          | Accepted                                                                   | 2026-10-11 |
| [0032](./0032-no-component-css.md)                                 | The look lives on the components: no classes of our own in CSS files                 | Accepted                                                                   | 2026-10-11 |
| [0033](./0033-rendering-tests-vitest-browser.md)                   | Rendering tests in headless Chromium (Vitest browser mode, Playwright)               | Accepted                                                                   | 2026-10-11 |
| [0034](./0034-two-header-rows.md)                                  | Two header rows: the app, then the chosen universe                                   | Accepted                                                                   | 2026-10-11 |
| [0035](./0035-home-hero-and-action-bar.md)                         | Home page: the universe in full frame, one action bar at the bottom                  | Accepted (neutral background superseded by 0037)                           | 2026-10-12 |
| [0036](./0036-pause-resume-cancel-download.md)                     | Pause, resume and cancel the game download                                           | Accepted (action bar buttons superseded by 0037)                           | 2026-10-12 |
| [0037](./0037-home-key-art-and-pause-in-main-action.md)            | Home page: key art slideshow, and Pause in the main action                           | Accepted                                                                   | 2026-10-12 |
| [0038](./0038-keep-player-files-on-update.md)                      | Keep the player's files in the game folder on update                                 | Accepted                                                                   | 2026-10-13 |
| [0039](./0039-slow-download-reconnect-and-game-version-refresh.md) | Reconnect a slow download, refresh the game version while the launcher runs          | Accepted                                                                   | 2026-10-13 |
| [0040](./0040-changelog-types-and-areas.md)                        | Changelog page: entries by type and area (`global.json` version 2)                   | Accepted                                                                   | 2026-10-14 |
| [0041](./0041-render-error-boundaries.md)                          | Render errors stay in their zone (error boundaries)                                  | Accepted                                                                   | 2026-10-14 |
| [0042](./0042-changelog-dev-releases.md)                           | Changelog page: dev releases folded under their version                              | Accepted (sidebar build name superseded by 0046)                           | 2026-10-14 |
| [0043](./0043-sign-in-server-availability-and-discord-app.md)      | Sign-in server availability, and Discord opened in its app                           | Accepted                                                                   | 2026-10-17 |
| [0044](./0044-sign-in-in-system-browser.md)                        | Sign-in in the system browser                                                        | Accepted                                                                   | 2026-10-21 |
| [0045](./0045-friends-presence-and-polling-while-playing.md)       | Friends' presence refreshed every minute, nothing polled while playing               | Accepted                                                                   | 2026-10-21 |
| [0046](./0046-changelog-compact-builds-and-mark-all-read.md)       | Changelog sidebar: compact builds, unread dot, mark all as read                      | Accepted                                                                   | 2026-10-21 |
| [0047](./0047-disk-full-during-install.md)                         | Disk full during an install: checked before writing, said plainly                    | Accepted                                                                   | 2026-10-21 |
| [0048](./0048-disabled-buttons-say-why.md)                         | Disabled buttons: a not-allowed cursor, and why in a tooltip                         | Accepted                                                                   | 2026-10-21 |
