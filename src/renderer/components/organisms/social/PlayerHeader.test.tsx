import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { useNavigationStore } from '@stores/navigation'
import type { PlayerProfile } from '@shared/types/social'
import { membership, rank, seedSocial } from '../../../test/seedSocial'
import PlayerHeader from './PlayerHeader'

const profile: PlayerProfile = {
  id: 'p1',
  name: 'Kira',
  status: 'mission',
  faction: 'Free traders',
  role: 'Pilot',
  reputation: 0,
  playtimeHours: 0,
  memberSince: '2026-10-01T00:00:00.000Z',
  corporations: [],
  politics: []
}

describe('PlayerHeader', () => {
  it('shows the system of a friend in mission and the friend badge', async () => {
    seedSocial({ friends: [{ id: 'p1', name: 'Kira', status: 'mission', system: 'Tarsis' }] })
    render(<PlayerHeader profile={profile} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Kira' })).toBeInTheDocument()
    expect(await screen.findByText('In mission • Tarsis')).toBeInTheDocument()
    expect(screen.getByText('Free traders • Pilot')).toBeInTheDocument()
    expect(screen.getByText('Friend')).toBeInTheDocument()
  })

  it('shows the plain status of a stranger, with the add action', () => {
    seedSocial({})
    render(<PlayerHeader profile={profile} />)
    expect(screen.getByText('In mission')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Send a friend request to Kira' })
    ).toBeInTheDocument()
  })

  it("offers to edit the profile on the player's own page", async () => {
    seedSocial({ selfId: 'p1' })
    render(<PlayerHeader profile={profile} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Edit my profile' }))
    expect(useNavigationStore.getState()).toMatchObject({
      currentView: 'profileEdit',
      subject: { id: 'p1' }
    })
    expect(screen.queryByText('You')).not.toBeInTheDocument()
  })

  it('shows the relation under the name and full-size actions only', async () => {
    seedSocial({
      friends: [{ id: 'p1', name: 'Kira', status: 'online' }],
      memberships: [
        membership({ id: 'c9', ticker: 'GRT', rank: rank({ permissions: ['invite'] }) })
      ]
    })
    render(<PlayerHeader profile={profile} />)
    const invite = await screen.findByRole('button', { name: 'Invite to Nova' })
    expect(invite).toHaveClass('h-9')
    expect(screen.getByText('Friend').closest('h1, div')).not.toContainElement(invite)
    expect(screen.queryByRole('button', { name: /friend request/ })).not.toBeInTheDocument()
  })

  it('shows an invitation already sent instead of offering it again', async () => {
    seedSocial({
      memberships: [
        membership({ id: 'c9', ticker: 'GRT', rank: rank({ permissions: ['invite'] }) })
      ]
    })
    vi.mocked(window.api.socialGetOrganisationRequests).mockResolvedValue({
      ok: true,
      data: [{ id: 1, kind: 'invitation', player: { id: 'p1', name: 'Kira' } }]
    })
    render(<PlayerHeader profile={profile} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Invited to Nova' }))
    expect(screen.queryByRole('button', { name: 'Invite to Nova' })).not.toBeInTheDocument()
    expect(useNavigationStore.getState()).toMatchObject({
      currentView: 'organisation',
      subject: { id: 'c9' }
    })
  })
})
