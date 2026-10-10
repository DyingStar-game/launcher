import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import userEvent from '@testing-library/user-event'
import SidebarItemButton from './SidebarItemButton'

describe('SidebarItemButton', () => {
  it('calls onClick', async () => {
    const onClick = vi.fn()
    render(<SidebarItemButton onClick={onClick}>Friends</SidebarItemButton>)
    await userEvent.click(screen.getByRole('button', { name: 'Friends' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('frames the active item with the accent border', () => {
    render(<SidebarItemButton active>Friends</SidebarItemButton>)
    const item = screen.getByRole('button', { name: 'Friends' })
    expect(item).toHaveClass('border-[var(--color-ds-accent)]/40')
    expect(item).toHaveAttribute('aria-current', 'true')
  })

  it('keeps an inactive item muted', () => {
    render(<SidebarItemButton>Requests</SidebarItemButton>)
    expect(screen.getByRole('button', { name: 'Requests' })).toHaveClass(
      'text-[var(--color-ds-muted)]'
    )
  })
})
