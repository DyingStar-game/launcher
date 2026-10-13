import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./tokenStorage', () => ({
  clearStoredTokens: vi.fn(),
  loadTokens: vi.fn(),
  storeTokens: vi.fn()
}))
vi.mock('./authWindow', () => ({
  clearAuthSession: vi.fn(() => Promise.resolve()),
  closeAuthWindow: vi.fn(),
  openAuthWindow: vi.fn()
}))
vi.mock('./keycloakClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./keycloakClient')>()),
  getKeycloakBase: vi.fn(() => 'https://kc.test/auth')
}))

import { clearStoredTokens, loadTokens } from './tokenStorage'
import { clearAuthSession } from './authWindow'
import { logout } from './flow'

const tokens = {
  access_token: 'access',
  refresh_token: 'refresh-1',
  id_token: 'id',
  expires_in: 300,
  token_type: 'Bearer'
}
const fetchMock = vi.fn<typeof fetch>()

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('logout', () => {
  it('ends the Keycloak session in the background and forgets the sign-in cookies', async () => {
    vi.stubGlobal('fetch', fetchMock.mockResolvedValue(new Response(null, { status: 204 })))
    vi.mocked(loadTokens).mockReturnValue(tokens)
    await logout('universe-testing')

    expect(clearStoredTokens).toHaveBeenCalledWith('universe-testing')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/^https:\/\/kc\.test\/auth\/realms\/.+\/protocol\/openid-connect\/logout$/)
    expect(init?.method).toBe('POST')
    expect(new URLSearchParams(String(init?.body)).get('refresh_token')).toBe('refresh-1')
    expect(clearAuthSession).toHaveBeenCalledOnce()
  })

  it('still signs out locally when Keycloak cannot be reached', async () => {
    vi.stubGlobal('fetch', fetchMock.mockRejectedValue(new Error('offline')))
    vi.mocked(loadTokens).mockReturnValue(tokens)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await logout('universe-testing')

    expect(clearStoredTokens).toHaveBeenCalledWith('universe-testing')
    expect(clearAuthSession).toHaveBeenCalledOnce()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('forgets the sign-in cookies even without stored tokens', async () => {
    vi.stubGlobal('fetch', fetchMock)
    vi.mocked(loadTokens).mockReturnValue(null)
    await logout('universe-testing')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(clearAuthSession).toHaveBeenCalledOnce()
  })
})
