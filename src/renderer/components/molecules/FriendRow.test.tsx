import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import userEvent from '@testing-library/user-event'
import FriendRow from './FriendRow'

describe('FriendRow', () => {
  it('shows the star system of a friend in mission', () => {
    render(
      <FriendRow
        friend={{ id: 'p1', name: 'Kira', status: 'mission', system: 'Tarsis' }}
        onOpen={vi.fn()}
      />
    )
    expect(screen.getByText('In mission • Tarsis')).toBeInTheDocument()
  })

  it('shows the plain status otherwise, and opens the sheet', async () => {
    const onOpen = vi.fn()
    render(<FriendRow friend={{ id: 'p1', name: 'Kira', status: 'offline' }} onOpen={onOpen} />)
    expect(screen.getByText('Offline')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Open the profile of Kira' }))
    expect(onOpen).toHaveBeenCalledOnce()
  })
})
