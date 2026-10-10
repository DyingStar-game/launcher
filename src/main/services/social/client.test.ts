import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('electron-log', () => ({ default: { warn: vi.fn() } }))
vi.mock('../../config/api', () => ({ getSocialBase: vi.fn() }))
vi.mock('../auth', () => ({ loadFreshAccessToken: vi.fn(), invalidateSession: vi.fn() }))

import { getSocialBase } from '../../config/api'
import { invalidateSession, loadFreshAccessToken } from '../auth'
import { socialRequest } from './client'

const BASE = 'https://services.test/social'

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  vi.mocked(getSocialBase).mockReturnValue(BASE)
  vi.mocked(loadFreshAccessToken).mockResolvedValue({ token: 'token-1' })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetAllMocks()
})

describe('socialRequest', () => {
  it('is unavailable without a base URL, without calling the network', async () => {
    vi.mocked(getSocialBase).mockReturnValue(null)
    expect(await socialRequest('universe', 'load', 'GET', '/me')).toEqual({
      ok: false,
      error: 'unavailable'
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports a player who is not signed in', async () => {
    vi.mocked(loadFreshAccessToken).mockResolvedValue({ error: 'notSignedIn' })
    expect(await socialRequest('universe-testing', 'load', 'GET', '/me')).toEqual({
      ok: false,
      error: 'notSignedIn'
    })
  })

  it('sends the bearer token and JSON body, returns the JSON response', async () => {
    fetchMock.mockResolvedValue(json(201, { status: 'pending' }))
    const res = await socialRequest('universe-testing', 'addFriend', 'POST', '/friends/requests', {
      playerId: 'p1'
    })
    expect(res).toEqual({ ok: true, data: { status: 'pending' } })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${BASE}/api/friends/requests`)
    expect(init?.headers).toMatchObject({
      Authorization: 'Bearer token-1',
      'Content-Type': 'application/json'
    })
    expect(init?.body).toBe('{"playerId":"p1"}')
  })

  it('refreshes the token once after a 401 and retries', async () => {
    vi.mocked(loadFreshAccessToken)
      .mockResolvedValueOnce({ token: 'stale' })
      .mockResolvedValueOnce({ token: 'fresh' })
    fetchMock.mockResolvedValueOnce(json(401, { error: 'UNAUTHORIZED' }))
    fetchMock.mockResolvedValueOnce(json(200, { ok: 1 }))

    expect(await socialRequest('universe-testing', 'load', 'GET', '/me')).toEqual({
      ok: true,
      data: { ok: 1 }
    })
    expect(loadFreshAccessToken).toHaveBeenLastCalledWith('universe-testing', true)
    expect(fetchMock.mock.calls[1][1]?.headers).toMatchObject({ Authorization: 'Bearer fresh' })
    expect(invalidateSession).not.toHaveBeenCalled()
  })

  it('ends the session when the refreshed token is refused too', async () => {
    fetchMock.mockResolvedValue(json(401, { error: 'UNAUTHORIZED' }))
    expect(await socialRequest('universe-testing', 'load', 'GET', '/me')).toEqual({
      ok: false,
      error: 'sessionExpired'
    })
    expect(invalidateSession).toHaveBeenCalledWith('universe-testing')
  })

  it('maps a network failure to unavailable', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))
    expect(await socialRequest('universe-testing', 'load', 'GET', '/me')).toEqual({
      ok: false,
      error: 'unavailable'
    })
  })

  it('maps service errors per action', async () => {
    fetchMock.mockResolvedValue(json(409, { error: 'CONFLICT', message: 'Already friends' }))
    expect(
      await socialRequest('universe-testing', 'addFriend', 'POST', '/friends/requests', {})
    ).toEqual({ ok: false, error: 'alreadyFriendsOrPending' })
  })

  it('resolves 204 to no data', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    expect(
      await socialRequest('universe-testing', 'removeFriend', 'DELETE', '/friends/p1')
    ).toEqual({ ok: true, data: undefined })
  })
})
