import { describe, expect, it } from 'vitest'
import type { ApiCorporation, ApiFriend } from '@shared/types/social'
import {
  toFriend,
  toFriendRequest,
  toOrganisations,
  toPlayerSearchResult,
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

describe('toOrganisations', () => {
  it('flags memberships and pending applications, not invitations', () => {
    const orgas = toOrganisations(
      [corporation('a'), corporation('b'), corporation('c', { recruitment: 'closed' })],
      new Set(['a']),
      [
        { id: 1, corporationId: 'b', kind: 'application' },
        { id: 2, corporationId: 'c', kind: 'invitation' }
      ]
    )
    expect(orgas.map((o) => [o.id, o.isMember, o.applicationPending])).toEqual([
      ['a', true, false],
      ['b', false, true],
      ['c', false, false]
    ])
    expect(orgas[0]).toMatchObject({ name: 'Corp a', ticker: 'A', members: 3 })
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
    [404, 'NOT_FOUND', 'answerRequest', 'unknown'],
    [403, 'FORBIDDEN', 'answerRequest', 'unknown']
  ] as const)('%i %s on %s → %s', (status, code, action, expected) => {
    expect(toSocialErrorCode(status, code, action)).toBe(expected)
  })
})
