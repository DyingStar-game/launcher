import { describe, expect, it } from 'vitest'
import { playerRelation } from './playerRelation'

const social = {
  selfId: 'me',
  friends: [{ id: 'friend', name: 'Aurel', status: 'online' as const }],
  incoming: [{ id: 1, playerId: 'asks-me', name: 'Zed' }],
  outgoing: [{ id: 2, playerId: 'asked', name: 'Mira' }]
}

describe('playerRelation', () => {
  it.each([
    ['me', 'self'],
    ['friend', 'friend'],
    ['asks-me', 'incoming'],
    ['asked', 'outgoing'],
    ['stranger', 'none']
  ] as const)('%s → %s', (playerId, expected) => {
    expect(playerRelation(playerId, social)).toBe(expected)
  })
})
