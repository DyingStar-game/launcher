import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { OrganisationProfile } from '@shared/types/social'
import { useNavigationStore } from '@stores/navigation'
import { seedSocial } from '../../../test/seedSocial'
import OrganisationRelations from './OrganisationRelations'

const organisation: OrganisationProfile = {
  id: 'c1',
  name: 'Nova Corp',
  ticker: 'NOVA',
  recruitment: 'apply',
  members: 3,
  createdAt: '2026-10-01T00:00:00.000Z',
  ceo: { id: 'ceo', name: 'Aurel' },
  parent: { id: 'h', name: 'Holding', ticker: 'HOLD' },
  subsidiaries: [{ id: 's', name: 'Spin-off', ticker: 'SPIN', members: 2 }],
  subsidiaryCount: 1
}

describe('OrganisationRelations', () => {
  it('opens the CEO, the holding company and a subsidiary', async () => {
    seedSocial({})
    render(<OrganisationRelations organisation={organisation} />)
    expect(screen.getByText('1 subsidiary')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Open the profile of Aurel' }))
    expect(useNavigationStore.getState()).toMatchObject({
      currentView: 'player',
      subject: { id: 'ceo' }
    })
    await userEvent.click(screen.getByRole('button', { name: 'Open the organization Holding' }))
    expect(useNavigationStore.getState().subject).toMatchObject({ id: 'h' })
    await userEvent.click(screen.getByRole('button', { name: 'Open the organization Spin-off' }))
    expect(useNavigationStore.getState().subject).toMatchObject({ id: 's' })
  })

  it('shows nothing for an independent organisation without known CEO', () => {
    seedSocial({})
    const { container } = render(
      <OrganisationRelations
        organisation={{ ...organisation, ceo: undefined, parent: undefined, subsidiaries: [] }}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
