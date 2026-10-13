import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen } from '../../test/render'
import StatusBadge from './StatusBadge'

describe('StatusBadge', () => {
  it.each([
    ['friend', 'lucide-user-check'],
    ['member', 'lucide-users'],
    ['pending', 'lucide-clock'],
    ['lock', 'lucide-lock'],
    ['self', 'lucide-user']
  ] as const)('draws %s with its own icon, outlined', (icon, cls) => {
    const { container } = render(<StatusBadge icon={icon}>State</StatusBadge>)
    expect(screen.getByText('State')).toHaveAttribute('data-variant', 'outline')
    expect(container.querySelector('svg')).toHaveClass(cls)
  })

  it('opens what it names when given onOpen', async () => {
    const onOpen = vi.fn()
    render(
      <StatusBadge icon="pending" onOpen={onOpen}>
        Invited to Nova
      </StatusBadge>
    )
    const badge = screen.getByRole('button', { name: 'Invited to Nova' })
    expect(badge).toHaveAttribute('data-slot', 'badge')
    await userEvent.click(badge)
    expect(onOpen).toHaveBeenCalledOnce()
  })
})
