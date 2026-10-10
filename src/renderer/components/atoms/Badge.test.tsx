import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Badge from './Badge'

describe('Badge', () => {
  it('shows its content, muted by default', () => {
    render(<Badge>Request sent</Badge>)
    expect(screen.getByText('Request sent')).toHaveClass('text-[var(--color-ds-muted)]')
  })

  it('uses the accent colour for a positive state', () => {
    render(<Badge variant="accent">Member</Badge>)
    expect(screen.getByText('Member')).toHaveClass('text-[var(--color-ds-accent)]')
  })

  it('has no frame, so it never looks like a chip button', () => {
    render(<Badge>Closed</Badge>)
    expect(screen.getByText('Closed')).not.toHaveClass('border')
  })

  it('shows an icon only when asked', () => {
    const { container, rerender } = render(<Badge>Request sent</Badge>)
    expect(container.querySelector('svg')).toBeNull()
    rerender(<Badge icon="pending">Request sent</Badge>)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
