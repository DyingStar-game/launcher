import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from './Button'

describe('Button', () => {
  it('calls onClick', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Send</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button onClick={onClick} disabled>
        Send
      </Button>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('renders the compact outline chip', () => {
    render(
      <Button variant="outline" size="chip">
        Add
      </Button>
    )
    expect(screen.getByRole('button', { name: 'Add' })).toHaveClass('uppercase', 'bg-transparent')
  })

  it('renders a square icon button', () => {
    render(
      <Button variant="outline" size="icon" aria-label="Close">
        ×
      </Button>
    )
    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('h-9', 'w-9', 'border')
  })

  it('renders a frameless link button', () => {
    render(
      <Button variant="link" size="none">
        Cancel
      </Button>
    )
    expect(screen.getByRole('button', { name: 'Cancel' })).not.toHaveClass('border')
  })

  it('lets className override the variant through cn()', () => {
    render(<Button className="hidden">Donate</Button>)
    const button = screen.getByRole('button', { name: 'Donate' })
    expect(button).toHaveClass('hidden')
    expect(button).not.toHaveClass('inline-flex')
  })
})
