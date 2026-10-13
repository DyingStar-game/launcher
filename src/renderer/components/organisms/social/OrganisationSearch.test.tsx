import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { useNavigationStore } from '@stores/navigation'
import { membership, seedSocial } from '../../../test/seedSocial'
import OrganisationSearch from './OrganisationSearch'

const nova = { id: 'c1', name: 'Nova', ticker: 'NOVA', members: 12, recruitment: 'open' as const }
const helix = { id: 'c2', name: 'Helix', ticker: 'HLX', members: 4, recruitment: 'apply' as const }

describe('OrganisationSearch', () => {
  it('asks for 2 characters before searching', async () => {
    seedSocial({})
    render(<OrganisationSearch />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Organization name or tag' }), 'n')
    expect(screen.getByText('Type at least 2 characters to search.')).toBeInTheDocument()
    expect(window.api.socialSearchOrganisations).not.toHaveBeenCalled()
  })

  it('lists the organisations found while typing, with their join action', async () => {
    seedSocial({ memberships: [membership({ id: 'c1' })] })
    vi.mocked(window.api.socialSearchOrganisations).mockResolvedValue({
      ok: true,
      data: [nova, helix]
    })
    render(<OrganisationSearch />)
    await userEvent.type(screen.getByRole('textbox'), 'nov')

    expect(await screen.findByText('12 members')).toBeInTheDocument()
    expect(window.api.socialSearchOrganisations).toHaveBeenCalledOnce()
    expect(window.api.socialSearchOrganisations).toHaveBeenCalledWith('universe-testing', 'nov')
    expect(screen.getByText('Member')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Join organization Helix' })).toHaveTextContent(
      'Apply'
    )
  })

  it('says when no organisation matches', async () => {
    seedSocial({})
    vi.mocked(window.api.socialSearchOrganisations).mockResolvedValue({ ok: true, data: [] })
    render(<OrganisationSearch />)
    await userEvent.type(screen.getByRole('textbox'), 'zzz')
    expect(await screen.findByText('No organization found.')).toBeInTheDocument()
  })

  it('opens the sheet of a found organisation', async () => {
    seedSocial({})
    vi.mocked(window.api.socialSearchOrganisations).mockResolvedValue({ ok: true, data: [nova] })
    render(<OrganisationSearch />)
    await userEvent.type(screen.getByRole('textbox'), 'nov')
    await userEvent.click(await screen.findByRole('button', { name: 'Open the organization Nova' }))
    expect(useNavigationStore.getState().currentView).toBe('organisation')
  })
})
