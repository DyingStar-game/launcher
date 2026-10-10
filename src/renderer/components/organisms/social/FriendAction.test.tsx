import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { seedSocial } from '../../../test/seedSocial'
import FriendAction from './FriendAction'

describe('FriendAction', () => {
  it.each([
    ['me', 'You'],
    ['friend', 'Friend'],
    ['asked', 'Request sent']
  ])('shows a badge for %s', (playerId, badge) => {
    seedSocial({
      friends: [{ id: 'friend', name: 'F', status: 'online' }],
      outgoing: [{ id: 1, playerId: 'asked', name: 'A' }]
    })
    render(<FriendAction playerId={playerId} name="X" />)
    expect(screen.getByText(badge)).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('sends a friend request to a stranger', async () => {
    seedSocial({})
    vi.mocked(window.api.socialSendFriendRequest).mockResolvedValue({ ok: true, data: 'sent' })
    render(<FriendAction playerId="stranger" name="Kira" />)
    await userEvent.click(screen.getByRole('button', { name: 'Send a friend request to Kira' }))
    expect(window.api.socialSendFriendRequest).toHaveBeenCalledWith('universe-testing', 'stranger')
  })

  it('accepts the request of a player who asked first', async () => {
    seedSocial({ incoming: [{ id: 9, playerId: 'asks', name: 'Zed' }] })
    vi.mocked(window.api.socialAcceptRequest).mockResolvedValue({ ok: true, data: undefined })
    render(<FriendAction playerId="asks" name="Zed" />)
    await userEvent.click(screen.getByRole('button', { name: 'Accept request from Zed' }))
    expect(window.api.socialAcceptRequest).toHaveBeenCalledWith('universe-testing', 9)
  })

  it('shows the error of a refused request', async () => {
    seedSocial({})
    vi.mocked(window.api.socialSendFriendRequest).mockResolvedValue({ ok: false, error: 'blocked' })
    render(<FriendAction playerId="stranger" name="Kira" />)
    await userEvent.click(screen.getByRole('button', { name: 'Send a friend request to Kira' }))
    expect(await screen.findByText('You cannot add this player.')).toBeInTheDocument()
  })
})
