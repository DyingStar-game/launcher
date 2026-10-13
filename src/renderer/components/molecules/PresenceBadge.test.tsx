import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import PresenceBadge from './PresenceBadge'

describe('PresenceBadge', () => {
  it('shows the presence with its colour', () => {
    const { container } = render(<PresenceBadge status="mission" label="In mission • Tarsis" />)
    expect(screen.getByText('In mission • Tarsis')).toHaveAttribute('data-status', 'mission')
    expect(container.querySelector('[aria-hidden="true"]')).toHaveClass(
      'bg-orange-400',
      'animate-pulse'
    )
  })

  it('does not pulse when offline', () => {
    const { container } = render(<PresenceBadge status="offline" label="Offline" />)
    expect(container.querySelector('[aria-hidden="true"]')).not.toHaveClass('animate-pulse')
  })
})
