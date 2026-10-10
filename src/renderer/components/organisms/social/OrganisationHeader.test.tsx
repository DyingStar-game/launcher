import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { OrganisationProfile } from '@shared/types/social'
import { seedSocial } from '../../../test/seedSocial'
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
})
