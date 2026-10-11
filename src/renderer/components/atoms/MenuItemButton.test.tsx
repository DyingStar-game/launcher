import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import userEvent from '@testing-library/user-event'
import MenuItemButton from './MenuItemButton'

describe('MenuItemButton', () => {
  it('is a menu item that calls onClick', async () => {
    const onClick = vi.fn()
    render(<MenuItemButton onClick={onClick}>Wiki</MenuItemButton>)
    await userEvent.click(screen.getByRole('menuitem', { name: 'Wiki' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('marks the selected item', () => {
    render(<MenuItemButton selected>English</MenuItemButton>)
    const item = screen.getByRole('menuitem', { name: 'English' })
    expect(item).toHaveAttribute('aria-current', 'true')
    expect(item).toHaveClass('bg-ds-accent/15')
  })

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn()
    render(
      <MenuItemButton onClick={onClick} disabled>
        Donate
      </MenuItemButton>
    )
    await userEvent.click(screen.getByRole('menuitem', { name: 'Donate' }))
    expect(onClick).not.toHaveBeenCalled()
  })
})
