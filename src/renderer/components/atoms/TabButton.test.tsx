import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import userEvent from '@testing-library/user-event'
import TabButton from './TabButton'

describe('TabButton', () => {
  it('calls onClick', async () => {
    const onClick = vi.fn()
    render(<TabButton onClick={onClick}>Lore</TabButton>)
    await userEvent.click(screen.getByRole('button', { name: 'Lore' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('fills the selected accent tab with the accent colour', () => {
    render(
      <TabButton tone="accent" selected>
        Universe
      </TabButton>
    )
    const tab = screen.getByRole('button', { name: 'Universe' })
    expect(tab).toHaveClass('bg-ds-accent', 'text-black')
    expect(tab).toHaveAttribute('aria-current', 'true')
  })

  it('highlights the selected neutral tab, mutes the others', () => {
    render(
      <>
        <TabButton selected>Social</TabButton>
        <TabButton>Lore</TabButton>
      </>
    )
    expect(screen.getByRole('button', { name: 'Social' })).toHaveClass('bg-white/10')
    expect(screen.getByRole('button', { name: 'Lore' })).toHaveClass('text-ds-muted')
    expect(screen.getByRole('button', { name: 'Lore' })).not.toHaveAttribute('aria-current')
  })
})
