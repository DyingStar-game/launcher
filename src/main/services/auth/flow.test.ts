import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./tokenStorage', () => ({
  clearStoredTokens: vi.fn(),
  loadTokens: vi.fn(),
  storeTokens: vi.fn()
}))
vi.mock('electron', () => ({ shell: { openExternal: vi.fn(() => Promise.resolve()) } }))
vi.mock('@electron-toolkit/utils', () => ({ is: { dev: false } }))
vi.mock('./authWindow', () => ({
  clearAuthSession: vi.fn(() => Promise.resolve()),
  closeAuthWindow: vi.fn(),
  openAuthWindow: vi.fn()
}))
vi.mock('./keycloakClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./keycloakClient')>()),
  getKeycloakBase: vi.fn(() => 'https://kc.test/auth')
}))

import { shell } from 'electron'
import { is } from '@electron-toolkit/utils'
import { clearAuthSession, openAuthWindow } from './authWindow'
import { APP_PROTOCOL } from '../../config/constants'
import { clearStoredTokens, loadTokens, storeTokens } from './tokenStorage'
import { cancelLogin, handleOAuthCallback, logout, setAuthEventSender, startLogin } from './flow'

const tokens = {
  access_token: 'access',
  refresh_token: 'refresh-1',
  id_token: 'id',
  expires_in: 300,
  token_type: 'Bearer'
}
const fetchMock = vi.fn<typeof fetch>()

afterEach(() => {
  is.dev = false
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

/** Opens the sign-in page and returns the `state` it was given. */
async function startAndReadState(): Promise<string> {
  await startLogin('universe-testing', null)
  const url = new URL(vi.mocked(shell.openExternal).mock.calls[0][0])
  return url.searchParams.get('state') ?? ''
}

describe('startLogin', () => {
  it('opens the Keycloak authorize URL in the system browser, with PKCE and the Discord hint', async () => {
    await startLogin('universe-testing', null)

    expect(shell.openExternal).toHaveBeenCalledOnce()
    const url = new URL(vi.mocked(shell.openExternal).mock.calls[0][0])
    expect(url.origin + url.pathname).toMatch(
      /^https:\/\/kc\.test\/auth\/realms\/.+\/protocol\/openid-connect\/auth$/
    )
    expect(url.searchParams.get('kc_idp_hint')).toBe('discord')
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect(url.searchParams.get('redirect_uri')).toMatch(/:\/\/auth\/callback$/)
  })

  it('signs in when the browser hands the callback back', async () => {
    const send = vi.fn()
    setAuthEventSender({ send })
    const state = await startAndReadState()
    const payload = Buffer.from(JSON.stringify({ sub: 'player', preferred_username: 'Nova' }))
    const idToken = `e30.${payload.toString('base64url')}.sig`
    vi.stubGlobal(
      'fetch',
      fetchMock.mockResolvedValue(Response.json({ ...tokens, id_token: idToken }))
    )

    await handleOAuthCallback(`${APP_PROTOCOL}://auth/callback?code=abc&state=${state}`)

    expect(storeTokens).toHaveBeenCalledWith('universe-testing', expect.anything())
    expect(send).toHaveBeenCalledWith(
      'auth:state-changed',
      expect.objectContaining({
        env: 'universe-testing',
        status: 'connected',
        user: expect.objectContaining({ username: 'Nova' })
      })
    )
  })

  it('refuses a callback arriving after the sign-in was cancelled', async () => {
    const send = vi.fn()
    setAuthEventSender({ send })
    const state = await startAndReadState()
    cancelLogin('universe-testing')
    vi.stubGlobal('fetch', fetchMock)

    await handleOAuthCallback(`${APP_PROTOCOL}://auth/callback?code=abc&state=${state}`)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(send).toHaveBeenCalledWith(
      'auth:state-changed',
      expect.objectContaining({ status: 'error', error: 'invalid_callback' })
    )
  })

  it('signs in in an in-app window in development, where the OS cannot route the callback', async () => {
    is.dev = true
    const send = vi.fn()
    setAuthEventSender({ send })
    await startLogin('universe-testing', null)

    expect(shell.openExternal).not.toHaveBeenCalled()
    expect(openAuthWindow).toHaveBeenCalledOnce()
    const [, url, handlers] = vi.mocked(openAuthWindow).mock.calls[0]
    expect(new URL(url).searchParams.get('kc_idp_hint')).toBe('discord')

    handlers.onAbort()
    expect(send).toHaveBeenCalledWith('auth:state-changed', {
      env: 'universe-testing',
      status: 'disconnected'
    })
  })

  it('fails when the browser cannot be opened', async () => {
    vi.mocked(shell.openExternal).mockRejectedValueOnce(new Error('no browser'))

    await expect(startLogin('universe-testing', null)).rejects.toThrow('no browser')
  })
})

describe('logout', () => {
  it('forgets the in-app window cookies in development only', async () => {
    vi.stubGlobal('fetch', fetchMock)
    vi.mocked(loadTokens).mockReturnValue(null)
    await logout('universe-testing')
    expect(clearAuthSession).not.toHaveBeenCalled()

    is.dev = true
    await logout('universe-testing')
    expect(clearAuthSession).toHaveBeenCalledOnce()
  })

  it('ends the Keycloak session in the background', async () => {
    vi.stubGlobal('fetch', fetchMock.mockResolvedValue(new Response(null, { status: 204 })))
    vi.mocked(loadTokens).mockReturnValue(tokens)
    await logout('universe-testing')

    expect(clearStoredTokens).toHaveBeenCalledWith('universe-testing')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/^https:\/\/kc\.test\/auth\/realms\/.+\/protocol\/openid-connect\/logout$/)
    expect(init?.method).toBe('POST')
    expect(new URLSearchParams(String(init?.body)).get('refresh_token')).toBe('refresh-1')
  })

  it('still signs out locally when Keycloak cannot be reached', async () => {
    vi.stubGlobal('fetch', fetchMock.mockRejectedValue(new Error('offline')))
    vi.mocked(loadTokens).mockReturnValue(tokens)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await logout('universe-testing')

    expect(clearStoredTokens).toHaveBeenCalledWith('universe-testing')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('requests nothing without stored tokens', async () => {
    vi.stubGlobal('fetch', fetchMock)
    vi.mocked(loadTokens).mockReturnValue(null)
    await logout('universe-testing')

    expect(clearStoredTokens).toHaveBeenCalledWith('universe-testing')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
