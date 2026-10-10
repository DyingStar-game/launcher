import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useNavigationStore } from '@stores/navigation'
import { seedSocial } from '../../../test/seedSocial'
import PlayerSearch from './PlayerSearch'

describe('PlayerSearch', () => {
  it('asks for 2 characters before searching', async () => {
    seedSocial({})
    render(<PlayerSearch />)
    await userEvent.type(screen.getByRole('textbox'), 'k')
    expect(screen.getByText('Type at least 2 characters to search.')).toBeInTheDocument()
    expect(window.api.socialSearchPlayers).not.toHaveBeenCalled()
  })

  it('lists the players found, once, after typing', async () => {
    seedSocial({ friends: [{ id: 'p2', name: 'Kiran', status: 'offline' }] })
    vi.mocked(window.api.socialSearchPlayers).mockResolvedValue({
      ok: true,
      data: [
        { id: 'p1', name: 'Kira' },
        { id: 'p2', name: 'Kiran' }
      ]
    })
    render(<PlayerSearch />)
    await userEvent.type(screen.getByRole('textbox'), 'kir')

    expect(await screen.findByText('Kira')).toBeInTheDocument()
    expect(window.api.socialSearchPlayers).toHaveBeenCalledOnce()
    expect(window.api.socialSearchPlayers).toHaveBeenCalledWith('universe-testing', 'kir')
    expect(
      screen.getByRole('button', { name: 'Send a friend request to Kira' })
    ).toBeInTheDocument()
    expect(screen.getByText('Friend')).toBeInTheDocument()
  })

  it('says when nobody matches', async () => {
    seedSocial({})
    vi.mocked(window.api.socialSearchPlayers).mockResolvedValue({ ok: true, data: [] })
    render(<PlayerSearch />)
    await userEvent.type(screen.getByRole('textbox'), 'zz')
    expect(await screen.findByText(/No player found/)).toBeInTheDocument()
  })

  it('opens the sheet of a found player', async () => {
    seedSocial({})
    vi.mocked(window.api.socialSearchPlayers).mockResolvedValue({
      ok: true,
      data: [{ id: 'p1', name: 'Kira' }]
    })
    render(<PlayerSearch />)
    await userEvent.type(screen.getByRole('textbox'), 'kira')
    await userEvent.click(await screen.findByRole('button', { name: 'Open the profile of Kira' }))
    expect(useNavigationStore.getState()).toMatchObject({
      currentView: 'player',
      subject: { id: 'p1' }
    })
  })

  it('shows a skeleton of results while searching', async () => {
    seedSocial({})
    vi.mocked(window.api.socialSearchPlayers).mockReturnValue(new Promise(() => {}))
    render(<PlayerSearch />)
    await userEvent.type(screen.getByRole('textbox'), 'kir')
    expect(await screen.findByRole('status', { name: 'Loading content' })).toBeInTheDocument()
  })
})
