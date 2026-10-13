# 0033. Rendering tests in headless Chromium (Vitest browser mode, Playwright)

- **Status:** Accepted
- **Date:** 2026-10-11
- **Deciders:** maintainer
- **Scope:** Renderer tests, tooling, Claude Code skill `verify-ui`
- **Builds on:** [ADR 0011](./0011-atomic-design.md) (every component has a test),
  [ADR 0019](./0019-claude-code-shared-setup.md) (skills), [ADR 0006](./0006-toolchain-versions.md)
  (dependencies)

## Context

Component tests run in jsdom, which computes no layout and no CSS: a button's height, a form's
position, a colour, a breakpoint cannot be asserted there. Rendering was checked by running the
launcher (`make dev`), capturing the window from the main process and reading the screenshots
(skill `verify-ui`, CLAUDE.md "Checking a UI change"). That is slow, needs temporary code in
`src/main/index.ts`, is not repeatable, and reading images costs a lot of an AI assistant's
context; nothing guarded against a regression afterwards.

Example (2026-10-11): the edit and management pages put their form in the left two thirds of the
page, the right third empty, because `DetailPageLayout` kept its two-column grid without an aside.
No test could see it.

The maintainer (2026-10-11) chose Vitest's browser mode over Playwright on the packaged Electron
app (heavier: a build, a display, slow start) and over screenshot comparisons (baselines to
review, fonts differing between machines), which may come later.

## Decision

- **Rendering tests**: `*.browser.test.tsx`, next to the component, run by a third Vitest
  project (`browser`) in **headless Chromium through Playwright**, with the launcher's stylesheet
  (Tailwind plugin, `assets/main.css`). Viewport 1400 × 900; `page.viewport()` checks the other
  breakpoints.
- They **measure**: `getBoundingClientRect()`, `getComputedStyle()` (pseudo-elements included),
  real pointer and keyboard through `userEvent` from `vitest/browser`. No screenshot is read; on
  a failure Vitest saves one under `.vitest/` (ignored by Git).
- Same helpers as the jsdom tests: `test/render`, `seedSocial`, mocked `window.api`.
  `test/commonSetup.ts` holds what both share; `test/setup.ts` adds the jsdom polyfills and silent
  sounds; `test/browserSetup.ts` adds the stylesheet (sounds stay real: the engine ignores a
  refused playback).
- **A rendering test when the rendering depends on something a class does not state**: layout
  (a column's width, an alignment), a breakpoint, a state (hover, focus, an inherited colour), a
  generated selector (TipTap's placeholder). A test that only restates a class (`text-xs` is
  12 px) is not written: it breaks on every intended design change and catches nothing. Running
  the launcher is kept for what lives outside the renderer (frameless window, IPC, sign-in), with
  the maintainer's agreement.
- Dependencies (dev): `@vitest/browser-playwright` (same version as `vitest`) and `playwright`.
  Chromium is downloaded by `make install` (`pnpm test:browser:install`) and in CI
  (`playwright install --with-deps chromium`) before the tests.
- The skill `verify-ui` describes how to write and run them.

## Consequences

- Layout defects become failing tests, kept as regression checks; `make check` and CI run them
  (about a second for the current set).
- A fresh clone needs Chromium (about 120 MB, in Playwright's cache): `make install` fetches it.
- `DetailPageLayout` gives the main column the whole width when there is no aside: the edit and
  management forms are no longer off-centre.
- The packaged app itself (main process, window) stays untested automatically; Playwright's
  Electron support is the next step if needed.
