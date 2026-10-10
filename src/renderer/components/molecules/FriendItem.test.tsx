import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import userEvent from '@testing-library/user-event'
import FriendItem from './FriendItem'

describe('FriendItem', () => {
  it('colours the status and opens the sheet', async () => {
    const onOpen = vi.fn()
    render(<FriendItem friend={{ id: 'p1', name: 'Aurel', status: 'online' }} onOpen={onOpen} />)
    expect(screen.getByText('Online')).toHaveClass('text-green-400')
    await userEvent.click(screen.getByRole('button', { name: 'Open the profile of Aurel' }))
    expect(onOpen).toHaveBeenCalledOnce()
  })

  it('shows "in mission" without a known system', () => {
    render(<FriendItem friend={{ id: 'p1', name: 'Aurel', status: 'mission' }} onOpen={vi.fn()} />)
    expect(screen.getByText('In mission')).toHaveClass('text-orange-400')
  })
})
