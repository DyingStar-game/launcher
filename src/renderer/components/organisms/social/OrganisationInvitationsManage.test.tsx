import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { seedSocial } from '../../../test/seedSocial'
import OrganisationInvitationsManage from './OrganisationInvitationsManage'

const subject = { id: 'c1', env: 'universe-testing' as const }

describe('OrganisationInvitationsManage', () => {
  it('lists the invitations sent, not the applications, and withdraws one', async () => {
    seedSocial({})
    vi.mocked(window.api.socialGetOrganisationRequests).mockResolvedValue({
      ok: true,
      data: [
        { id: 1, kind: 'invitation', player: { id: 'p1', name: 'Kira' } },
        { id: 2, kind: 'application', player: { id: 'p2', name: 'Zed' } }
      ]
    })
    vi.mocked(window.api.socialAnswerOrganisationRequest).mockResolvedValue({
      ok: true,
      data: undefined
    })
    render(<OrganisationInvitationsManage subject={subject} />)
    expect(await screen.findByText('Kira')).toBeInTheDocument()
    expect(screen.queryByText('Zed')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Withdraw' }))
    await userEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Withdraw' })
    )
    await waitFor(() =>
      expect(window.api.socialAnswerOrganisationRequest).toHaveBeenCalledWith(
        'universe-testing',
        'c1',
        1,
        false
      )
    )
  })

  it('says when no invitation waits', async () => {
    seedSocial({})
    vi.mocked(window.api.socialGetOrganisationRequests).mockResolvedValue({ ok: true, data: [] })
    render(<OrganisationInvitationsManage subject={subject} />)
    expect(await screen.findByText(/No pending invitation/)).toBeInTheDocument()
  })
})
