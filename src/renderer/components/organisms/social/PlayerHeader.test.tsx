import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { PlayerProfile } from '@shared/types/social'
import { seedSocial } from '../../../test/seedSocial'
import PlayerHeader from './PlayerHeader'

const profile: PlayerProfile = {
  id: 'p1',
  name: 'Kira',
  status: 'mission',
  faction: 'Free traders',
  role: 'Pilot',
  reputation: 0,
  playtimeHours: 0,
  memberSince: '2026-10-01T00:00:00.000Z',
  corporations: [],
  politics: []
}

describe('PlayerHeader', () => {
  it('shows the system of a friend in mission and the friend badge', () => {
    seedSocial({ friends: [{ id: 'p1', name: 'Kira', status: 'mission', system: 'Tarsis' }] })
    render(<PlayerHeader profile={profile} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Kira' })).toBeInTheDocument()
    expect(screen.getByText('In mission • Tarsis')).toBeInTheDocument()
    expect(screen.getByText('Free traders • Pilot')).toBeInTheDocument()
    expect(screen.getByText('Friend')).toBeInTheDocument()
  })

  it('shows the plain status of a stranger, with the add action', () => {
    seedSocial({})
    render(<PlayerHeader profile={profile} />)
    expect(screen.getByText('In mission')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Send a friend request to Kira' })
    ).toBeInTheDocument()
  })
})
