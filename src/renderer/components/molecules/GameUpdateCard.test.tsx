import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import userEvent from '@testing-library/user-event'
import GameUpdateCard from './GameUpdateCard'

describe('GameUpdateCard', () => {
  it('tells a new version is out, and opens the changelog', async () => {
    const onOpenChangelog = vi.fn()
    render(<GameUpdateCard onOpenChangelog={onOpenChangelog} />)
    expect(screen.getByRole('heading', { name: 'New game version available' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'See the full changelog' }))
    expect(onOpenChangelog).toHaveBeenCalledOnce()
  })
})
