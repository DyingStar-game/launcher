import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { membership, organisationRequest, rank, seedSocial } from '../../../test/seedSocial'
import OrganisationsSection from './OrganisationsSection'

describe('OrganisationsSection', () => {
  it('lists my organisations with my rank, and opens the create form', async () => {
    seedSocial({ memberships: [membership({ rank: rank({ name: 'Officer' }) })] })
    render(<OrganisationsSection tab="mine" onTabChange={vi.fn()} />)
    expect(await screen.findByText('Nova')).toBeInTheDocument()
    expect(screen.getByText('Officer')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Create org' }))
    expect(screen.getByRole('textbox', { name: 'Organization name' })).toBeInTheDocument()
  })

  it('shows the organisation search on Find', async () => {
    seedSocial({})
    render(<OrganisationsSection tab="find" onTabChange={vi.fn()} />)
    expect(
      await screen.findByRole('textbox', { name: 'Organization name or tag' })
    ).toBeInTheDocument()
  })

  it('answers the applications received by an organisation the player recruits for', async () => {
    seedSocial({
      receivedApplications: [
        {
          organisation: { id: 'c1', name: 'Nova', ticker: 'NOVA' },
          applications: [{ id: 9, player: { id: 'p1', name: 'Kira' }, message: 'Let me in' }]
        }
      ]
    })
    vi.mocked(window.api.socialAnswerOrganisationRequest).mockResolvedValue({
      ok: true,
      data: undefined
    })
    render(<OrganisationsSection tab="requests" onTabChange={vi.fn()} />)
    expect(await screen.findByText('Applications to Nova [NOVA]')).toBeInTheDocument()
    expect(screen.getByText('Let me in')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Requests.*1 request waiting/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Accept the application of Kira' }))
    expect(window.api.socialAnswerOrganisationRequest).toHaveBeenCalledWith(
      'universe-testing',
      'c1',
      9,
      true
    )
    await userEvent.click(screen.getByRole('button', { name: 'Decline the application of Kira' }))
    expect(window.api.socialAnswerOrganisationRequest).toHaveBeenLastCalledWith(
      'universe-testing',
      'c1',
      9,
      false
    )
  })

  it('answers invitations and withdraws applications', async () => {
    seedSocial({
      invitations: [organisationRequest(4, 'c1', 'Nova')],
      applications: [organisationRequest(5, 'c2', 'Helix')]
    })
    vi.mocked(window.api.socialAnswerOrganisationInvitation).mockResolvedValue({
      ok: true,
      data: undefined
    })
    render(<OrganisationsSection tab="requests" onTabChange={vi.fn()} />)
    expect(
      await screen.findByRole('tab', { name: /Requests.*1 request waiting/ })
    ).toBeInTheDocument()
    await userEvent.click(
      await screen.findByRole('button', { name: 'Accept the invitation from Nova' })
    )
    expect(window.api.socialAnswerOrganisationInvitation).toHaveBeenCalledWith(
      'universe-testing',
      4,
      true
    )
    await userEvent.click(screen.getByRole('button', { name: 'Withdraw the application to Helix' }))
    expect(window.api.socialAnswerOrganisationInvitation).toHaveBeenCalledWith(
      'universe-testing',
      5,
      false
    )
  })

  it('says when no invitation or application waits', async () => {
    seedSocial({})
    render(<OrganisationsSection tab="requests" onTabChange={vi.fn()} />)
    expect(await screen.findByText('No pending invitation or application.')).toBeInTheDocument()
  })
})
