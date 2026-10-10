import { describe, expect, it } from 'vitest'
import type {
  ApiCorporation,
  ApiCorporationPage,
  ApiCorporationRequest,
  ApiCorporationRequestView,
  ApiFriend,
  ApiPublicProfile
} from '@shared/types/social'
import { createOrganisationSchema } from '@shared/schemas/social'
import {
  parseInput,
  toFriend,
  toFriendRequest,
  toMembership,
  toOrganisationMember,
  toOrganisationPendingRequest,
  toOrganisationProfile,
  toOrganisationRequest,
  toOrganisationSearchResult,
  toPlayerProfile,
  toPlayerSearchResult,
  toReceivedApplication,
  toSocialErrorCode
} from './mapping'

const friend = (patch: Partial<ApiFriend>): ApiFriend => ({
  playerId: '11111111-1111-4111-8111-111111111111',
  displayName: 'Aurel',
  avatarUrl: null,
  status: 'offline',
  location: null,
  ...patch
})

const corporation = (id: string, patch: Partial<ApiCorporation> = {}): ApiCorporation => ({
  id,
  name: `Corp ${id}`,
  ticker: id.toUpperCase(),
  recruitment: 'apply',
  memberCount: 3,
  ...patch
})

describe('toFriend', () => {
  it('keeps the star system of a friend in mission', () => {
    expect(toFriend(friend({ status: 'mission', location: { system: 'Tarsis' } }))).toEqual({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Aurel',
      status: 'mission',
      system: 'Tarsis'
    })
  })

  it('drops the location of a friend who is not in mission, keeps the avatar', () => {
    const mapped = toFriend(
      friend({ status: 'online', location: { system: 'Tarsis' }, avatarUrl: 'https://a/b.png' })
    )
    expect(mapped.system).toBeUndefined()
    expect(mapped.avatar).toBe('https://a/b.png')
  })
})

describe('toFriendRequest', () => {
  it('flattens the other player', () => {
    expect(
      toFriendRequest({
        id: 7,
        createdAt: '2026-10-10T00:00:00Z',
        player: { playerId: 'p1', displayName: 'Kira', avatarUrl: null }
      })
    ).toEqual({ id: 7, playerId: 'p1', name: 'Kira' })
  })
})

const corporationRequest = (
  id: number,
  corporationId: string,
  kind: ApiCorporationRequest['kind']
): ApiCorporationRequest => ({
  id,
  corporationId,
  kind,
  corporation: { id: corporationId, name: `Corp ${corporationId}`, ticker: 'C' }
})

describe('toMembership', () => {
  it("keeps the organisation and the player's rank", () => {
    const rank = {
      id: 4,
      name: 'Officer',
      priority: 50,
      permissions: ['recruit'],
      isCeo: false,
      isDefault: false
    }
    expect(
      toMembership({ id: 'a', name: 'Nova', ticker: 'NOVA', recruitment: 'apply', rank })
    ).toEqual({ id: 'a', name: 'Nova', ticker: 'NOVA', recruitment: 'apply', rank })
  })
})

describe('toOrganisationRequest', () => {
  it('keeps the request id and the organisation', () => {
    expect(toOrganisationRequest(corporationRequest(9, 'b', 'invitation'))).toEqual({
      id: 9,
      organisation: { id: 'b', name: 'Corp b', ticker: 'C' }
    })
  })
})

describe('toOrganisationSearchResult', () => {
  it('keeps the organisation, its member count and recruitment', () => {
    expect(toOrganisationSearchResult(corporation('a', { recruitment: 'closed' }))).toEqual({
      id: 'a',
      name: 'Corp a',
      ticker: 'A',
      members: 3,
      recruitment: 'closed'
    })
  })
})

describe('toReceivedApplication', () => {
  const application = (message: string | null): ApiCorporationRequestView => ({
    id: 12,
    corporationId: 'a',
    kind: 'application',
    message,
    createdAt: '2026-10-10T00:00:00Z',
    player: { playerId: 'p1', displayName: 'Kira', avatarUrl: null }
  })

  it('keeps the applicant and their message', () => {
    expect(toReceivedApplication(application(' Hello '))).toEqual({
      id: 12,
      player: { id: 'p1', name: 'Kira' },
      message: 'Hello'
    })
  })

  it('drops an empty message', () => {
    expect(toReceivedApplication(application(''))).not.toHaveProperty('message')
    expect(toReceivedApplication(application(null))).not.toHaveProperty('message')
  })
})

