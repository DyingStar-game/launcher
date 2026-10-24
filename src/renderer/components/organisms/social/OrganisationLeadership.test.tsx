import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import type { OrganisationProfile } from '@shared/types/social'
import { useNavigationStore } from '@stores/navigation'
import { seedSocial } from '../../../test/seedSocial'
import OrganisationLeadership from './OrganisationLeadership'

const subject = { id: 'c1', env: 'universe-testing' as const }
const organisation: OrganisationProfile = {
  id: 'c1',
  name: 'Nova Corp',
  ticker: 'NOVA',
  recruitment: 'open',
  members: 2,
  createdAt: '2026-10-01T00:00:00.000Z',
  subsidiaries: [],
  subsidiaryCount: 0
}

const ona = {
  id: 'p2',
  name: 'Ona',
  rank: 'Officer',
  rankId: 2,
  rankPriority: 50,
  isCeo: false,
  status: 'offline' as const
}

function seed(...others: (typeof ona)[]): void {
  seedSocial({ selfId: 'me' })
  vi.mocked(window.api.socialGetOrganisationMembers).mockResolvedValue({
    ok: true,
    data: {
      members: [
        {
          id: 'me',
          name: 'Me',
          rank: 'CEO',
          rankId: 1,
          rankPriority: 99,
          isCeo: true,
          status: 'online'
        },
        {
          id: 'p1',
          name: 'Kira',
          rank: 'Pilot',
          rankId: 3,
          rankPriority: 10,
          isCeo: false,
          status: 'offline'
        },
        ...others
      ],
      total: 2 + others.length
    }
  })
}

describe('OrganisationLeadership', () => {
  it('names the only member who can take over, without a choice to make', async () => {
    seed()
    vi.mocked(window.api.socialTransferOrganisation).mockResolvedValue({
      ok: true,
      data: undefined
    })
    render(<OrganisationLeadership subject={subject} organisation={organisation} selfId="me" />)
    expect(await screen.findByText('Only Kira can take over the leadership.')).toBeInTheDocument()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Hand over the leadership' }))
    await userEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Hand over the leadership'
      })
    )
    await waitFor(() =>
      expect(window.api.socialTransferOrganisation).toHaveBeenCalledWith(
        'universe-testing',
        'c1',
        'p1'
      )
    )
  })

  it('hands the leadership to the member picked, after confirming', async () => {
    seed(ona)
    vi.mocked(window.api.socialTransferOrganisation).mockResolvedValue({
      ok: true,
      data: undefined
    })
    render(<OrganisationLeadership subject={subject} organisation={organisation} selfId="me" />)
    expect(screen.getByRole('button', { name: 'Hand over the leadership' })).toBeDisabled()
    // Disabled, it says why (ADR 0048)
    await userEvent.hover(screen.getByRole('button', { name: 'Hand over the leadership' }))
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Choose a successor first')
    await userEvent.click(await screen.findByRole('radio', { name: /Kira/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Hand over the leadership' }))
    await userEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Hand over the leadership'
      })
    )
    await waitFor(() =>
      expect(window.api.socialTransferOrganisation).toHaveBeenCalledWith(
        'universe-testing',
        'c1',
        'p1'
      )
    )
  })

  it('disbands only once the tag is typed, then goes back to the social page', async () => {
    seed()
    vi.mocked(window.api.socialDisbandOrganisation).mockResolvedValue({ ok: true, data: undefined })
    render(<OrganisationLeadership subject={subject} organisation={organisation} selfId="me" />)
    await userEvent.click(screen.getByRole('button', { name: 'Disband' }))
    const dialog = await screen.findByRole('alertdialog')
    const confirm = within(dialog).getByRole('button', { name: 'Disband' })
    expect(confirm).toBeDisabled()
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'Type NOVA to confirm' }),
      'nova'
    )
    await userEvent.click(confirm)
    await waitFor(() =>
      expect(window.api.socialDisbandOrganisation).toHaveBeenCalledWith('universe-testing', 'c1')
    )
    await waitFor(() => expect(useNavigationStore.getState().currentView).toBe('social'))
  })
})
