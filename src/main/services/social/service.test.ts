import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiMyCorporation } from '@shared/types/social'
import { socialRequest } from './client'
import {
  answerOrganisationRequest,
  createRank,
  deleteRank,
  disbandOrganisation,
  getOrganisationRanks,
  getOrganisationRequests,
  inviteToOrganisation,
  removeMember,
  setMemberRank,
  transferOrganisation,
  updateOrganisation,
  updateRank,
  loadFriends,
  loadSocial,
  searchOrganisations,
  updateProfile
} from './service'

vi.mock('./client', () => ({ socialRequest: vi.fn() }))

const page = <T>(items: T[]): { items: T[]; total: number; limit: number; offset: number } => ({
  items,
  total: items.length,
  limit: 100,
  offset: 0
})

const membership = (id: string, permissions: string[], isCeo = false): ApiMyCorporation => ({
  id,
  name: `Corp ${id}`,
  ticker: id.toUpperCase(),
  recruitment: 'apply',
  rank: { id: 1, name: 'Rank', priority: 10, permissions, isCeo, isDefault: false }
})

/** Answers each `social` path with the given body. */
function serve(bodies: Record<string, unknown>): void {
  vi.mocked(socialRequest).mockImplementation(async (_env, _action, _method, path) => {
    const key = path.split('?')[0]
    if (!(key in bodies)) throw new Error(`unexpected ${path}`)
    return { ok: true, data: bodies[key] } as never
  })
}

describe('loadFriends', () => {
  beforeEach(() => {
    vi.mocked(socialRequest).mockReset()
  })

  it('reads the friends alone, with their presence', async () => {
    serve({
      '/friends': page([
        {
          playerId: 'p1',
          displayName: 'Kira',
          avatarUrl: null,
          status: 'mission',
          location: { system: 'Sol' }
        }
      ])
    })
    const result = await loadFriends('universe-testing')

    expect(socialRequest).toHaveBeenCalledOnce()
    expect(result).toEqual({
      ok: true,
      data: [expect.objectContaining({ id: 'p1', name: 'Kira', status: 'mission', system: 'Sol' })]
    })
  })

  it('passes the error on', async () => {
    vi.mocked(socialRequest).mockResolvedValue({ ok: false, error: 'unavailable' })
    expect(await loadFriends('universe-testing')).toEqual({ ok: false, error: 'unavailable' })
  })
})

describe('loadSocial', () => {
  beforeEach(() => {
    vi.mocked(socialRequest).mockReset()
  })

  it('loads received applications of the organisations the player recruits for only', async () => {
    serve({
      '/me': { playerId: 'me', displayName: 'Me', avatarUrl: null },
      '/friends': page([]),
      '/friends/requests': { incoming: [], outgoing: [] },
      '/me/corporations': page([
        membership('a', ['recruit']),
        membership('b', [], true),
        membership('c', ['invite'])
      ]),
      '/me/corporation/requests': page([]),
      '/corporations/a/requests': page([
        {
          id: 1,
          corporationId: 'a',
          kind: 'application',
          message: 'Hi',
          createdAt: '2026-10-10T00:00:00Z',
          player: { playerId: 'p1', displayName: 'Kira', avatarUrl: null }
        },
        {
          id: 2,
          corporationId: 'a',
          kind: 'invitation',
          message: null,
          createdAt: '2026-10-10T00:00:00Z',
          player: { playerId: 'p2', displayName: 'Zed', avatarUrl: null }
        }
      ]),
      '/corporations/b/requests': page([])
    })

    const result = await loadSocial('universe-testing')

    expect(result.ok && result.data.receivedApplications).toEqual([
      {
        organisation: { id: 'a', name: 'Corp a', ticker: 'A' },
        applications: [{ id: 1, player: { id: 'p1', name: 'Kira' }, message: 'Hi' }]
      }
    ])
    const paths = vi.mocked(socialRequest).mock.calls.map((call) => call[3])
    expect(paths).not.toContain(expect.stringContaining('/corporations/c/'))
  })

  it('fails when a received applications list cannot be loaded', async () => {
    vi.mocked(socialRequest).mockImplementation(async (_env, _action, _method, path) => {
      if (path.startsWith('/corporations/a/requests')) return { ok: false, error: 'unavailable' }
      const bodies: Record<string, unknown> = {
        '/me': { playerId: 'me', displayName: 'Me', avatarUrl: null },
        '/friends': page([]),
        '/friends/requests': { incoming: [], outgoing: [] },
        '/me/corporations': page([membership('a', ['recruit'])]),
        '/me/corporation/requests': page([])
      }
      return { ok: true, data: bodies[path.split('?')[0]] } as never
    })

    expect(await loadSocial('universe-testing')).toEqual({ ok: false, error: 'unavailable' })
  })
})

describe('searchOrganisations', () => {
  beforeEach(() => {
    vi.mocked(socialRequest).mockReset()
  })

  it('does not search below 2 characters', async () => {
    expect(await searchOrganisations('universe-testing', ' n ')).toEqual({ ok: true, data: [] })
    expect(socialRequest).not.toHaveBeenCalled()
  })

  it('searches the first 20 by name or tag', async () => {
    serve({
      '/corporations': page([
        { id: 'a', name: 'Nova', ticker: 'NOVA', recruitment: 'open', memberCount: 4 }
      ])
    })
    const result = await searchOrganisations('universe-testing', ' nov ')
    expect(result).toEqual({
      ok: true,
      data: [{ id: 'a', name: 'Nova', ticker: 'NOVA', members: 4, recruitment: 'open' }]
    })
    expect(vi.mocked(socialRequest).mock.calls[0][3]).toBe('/corporations?limit=20&search=nov')
  })
})

