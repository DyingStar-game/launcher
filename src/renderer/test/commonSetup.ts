import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import i18n from '@i18n'
import { useNavigationStore } from '@stores/navigation'

/**
 * Setup shared by component tests (jsdom) and rendering tests (browser): English UI strings, DOM
 * cleanup after each test, and a `window.api` whose every method is a mock resolving to
 * `undefined` (stores call it on import).
 */
void i18n.changeLanguage('en')

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
