import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { membership, organisationRequest, seedSocial } from '../../../test/seedSocial'
import OrganisationAction from './OrganisationAction'

describe('OrganisationAction', () => {
  it('shows "member" for an organisation the player belongs to', async () => {
    seedSocial({ memberships: [membership({ id: 'c1' })] })
    render(<OrganisationAction id="c1" name="Nova" recruitment="open" />)
    expect(await screen.findByText('Member')).toBeInTheDocument()
  })

  it('shows a pending application', async () => {
    seedSocial({ applications: [organisationRequest(5, 'c1')] })
    render(<OrganisationAction id="c1" name="Nova" recruitment="apply" />)
    expect(await screen.findByText('Application sent')).toBeInTheDocument()
  })

  it('shows "closed" when not recruiting', () => {
    seedSocial({})
    render(<OrganisationAction id="c1" name="Nova" recruitment="closed" />)
    expect(screen.getByText('Closed')).toBeInTheDocument()
  })

  it.each([
    ['open', 'Join'],
    ['apply', 'Apply']
  ] as const)('offers "%s" recruitment as %s and joins', async (recruitment, label) => {
    seedSocial({})
    vi.mocked(window.api.socialJoinOrganisation).mockResolvedValue({ ok: true, data: 'applied' })
    render(<OrganisationAction id="c1" name="Nova" recruitment={recruitment} />)
    const button = screen.getByRole('button', { name: 'Join organization Nova' })
    expect(button).toHaveTextContent(label)
    await userEvent.click(button)
    expect(window.api.socialJoinOrganisation).toHaveBeenCalledWith('universe-testing', 'c1')
  })
})
