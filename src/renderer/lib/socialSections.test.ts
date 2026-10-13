import { describe, expect, it } from 'vitest'
import { pendingCounts } from './socialSections'

describe('pendingCounts', () => {
  it('counts friend requests, invitations and applications to answer', () => {
    const organisation = { id: 'c1', name: 'Nova', ticker: 'NOVA' }
    expect(
      pendingCounts({
        incoming: [{ id: 1, playerId: 'p1', name: 'Kira' }],
        invitations: [{ id: 2, organisation }],
        receivedApplications: [
          {
            organisation,
            applications: [
              { id: 3, player: { id: 'p2', name: 'Zed' } },
              { id: 4, player: { id: 'p3', name: 'Ana' } }
            ]
          }
        ]
      })
    ).toEqual({ friends: 1, organisations: 3 })
  })
})
