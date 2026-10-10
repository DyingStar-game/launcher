import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PlayerProfile } from '@shared/types/social'
import { useNavigationStore } from '@stores/navigation'
import { seedSocial } from '../../../test/seedSocial'
import PlayerAffiliations from './PlayerAffiliations'

const profile: PlayerProfile = {
  id: 'p1',
  name: 'Kira',
  status: 'online',
  reputation: 0,
  playtimeHours: 0,
  memberSince: '2026-10-01T00:00:00.000Z',
  corporations: [
    { id: 'c1', name: 'Nova Corp', ticker: 'NOVA' },
    { id: 'c2', name: 'Void Squad', ticker: 'VOID' }
  ],
  politics: [{ id: 'e1', type: 'region', name: 'Outer Rim' }]
}

describe('PlayerAffiliations', () => {
  it('lists every organisation and opens one', async () => {
    seedSocial({})
    render(<PlayerAffiliations profile={profile} />)
    expect(screen.getByText('Region')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Open the organization Void Squad' }))
    expect(useNavigationStore.getState()).toMatchObject({
      currentView: 'organisation',
      subject: { id: 'c2' }
    })
  })

  it('says when the player has no organisation', () => {
    seedSocial({})
    render(<PlayerAffiliations profile={{ ...profile, corporations: [], politics: [] }} />)
    expect(screen.getByText('No organization.')).toBeInTheDocument()
    expect(screen.queryByText('Political entities')).not.toBeInTheDocument()
  })
})
