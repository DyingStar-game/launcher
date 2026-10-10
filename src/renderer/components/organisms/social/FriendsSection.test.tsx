import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { seedSocial } from '../../../test/seedSocial'
import FriendsSection from './FriendsSection'

describe('FriendsSection', () => {
  it('lists my friends and sends "Add friend" to the search', async () => {
    seedSocial({ friends: [{ id: 'p1', name: 'Kira', status: 'online' }] })
    const onTabChange = vi.fn()
    render(<FriendsSection tab="mine" onTabChange={onTabChange} />)
    expect(await screen.findByText('Kira')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Add friend' }))
    expect(onTabChange).toHaveBeenCalledWith('find')
  })

  it('counts incoming requests on the Requests tab', async () => {
    seedSocial({ incoming: [{ id: 7, playerId: 'p2', name: 'Zed' }] })
    render(<FriendsSection tab="mine" onTabChange={vi.fn()} />)
    expect(
      await screen.findByRole('tab', { name: /Requests.*1 request waiting/ })
    ).toBeInTheDocument()
  })

  it('answers incoming requests and cancels sent ones', async () => {
    seedSocial({
      incoming: [{ id: 7, playerId: 'p2', name: 'Zed' }],
      outgoing: [{ id: 8, playerId: 'p3', name: 'Ana' }]
    })
    vi.mocked(window.api.socialAcceptRequest).mockResolvedValue({ ok: true, data: undefined })
    vi.mocked(window.api.socialDeclineRequest).mockResolvedValue({ ok: true, data: undefined })
    render(<FriendsSection tab="requests" onTabChange={vi.fn()} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Accept request from Zed' }))
    expect(window.api.socialAcceptRequest).toHaveBeenCalledWith('universe-testing', 7)
    await userEvent.click(screen.getByRole('button', { name: 'Cancel request to Ana' }))
    expect(window.api.socialDeclineRequest).toHaveBeenCalledWith('universe-testing', 8)
  })

  it('shows the player search on Find', async () => {
    seedSocial({})
    render(<FriendsSection tab="find" onTabChange={vi.fn()} />)
    expect(await screen.findByRole('textbox')).toBeInTheDocument()
  })
})
