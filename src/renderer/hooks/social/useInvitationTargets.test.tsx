import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '../../test/render'
import type { PlayerProfile } from '@shared/types/social'
import { membership, rank, seedSocial } from '../../test/seedSocial'
import { useInvitationTargets } from './useInvitationTargets'

const player: PlayerProfile = {
  id: 'p1',
  name: 'Kira',
  status: 'online',
  reputation: 0,
  playtimeHours: 0,
  memberSince: '2026-10-01T00:00:00.000Z',
  corporations: [{ id: 'c4', name: 'Helix', ticker: 'HLX' }],
  politics: []
}
const inviter = rank({ permissions: ['invite'] })

describe('useInvitationTargets', () => {
  it('splits the organisations that may invite by whether they already did', async () => {
    seedSocial({
      memberships: [
        membership({ id: 'c1', rank: inviter }),
        membership({ id: 'c2', rank: inviter }),
        membership({ id: 'c3' }),
        membership({ id: 'c4', rank: inviter })
      ]
    })
    vi.mocked(window.api.socialGetOrganisationRequests).mockImplementation(async (_env, id) => ({
      ok: true,
      data:
        id === 'c2'
          ? [{ id: 9, kind: 'invitation', player: { id: 'p1', name: 'Kira' } }]
          : [{ id: 8, kind: 'application', player: { id: 'p1', name: 'Kira' } }]
    }))
    const { result } = renderHook(() => useInvitationTargets(player))
    await waitFor(() => expect(result.current.invited).toHaveLength(1))
    expect(result.current.pending).toBe(false)
    expect(result.current.invitable.map((m) => m.id)).toEqual(['c1'])
    expect(result.current.invited.map((m) => m.id)).toEqual(['c2'])
    // c3: no right to invite; c4: the player is already a member
    expect(window.api.socialGetOrganisationRequests).toHaveBeenCalledTimes(2)
  })
})
