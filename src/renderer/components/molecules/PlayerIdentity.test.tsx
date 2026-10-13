import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import userEvent from '@testing-library/user-event'
import PlayerIdentity from './PlayerIdentity'

describe('PlayerIdentity', () => {
  it('opens the sheet when clicked', async () => {
    const onOpen = vi.fn()
    render(
      <PlayerIdentity name="Kira" status="online" onOpen={onOpen}>
        <span>Online</span>
      </PlayerIdentity>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Open the profile of Kira' }))
    expect(onOpen).toHaveBeenCalledOnce()
    expect(screen.getByText('Online')).toBeInTheDocument()
    expect(screen.getByTestId('presence-dot')).toHaveAttribute('data-status', 'online')
  })
})
