import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import i18n from '@i18n'
import { useNavigationStore } from '@stores/navigation'

/**
 * Component test setup (ADR 0011): English UI strings, silent UI sounds, DOM cleanup after each
 * test, and a `window.api` whose every method is a mock resolving to `undefined` (stores call it
 * on import).
 */
void i18n.changeLanguage('en')

// jsdom cannot play audio: UI sounds are silenced.
vi.mock('@lib/sounds/engine', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return Object.fromEntries(
    Object.entries(actual).map(([k, v]) => [k, typeof v === 'function' ? vi.fn() : v])
  )
})

const api: Record<string, ReturnType<typeof vi.fn>> = {}
Object.defineProperty(window, 'api', {
  configurable: true,
  value: new Proxy(api, {
    get: (target, key: string) => (target[key] ??= vi.fn(() => Promise.resolve(undefined)))
  })
})

afterEach(() => {
  cleanup()
  useNavigationStore.getState().navigate('universe')
  for (const key of Object.keys(api)) delete api[key]
})
