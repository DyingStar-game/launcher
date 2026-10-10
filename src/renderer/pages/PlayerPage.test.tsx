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
  it('shows a muted loading line while the player loads', () => {
    act(() => useSocialStore.setState({ getPlayer: vi.fn(() => new Promise<never>(() => {})) }))
    render(<PlayerPage />)
    expect(screen.getByText('Loading...')).toHaveClass('text-[var(--color-ds-muted)]')
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
