import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SocialSidebar from './SocialSidebar'

describe('SocialSidebar', () => {
  it('lists the four tabs and switches tab', async () => {
    const setCurrent = vi.fn()
    render(<SocialSidebar current="friends" setCurrent={setCurrent} />)
    for (const name of ['Friends', 'Find players', 'Requests', 'Organizations']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
    await userEvent.click(screen.getByRole('button', { name: 'Find players' }))
    expect(setCurrent).toHaveBeenCalledWith('players')
  })
})
