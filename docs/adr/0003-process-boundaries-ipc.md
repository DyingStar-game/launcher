# 0003. Process boundaries: privileged main, typed preload bridge, React renderer

- **Status:** Accepted (recorded retroactively)
- **Date:** 2026-10-10
- **Scope:** Project-wide

## Context

The launcher downloads and extracts archives, writes tokens to disk, spawns the game and opens
OAuth windows. Electron runs this kind of work in the main process (Node) and the UI in a
renderer (Chromium). Giving the renderer direct Node access would let any injected content
(markdown changelog, remote JSON) touch the filesystem. This structure has been in place since
the first versions; this ADR records it so new features follow it.

## Options considered

1. **Node integration in the renderer** — simplest, but the UI renders remote content: a
   single XSS becomes arbitrary code execution.
2. **Main process + `contextBridge` preload exposing a narrow, typed API** — Electron's
   recommended model. More boilerplate per feature (handler, bridge, types).

## Decision

We keep option 2, with these rules:

- **`src/main/`** owns every privileged operation: filesystem, network calls to game APIs,
  OAuth, token storage, child processes, native dialogs. Code is grouped by feature under
  `services/<feature>/`, configuration under `config/`.
- **`src/preload/index.ts`** is the only bridge. It exposes `window.api`: each method is
  either an `ipcRenderer.invoke` on one channel, or an `on*` subscription to a main → renderer
  event. No logic beyond forwarding. Its types live in `src/preload/index.d.ts`.
- **`src/renderer/`** never imports Node or Electron modules; it reaches the system only through
  `window.api`. State lives in Zustand stores (`stores/`), which call `window.api`.
- **`src/shared/`** holds types used across processes (`@shared/types/*`). Main and preload
  only resolve the `@shared` alias; renderer aliases (`@stores`, `@components`, …) are not
  available to them.
- **Channels** are namespaced by feature: `files:*`, `game:*`, `auth:*`, `window:*`,
  `version:*`, `changelog:*`, `env:*`, `app:*`.
- **Handlers are re-registrable**: `ipcMain.removeHandler(channel)` before
  `ipcMain.handle(channel, …)`, because window-bound handlers are registered again when the
  window is recreated (macOS `activate`).
- **Main sends no user-facing text**: progress and errors cross IPC as structured keys or
  codes (e.g. `InstallProgressLabel`, `SESSION_EXPIRED`), translated by the renderer with
  i18next. Native dialogs are the exception, localised in `src/main/l10n/`.

Adding an IPC call therefore touches: a handler in `src/main/services/**`, the bridge in
`src/preload/index.ts`, its type in `src/preload/index.d.ts`, and `src/shared/types/` when the
payload is shared.

## Consequences

- The renderer can render remote markdown (sanitised with `rehype-sanitize`) without exposing
  Node.
- Every feature costs three or four files; this is accepted as the price of the boundary.
- The main window still runs with `sandbox: false` (preload needs `@electron-toolkit/preload`);
  enabling the sandbox would need its own ADR.
