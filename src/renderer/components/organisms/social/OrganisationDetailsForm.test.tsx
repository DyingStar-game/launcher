import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import type { OrganisationProfile } from '@shared/types/social'
import { seedSocial } from '../../../test/seedSocial'
import { Toaster } from '@components/ui/sonner'
import OrganisationDetailsForm from './OrganisationDetailsForm'

const organisation: OrganisationProfile = {
  id: 'c1',
  name: 'Nova Corp',
  ticker: 'NOVA',
  description: 'We fly [b]far[/b].',
  recruitment: 'open',
  members: 3,
  createdAt: '2026-10-01T00:00:00.000Z',
  subsidiaries: [],
  subsidiaryCount: 0
}

describe('OrganisationDetailsForm', () => {
  it('fills the fields with the organisation, Save waiting for a change', () => {
    seedSocial({})
    render(<OrganisationDetailsForm organisation={organisation} />)
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Nova Corp')
    expect(screen.getByRole('textbox', { name: /Tag/ })).toHaveValue('NOVA')
    expect(
      screen.getByRole('textbox', { name: 'Description' }).querySelector('strong')
    ).toHaveTextContent('far')
    expect(screen.getByRole('radio', { name: 'Open recruitment' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('sends only what changed, and says it is saved', async () => {
    seedSocial({})
    vi.mocked(window.api.socialUpdateOrganisation).mockResolvedValue({ ok: true, data: undefined })
    render(
      <>
        <OrganisationDetailsForm organisation={organisation} />
        <Toaster />
      </>
    )
    await userEvent.clear(screen.getByRole('textbox', { name: /Tag/ }))
    await userEvent.type(screen.getByRole('textbox', { name: /Tag/ }), 'nv')
    await userEvent.click(screen.getByRole('radio', { name: 'Not recruiting' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(window.api.socialUpdateOrganisation).toHaveBeenCalledWith('universe-testing', 'c1', {
        ticker: 'NV',
        recruitment: 'closed'
      })
    )
    const message = await screen.findByText('Changes saved.')
    expect(message.closest('[data-sonner-toast]')).not.toBeNull()
  })

  it('explains a taken name or tag', async () => {
    seedSocial({})
    vi.mocked(window.api.socialUpdateOrganisation).mockResolvedValue({
      ok: false,
      error: 'nameOrTickerTaken'
    })
    render(<OrganisationDetailsForm organisation={organisation} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), ' Two')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This organization name or tag is already taken.'
    )
  })
})
