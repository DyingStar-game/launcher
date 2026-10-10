import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '../test/render'
import { useNavigationStore } from '@stores/navigation'
import PlayerPage from './PlayerPage'

beforeEach(() => {
  act(() => useNavigationStore.getState().openPlayer('x1'))
})

describe('PlayerPage', () => {
  it('shows a skeleton of the page while the player loads, after a short delay', async () => {
    vi.mocked(window.api.socialGetPlayer).mockReturnValue(new Promise(() => {}))
    render(<PlayerPage />)
    expect(screen.queryByRole('status', { name: 'Loading content' })).not.toBeInTheDocument()
    expect(await screen.findByRole('status', { name: 'Loading content' })).toHaveAttribute(
      'aria-busy',
      'true'
    )
  })

  it('shows the translated error in red', async () => {
    vi.mocked(window.api.socialGetPlayer).mockResolvedValue({ ok: false, error: 'unavailable' })
    render(<PlayerPage />)
    expect(
      await screen.findByText('The social service cannot be reached. Try again later.')
    ).toHaveClass('text-red-400')
  })
})
