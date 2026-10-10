import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { seedSocial } from '../../../test/seedSocial'
import OrganisationAction from './OrganisationAction'

describe('OrganisationAction', () => {
  it('shows "member" for an organisation the player belongs to', () => {
    seedSocial({ memberOf: ['c1'] })
    render(<OrganisationAction id="c1" name="Nova" recruitment="open" />)
    expect(screen.getByText('Member')).toBeInTheDocument()
  })

  it('shows a pending application', () => {
    seedSocial({ appliedTo: ['c1'] })
    render(<OrganisationAction id="c1" name="Nova" recruitment="apply" />)
    expect(screen.getByText('Application sent')).toBeInTheDocument()
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
