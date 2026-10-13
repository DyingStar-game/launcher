import { vi } from 'vitest'
import './commonSetup'

/**
 * Component test setup (ADR 0011): the shared setup (English strings, mocked `window.api`,
 * cleanup), silent UI sounds, and the browser APIs jsdom lacks.
 */

// jsdom cannot play audio: UI sounds are silenced.
vi.mock('@lib/sounds/engine', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return Object.fromEntries(
    Object.entries(actual).map(([k, v]) => [k, typeof v === 'function' ? vi.fn() : v])
  )
})

// Radix primitives (ADR 0016) use browser APIs jsdom lacks.
globalThis.ResizeObserver ??= class {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.setPointerCapture ??= () => {}
Element.prototype.releasePointerCapture ??= () => {}
Element.prototype.scrollIntoView ??= () => {}

// The rich text editor (ProseMirror, ADR 0030) measures the selection; jsdom lays nothing out.
const noRects = (): DOMRectList => Object.assign([], { item: () => null }) as unknown as DOMRectList
Range.prototype.getClientRects ??= noRects
Range.prototype.getBoundingClientRect ??= () => new DOMRect()
Element.prototype.getClientRects ??= noRects
document.elementFromPoint ??= () => null
