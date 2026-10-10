import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { useNavigationStore } from '@stores/navigation'
import { useSocialStore } from '@stores/social'
import { SocialStoreError } from '@lib/socialErrors'
import PlayerPage from './PlayerPage'

beforeEach(() => {
  act(() => useNavigationStore.getState().openPlayer('x1'))
})

describe('PlayerPage', () => {
  it('shows a skeleton of the page while the player loads, after a short delay', async () => {
    act(() => useSocialStore.setState({ getPlayer: vi.fn(() => new Promise<never>(() => {})) }))
    render(<PlayerPage />)
    expect(screen.queryByRole('status', { name: 'Loading content' })).not.toBeInTheDocument()
    expect(await screen.findByRole('status', { name: 'Loading content' })).toHaveAttribute(
      'aria-busy',
      'true'
    )
  })

  it('shows the translated error in red', async () => {
    act(() =>
      useSocialStore.setState({
        getPlayer: vi.fn(() => Promise.reject(new SocialStoreError('unavailable')))
      })
    )
    render(<PlayerPage />)
    expect(
      await screen.findByText('The social service cannot be reached. Try again later.')
    ).toHaveClass('text-red-400')
  })
})