describe('toPlayerSearchResult', () => {
  it('keeps id and name, and the avatar only when set', () => {
    expect(toPlayerSearchResult({ playerId: 'p1', displayName: 'Kira', avatarUrl: null })).toEqual({
      id: 'p1',
      name: 'Kira'
    })
    expect(
      toPlayerSearchResult({ playerId: 'p2', displayName: 'Noah', avatarUrl: 'https://a/n.png' })
    ).toEqual({ id: 'p2', name: 'Noah', avatar: 'https://a/n.png' })
  })
})

describe('toPlayerProfile', () => {
  const profile: ApiPublicProfile = {
    playerId: 'p1',
    displayName: 'Kira',
    avatarUrl: null,
    faction: 'Free traders',
    biography: '  ',
    role: null,
    reputation: 12,
    playtimeSeconds: 2 * 3600 + 59 * 60,
    rpSheet: { characterName: 'Kira Vel', story: '' },
    createdAt: '2026-10-01T10:00:00.000Z',
    status: 'mission',
    corporations: [{ id: 'c1', name: 'Nova Corp', ticker: 'NOVA' }],
    politics: [{ id: 'e1', type: 'commune', name: 'Haven' }]
  }

  it('keeps filled fields and drops empty ones', () => {
    const sheet = toPlayerProfile(profile)
    expect(sheet).toMatchObject({
      id: 'p1',
      name: 'Kira',
      status: 'mission',
      faction: 'Free traders',
      characterName: 'Kira Vel',
      reputation: 12,
      memberSince: '2026-10-01T10:00:00.000Z',
      corporations: [{ id: 'c1', name: 'Nova Corp', ticker: 'NOVA' }],
      politics: [{ id: 'e1', type: 'commune', name: 'Haven' }]
    })
    for (const key of ['avatar', 'biography', 'role', 'alignment', 'story']) {
      expect(sheet).not.toHaveProperty(key)
    }
  })

  it('rounds playtime down to whole hours', () => {
    expect(toPlayerProfile(profile).playtimeHours).toBe(2)
  })

  it('accepts a profile without a role-play sheet', () => {
    expect(toPlayerProfile({ ...profile, rpSheet: null })).not.toHaveProperty('characterName')
  })
})

describe('toOrganisationProfile', () => {
  const member = (
    playerId: string,
    displayName: string,
    rank: { name: string; priority: number; isCeo: boolean }
  ): ApiCorporationPage['members'][number] => ({
    playerId,
    displayName,
    avatarUrl: null,
    rank: { id: rank.priority + 1, permissions: [], isDefault: false, ...rank },
    status: 'offline'
  })
  const page: ApiCorporationPage = {
    ...corporation('n', { name: 'Nova Corp', ticker: 'NOVA', memberCount: 3 }),
    description: ' ',
    logoUrl: null,
    ceoId: 'ceo',
    createdAt: '2026-10-01T10:00:00.000Z',
    parent: { id: 'h', name: 'Holding', ticker: 'HOLD' },
    subsidiaries: [corporation('s', { memberCount: 2 })],
    subsidiaryCount: 1,
    members: [
      member('m2', 'Zed', { name: 'Member', priority: 0, isCeo: false }),
      member('ceo', 'Aurel', { name: 'CEO', priority: 100, isCeo: true }),
      member('m1', 'Kira', { name: 'Member', priority: 0, isCeo: false })
    ]
  }

  it('finds the CEO among the listed members', () => {
    expect(toOrganisationProfile(page).ceo).toEqual({ id: 'ceo', name: 'Aurel' })
    expect(toOrganisationProfile(page)).not.toHaveProperty('memberList')
  })

  it('maps a member to its rank name and presence', () => {
    expect(toOrganisationMember(page.members[1])).toEqual({
      id: 'ceo',
      name: 'Aurel',
      rank: 'CEO',
      rankId: 101,
      rankPriority: 100,
      isCeo: true,
      status: 'offline'
    })
  })

  it('keeps parent and subsidiaries, drops an empty description', () => {
    const sheet = toOrganisationProfile(page)
    expect(sheet).toMatchObject({
      name: 'Nova Corp',
      ticker: 'NOVA',
      members: 3,
      recruitment: 'apply',
      parent: { id: 'h', name: 'Holding', ticker: 'HOLD' },
      subsidiaries: [{ id: 's', name: 'Corp s', ticker: 'S', members: 2 }],
      subsidiaryCount: 1
    })
    expect(sheet).not.toHaveProperty('description')
    expect(sheet).not.toHaveProperty('logo')
  })

  it('has no CEO when they are not among the listed members', () => {
    expect(toOrganisationProfile({ ...page, ceoId: 'elsewhere' })).not.toHaveProperty('ceo')
  })
})