describe('answerOrganisationRequest', () => {
  it('accepts or declines on the organisation side', async () => {
    vi.mocked(socialRequest).mockReset().mockResolvedValue({ ok: true, data: undefined })
    await answerOrganisationRequest('universe-testing', 'a', 7, true)
    await answerOrganisationRequest('universe-testing', 'a', 7, false)
    expect(vi.mocked(socialRequest).mock.calls.map((call) => [call[1], call[2], call[3]])).toEqual([
      ['answerApplication', 'POST', '/corporations/a/requests/7/accept'],
      ['answerApplication', 'POST', '/corporations/a/requests/7/decline']
    ])
  })
})

describe('updateProfile', () => {
  beforeEach(() => {
    vi.mocked(socialRequest).mockReset()
  })

  it('patches the profile with the parsed fields only', async () => {
    vi.mocked(socialRequest).mockResolvedValue({ ok: true, data: {} })
    const result = await updateProfile('universe-testing', {
      faction: ' Traders ',
      displayName: 'Hacker'
    })
    expect(result).toEqual({ ok: true, data: undefined })
    expect(vi.mocked(socialRequest).mock.calls[0]).toEqual([
      'universe-testing',
      'updateProfile',
      'PATCH',
      '/me',
      { faction: 'Traders' }
    ])
  })

  it('never sends a patch the form would not produce', async () => {
    expect(await updateProfile('universe-testing', {})).toEqual({
      ok: false,
      error: 'invalidInput'
    })
    expect(socialRequest).not.toHaveBeenCalled()
  })
})

describe('organisation management', () => {
  beforeEach(() => {
    vi.mocked(socialRequest).mockReset().mockResolvedValue({ ok: true, data: {} })
  })

  const calls = (): unknown[][] =>
    vi.mocked(socialRequest).mock.calls.map((call) => [call[1], call[2], call[3], call[4]])

  it('edits the details with the parsed patch, and refuses a bad one', async () => {
    await updateOrganisation('universe-testing', 'c1', { ticker: ' nova ', logoUrl: 'x' })
    expect(calls()).toEqual([
      ['updateOrganisation', 'PATCH', '/corporations/c1', { ticker: 'NOVA' }]
    ])
    expect(await updateOrganisation('universe-testing', 'c1', { name: 'No' })).toEqual({
      ok: false,
      error: 'invalidInput'
    })
  })

  it('lists the pending requests of an organisation', async () => {
    vi.mocked(socialRequest).mockResolvedValue({
      ok: true,
      data: {
        items: [
          {
            id: 1,
            corporationId: 'c1',
            kind: 'invitation',
            message: null,
            createdAt: '2026-10-10T00:00:00Z',
            player: { playerId: 'p1', displayName: 'Kira', avatarUrl: null }
          }
        ],
        total: 1,
        limit: 100,
        offset: 0
      }
    })
    expect(await getOrganisationRequests('universe-testing', 'c1')).toEqual({
      ok: true,
      data: [{ id: 1, kind: 'invitation', player: { id: 'p1', name: 'Kira' } }]
    })
  })

  it('tells whether an invitation made the player join at once', async () => {
    vi.mocked(socialRequest).mockResolvedValueOnce({ ok: true, data: { joined: true } })
    expect(await inviteToOrganisation('universe-testing', 'c1', 'p1')).toEqual({
      ok: true,
      data: 'joined'
    })
    expect(calls()[0]).toEqual([
      'invite',
      'POST',
      '/corporations/c1/invitations',
      { playerId: 'p1' }
    ])
  })

  it('maps the ranks', async () => {
    vi.mocked(socialRequest).mockResolvedValue({
      ok: true,
      data: [{ id: 1, name: 'CEO', priority: 99, permissions: [], isCeo: true, isDefault: false }]
    })
    expect(await getOrganisationRanks('universe-testing', 'c1')).toEqual({
      ok: true,
      data: [{ id: 1, name: 'CEO', priority: 99, permissions: [], isCeo: true, isDefault: false }]
    })
  })

  it('sends members, ranks and leadership actions to their routes', async () => {
    await setMemberRank('universe-testing', 'c1', 'p1', 3)
    await removeMember('universe-testing', 'c1', 'p1')
    await createRank('universe-testing', 'c1', {
      name: 'Officer',
      priority: 40,
      permissions: ['recruit', 'economie:treasury:manage'],
      isDefault: false
    })
    await updateRank('universe-testing', 'c1', 3, { name: 'Pilot' })
    await deleteRank('universe-testing', 'c1', 3)
    await transferOrganisation('universe-testing', 'c1', 'p1')
    await disbandOrganisation('universe-testing', 'c1')
    expect(calls()).toEqual([
      ['manageMembers', 'PATCH', '/corporations/c1/members/p1', { rankId: 3 }],
      ['manageMembers', 'DELETE', '/corporations/c1/members/p1', undefined],
      [
        'manageRanks',
        'POST',
        '/corporations/c1/ranks',
        {
          name: 'Officer',
          priority: 40,
          permissions: ['recruit', 'economie:treasury:manage'],
          isDefault: false
        }
      ],
      ['manageRanks', 'PATCH', '/corporations/c1/ranks/3', { name: 'Pilot' }],
      ['manageRanks', 'DELETE', '/corporations/c1/ranks/3', undefined],
      ['leadership', 'POST', '/corporations/c1/transfer', { playerId: 'p1' }],
      ['leadership', 'DELETE', '/corporations/c1', undefined]
    ])
  })
})
