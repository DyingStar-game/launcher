---
name: verify-ui
description: Measure a renderer change's rendering (layout, alignment, breakpoints, hover/focus states, inherited colours) with a rendering test in headless Chromium. Use when a change to a component, the navbar, a page or the styles affects layout or a state that jsdom tests cannot see.
---

# Verify a UI change with a rendering test

Component tests (jsdom) check behaviour only. When a change's rendering depends on layout, a
breakpoint or a state, it is **measured** (ADR 0033): a `*.browser.test.tsx` next to the component
renders it in headless Chromium with the real Tailwind CSS, and asserts what jsdom cannot see.
Measuring gives a pass / fail, not screenshots to read.

Worth a test: a column's width or an alignment, the burger menu below 1400 px, a colour inherited
from a parent, a hover or focus state, a generated selector. Not worth one: restating a class
(`text-xs` is 12 px, `bg-ds-surface` is that colour); it breaks on every intended change.

## 1. Write the test

`Component.browser.test.tsx` next to `Component.tsx`, rendered with `test/render` as in the jsdom
tests (stores, `window.api` mocks and `seedSocial` work the same).

```tsx
import { page, userEvent } from 'vitest/browser'

const style = (el: Element): CSSStyleDeclaration => getComputedStyle(el)

it('draws its icon buttons 36 px high, in grey by default', () => {
  render(<Navbar />)
  const button = screen.getByRole('button', { name: 'Minimize' })
  expect(button.getBoundingClientRect().height).toBe(36)
  expect(style(button).color).toBe('rgb(107, 107, 128)')
})
```

- **Measure, don't eyeball**: `getBoundingClientRect()` (size, alignment, spacing: compare to a
  sibling rather than hardcode a position), `getComputedStyle()` (colour, padding, cursor,
  `getComputedStyle(el, '::before')` for a pseudo-element), `getBBox()` (an icon's drawing).
- Theme colours compute to `rgb()`: `ds-surface` `rgb(22, 22, 31)`, `ds-border`
  `rgb(42, 42, 58)`, `ds-muted` `rgb(107, 107, 128)`. Tailwind's palette computes to `oklch()`:
  compare with a reference element instead.
- **Breakpoints**: the viewport is 1400 × 900 (full navbar). `await page.viewport(1200, 900)` for
  the burger menu (below 1400 px), `799` for the universe switch in the menu; restore it in an
  `afterEach`.
- **Real input** (`:hover`, `:focus-visible`, tooltips, Radix menus opening on `pointerdown`):
  `userEvent` from `vitest/browser` drives Playwright's mouse and keyboard. Style changes are
  async: `await expect.poll(() => style(el).borderTopColor).not.toBe(…)`.
- **Loading states**: make the `window.api` mock (or the query) never resolve, then assert the
  skeleton after its 150 ms delay with `expect.poll`.

## 2. Run it

```bash
make pnpm test src/renderer/components/organisms/layout/Navbar.browser.test.tsx
make pnpm test ARGS="--project browser"   # every rendering test
```

On a failure, Vitest saves a screenshot under `.vitest/attachments/` (ignored by Git). Read the
assertion first; open the screenshot only when the numbers do not explain the failure.

## 3. What still needs the real launcher

The frameless window, IPC with main, sign-in and sounds are outside the renderer: check those by
running `make dev` (`PLATFORM=x11|wayland`), in its own process group so it can be stopped
(`setsid make dev … & kill -- -$!`; never `pkill -f`, which also matches the calling shell). Ask
the maintainer before doing so: reading screenshots is costly.

## 4. Report

Say what was measured and what could not be, with the values. Keep the rendering tests: they
are the regression check.
