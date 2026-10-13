import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import type { PlayerProfile } from '@shared/types/social'
import PlayerAbout from './PlayerAbout'

const base: PlayerProfile = {
  id: 'p1',
  name: 'Kira',
  status: 'online',
  reputation: 0,
  playtimeHours: 0,
  memberSince: '2026-10-01T00:00:00.000Z',
  corporations: [],
  politics: []
}

describe('PlayerAbout', () => {
  it('shows biography and role-play sheet', () => {
    render(
      <PlayerAbout
        profile={{
          ...base,
          biography: 'Hauls ore.',
          characterName: 'Kira Vel',
          story: 'Born on Haven.'
        }}
      />
    )
    expect(screen.getByRole('heading', { name: 'Biography' })).toBeInTheDocument()
    expect(screen.getByText('Hauls ore.')).toBeInTheDocument()
    expect(screen.getByText('Kira Vel')).toBeInTheDocument()
    expect(screen.getByText('Born on Haven.')).toBeInTheDocument()
    expect(screen.queryByText('Alignment:')).not.toBeInTheDocument()
  })

  it('says when there is nothing to tell', () => {
    render(<PlayerAbout profile={base} />)
    expect(screen.getByText('This player has not written a biography yet.')).toBeInTheDocument()
  })

  it('interprets the BBCode of the biography', () => {
    render(<PlayerAbout profile={{ ...base, biography: '[b]Salut[/b]' }} />)
    expect(screen.getByText('Salut').tagName).toBe('STRONG')
  })
})
