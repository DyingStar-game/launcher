import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { useNavigationStore } from '@stores/navigation'
import type { OrganisationProfile } from '@shared/types/social'
import { membership, rank, seedSocial } from '../../../test/seedSocial'
import OrganisationHeader from './OrganisationHeader'

const organisation: OrganisationProfile = {
  id: 'c1',
  name: 'Nova Corp',
  ticker: 'NOVA',
  recruitment: 'open',
  members: 3,
  createdAt: '2026-10-01T00:00:00.000Z',
  subsidiaries: [],
  subsidiaryCount: 0
}

describe('OrganisationHeader', () => {
  it('shows name, ticker, recruitment and the join action', () => {
    seedSocial({})
    render(<OrganisationHeader organisation={organisation} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Nova Corp [NOVA]')
    expect(screen.getByText('Open recruitment')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Join organization Nova Corp' })).toHaveTextContent(
      'Join'
    )
  })

  it('offers Manage to a member with a management right, and opens the page', async () => {
    seedSocial({
      memberships: [membership({ id: 'c1', rank: rank({ permissions: ['recruit'] }) })]
    })
    render(<OrganisationHeader organisation={organisation} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Manage' }))
    expect(useNavigationStore.getState()).toMatchObject({
      currentView: 'organisationManage',
      subject: { id: 'c1' }
    })
  })

  it('lets a plain member leave, after confirming', async () => {
    seedSocial({ selfId: 'me', memberships: [membership({ id: 'c1' })] })
    vi.mocked(window.api.socialRemoveMember).mockResolvedValue({ ok: true, data: undefined })
    render(<OrganisationHeader organisation={organisation} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Leave' }))
    expect(screen.queryByRole('button', { name: 'Manage' })).not.toBeInTheDocument()
    await userEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Leave' })
    )
    await waitFor(() =>
      expect(window.api.socialRemoveMember).toHaveBeenCalledWith('universe-testing', 'c1', 'me')
    )
  })

  it('never offers Leave to the CEO', async () => {
    seedSocial({ memberships: [membership({ id: 'c1', rank: rank({ isCeo: true }) })] })
    render(<OrganisationHeader organisation={organisation} />)
    expect(await screen.findByRole('button', { name: 'Manage' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Leave' })).not.toBeInTheDocument()
  })
})