describe('toSocialErrorCode', () => {
  it.each([
    [401, undefined, 'load', 'sessionExpired'],
    [403, 'SANCTIONED', 'addFriend', 'sanctioned'],
    [503, undefined, 'load', 'unavailable'],
    [400, 'INVALID_TARGET', 'addFriend', 'invalidTarget'],
    [400, 'VALIDATION_ERROR', 'createOrganisation', 'invalidInput'],
    [409, 'BLOCKED', 'addFriend', 'blocked'],
    [409, 'CONFLICT', 'addFriend', 'alreadyFriendsOrPending'],
    [409, 'CONFLICT', 'createOrganisation', 'nameOrTickerTaken'],
    [409, 'CONFLICT', 'joinOrganisation', 'alreadyMemberOrPending'],
    [403, 'FORBIDDEN', 'joinOrganisation', 'recruitmentClosed'],
    [404, 'NOT_FOUND', 'addFriend', 'playerNotFound'],
    [400, 'VALIDATION_ERROR', 'searchPlayers', 'invalidInput'],
    [404, 'NOT_FOUND', 'viewPlayer', 'playerNotFound'],
    [404, 'NOT_FOUND', 'viewOrganisation', 'organisationNotFound'],
    [404, 'NOT_FOUND', 'answerRequest', 'unknown'],
    [404, 'NOT_FOUND', 'answerInvitation', 'requestNotFound'],
    [404, 'NOT_FOUND', 'answerApplication', 'requestNotFound'],
    [403, 'FORBIDDEN', 'answerApplication', 'forbidden'],
    [409, 'CONFLICT', 'answerApplication', 'alreadyMember'],
    [409, 'CONFLICT', 'updateOrganisation', 'nameOrTickerTaken'],
    [409, 'CONFLICT', 'invite', 'alreadyMemberOrInvited'],
    [409, 'CONFLICT', 'manageRanks', 'rankNameTaken'],
    [403, 'FORBIDDEN', 'manageMembers', 'forbidden'],
    [403, 'FORBIDDEN', 'leadership', 'forbidden'],
    [404, 'NOT_FOUND', 'viewRequests', 'organisationNotFound'],
    [403, 'FORBIDDEN', 'answerRequest', 'unknown']
  ] as const)('%i %s on %s → %s', (status, code, action, expected) => {
    expect(toSocialErrorCode(status, code, action)).toBe(expected)
  })
})

describe('parseInput', () => {
  it('returns the parsed payload', () => {
    expect(parseInput(createOrganisationSchema, { name: ' Nova ', ticker: 'nova' })).toEqual({
      ok: true,
      data: { name: 'Nova', ticker: 'NOVA' }
    })
  })

  it('refuses a payload the form would not send', () => {
    expect(parseInput(createOrganisationSchema, { name: 'Nova', ticker: 'N' })).toEqual({
      ok: false,
      error: 'invalidInput'
    })
    expect(parseInput(createOrganisationSchema, 'Nova')).toEqual({
      ok: false,
      error: 'invalidInput'
    })
  })
})

describe('toOrganisationPendingRequest', () => {
  it('keeps the kind, the player and a written message', () => {
    expect(
      toOrganisationPendingRequest({
        id: 4,
        corporationId: 'c',
        kind: 'invitation',
        message: '  ',
        createdAt: '2026-10-10T00:00:00Z',
        player: { playerId: 'p1', displayName: 'Kira', avatarUrl: null }
      })
    ).toEqual({ id: 4, kind: 'invitation', player: { id: 'p1', name: 'Kira' } })
  })
})
