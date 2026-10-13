import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import type { PlayerProfile } from '@shared/types/social'
import { membership, seedSocial } from '../../../test/seedSocial'
import InviteToOrganisation from './InviteToOrganisation'

const player: PlayerProfile = {
  id: 'p1',
  name: 'Kira',
  status: 'online',
  reputation: 0,
  playtimeHours: 0,
  memberSince: '2026-10-01T00:00:00.000Z',
  corporations: [],
  politics: []
}

describe('InviteToOrganisation', () => {
  it('invites to the one organisation given', async () => {
    seedSocial({})
    vi.mocked(window.api.socialInviteToOrganisation).mockResolvedValue({
      ok: true,
      data: 'invited'
    })
    render(<InviteToOrganisation player={player} organisations={[membership({ id: 'c1' })]} />)
    await userEvent.click(screen.getByRole('button', { name: 'Invite to Nova' }))
    await waitFor(() =>
      expect(window.api.socialInviteToOrganisation).toHaveBeenCalledWith(
        'universe-testing',
        'c1',
        'p1'
      )
    )
  })

  it('offers a menu when several organisations are given', async () => {
    seedSocial({})
    render(
      <InviteToOrganisation
        player={player}
        organisations={[
          membership({ id: 'c1' }),
          membership({ id: 'c3', name: 'Orion', ticker: 'ORI' })
        ]}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Invite to an organization' }))
    expect(await screen.findByRole('menuitem', { name: 'Orion [ORI]' })).toBeInTheDocument()
  })

  it('explains a refusal', async () => {
    seedSocial({})
    vi.mocked(window.api.socialInviteToOrganisation).mockResolvedValue({
      ok: false,
      error: 'alreadyMemberOrInvited'
    })
    render(<InviteToOrganisation player={player} organisations={[membership({ id: 'c1' })]} />)
    await userEvent.click(screen.getByRole('button', { name: 'Invite to Nova' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('already invited')
  })

  it('shows nothing without an organisation', () => {
    seedSocial({})
    const { container } = render(<InviteToOrganisation player={player} organisations={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
