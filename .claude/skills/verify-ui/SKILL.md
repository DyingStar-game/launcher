---
name: verify-ui
description: Check a renderer change in the running launcher (layout, sizes, cursor, tooltips, menus, loading states) before calling it done. Use after any change to a component, the navbar, a page or the styles; jsdom tests do not see layout or computed styles.
---

# Verify a UI change in the running launcher

Tests (Vitest + jsdom) check behaviour only. A UI change is done when it has been looked at and
measured in the launcher itself (CLAUDE.md, "Checking a UI change").

## 1. Run it in the background, in its own process group

```bash
setsid make dev PLATFORM=x11 > /tmp/launcher-dev.log 2>&1 < /dev/null &
PGID=$!
# … checks …
kill -- -$PGID
```

- Stop it with `kill -- -<pgid>` only. `pkill -f electron` also matches the shell running the
  command and kills it.
- Window width: `VITE_WINDOW_DESIGN_WIDTH=1024 VITE_WINDOW_MIN_WIDTH=500 make dev …`. Check at
  ≥1400px, below 1400px (burger menu) and below 800px (universe switch in the menu).
- `PLATFORM=wayland` forces Wayland (the Makefile finds the WSLg socket).

## 2. Capture and measure from the main process (temporary code)

Save `src/main/index.ts`, then add after `mainWindow.webContents.once('did-finish-load', showWindow)`:

```ts
mainWindow.webContents.once('did-finish-load', () =>
  setTimeout(async () => {
    const wc = mainWindow!.webContents
    const data = await wc.executeJavaScript(`JSON.stringify(
      [...document.querySelectorAll('nav button')].map((b) => b.getBoundingClientRect().height)
    )`)
    const image = await wc.capturePage({ x: 0, y: 0, width: 1500, height: 400 })
    require('fs').writeFileSync('/tmp/launcher.png', image.toPNG())
    require('fs').writeFileSync('/tmp/launcher.json', data)
  }, 6000)
)
```

- Read the PNG to look at it; measure rather than eyeball: `getBoundingClientRect()` (sizes,
  spacing), `getComputedStyle()` (cursor, padding, animation), `getBBox()` (an icon's drawing
  inside its box).
- **Restore `src/main/index.ts` afterwards** and check `git diff --stat src/main/index.ts` is empty.

## 3. Drive it like a user

- Radix menu triggers open on `pointerdown`, not on `.click()`:
  `el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse' }))`.
- Anything that depends on the input modality (`:focus-visible`, tooltips, focus returned by a
  menu) needs real input: `wc.sendInputEvent({ type: 'mouseDown', x, y, button: 'left', clickCount: 1 })`
  (and `mouseMove`, `mouseUp`). Synthetic DOM events are not enough.
- To see a loading state, delay an IPC channel at the top of `index.ts` (temporary):

  ```ts
  const handle = ipcMain.handle.bind(ipcMain)
  ipcMain.handle = (ch, fn) =>
    handle(
      ch,
      ch.startsWith('changelog:')
        ? async (...a) => (await new Promise((r) => setTimeout(r, 5000)), fn(...a))
        : fn
    )
  ```

## 4. Report

Say what was checked on screen and what could not be (e.g. social screens need a signed-in
account), with the measurements. Leave no debug code behind.
