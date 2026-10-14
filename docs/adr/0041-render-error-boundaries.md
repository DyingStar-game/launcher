# 0041. Render errors stay in their zone (error boundaries)

- **Status:** Accepted
- **Date:** 2026-10-14
- **Deciders:** maintainer
- **Scope:** Renderer root (`main.tsx`, `App.tsx`), `atoms/ErrorBoundary`,
  `molecules/RenderErrorNotice`
- **Builds on:** [ADR 0011](./0011-atomic-design.md) (atomic design),
  [ADR 0034](./0034-two-header-rows.md) (header rows),
  [ADR 0040](./0040-changelog-types-and-areas.md) (changelog checked in main)

## Context

Launcher 1.0.0 read the changelog JSON without checking it. When the changelog repository moved
`global.json` to version 2, a renderer function read a field that was no longer there, the error
went up to the React root and React unmounted the whole tree: a black window, without the
launcher update notice that would have told players a fixed version was out (the launcher has no
automatic update). ADR 0040 checks the changelog in main, but any other render error — another
remote JSON, a store shape, a bug — would still blank the whole window.

## Options considered

1. **Check every remote payload in main only.** Needed anyway (ADR 0040), but it does not cover
   bugs in the renderer itself.
2. **React error boundaries around each zone.** A render error replaces only its zone with a
   message; the rest of the launcher keeps working. A small class component, no dependency.
3. **`react-error-boundary`.** The same, with more options than we need, as a new dependency.

## Decision

We take option 2.

- `atoms/ErrorBoundary` (class component, the only way React offers) renders its `fallback`
  instead of its children once one of them throws while rendering, logs the error to the console,
  and gives the fallback a `reset` that renders the children again.
- **The page** (`App`) sits in a boundary keyed like the page: navigating to another page mounts
  it afresh. Its fallback is `RenderErrorNotice` ("This part of the launcher could not be
  displayed.", **Try again** re-rendering the page), in the page area, under both header rows.
- **Each header row** (top bar, universe bar) sits in its own boundary, whose fallback is empty:
  a broken row disappears instead of taking the page with it.
- **The root** (`main.tsx`) has a last-resort boundary around `App`, whose fallback is
  `RenderErrorNotice` with **Try again** reloading the window.
- Errors in event handlers and promises are not render errors: they keep going through toasts
  and the stores' error states.

## Consequences

- A remote payload the launcher misreads now breaks one zone at most, and the top bar (window
  buttons, launcher update) survives an error in the page.
- An empty top-bar fallback leaves a frameless window without its buttons; the page still works
  and the OS can close the window. A fallback bar with the window buttons can come later.
- New zones (a sidebar that loads data of its own…) can get their own boundary when needed.
