import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
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

  it('draws each launcher variant with a shadcn variant (ADR 0028)', () => {
    render(
      <>
        <Button variant="primary">Play</Button>
        <Button variant="danger">Leave</Button>
        <Button variant="success">Accept</Button>
        <Button variant="outline" size="chip">
          Join
        </Button>
      </>
    )
    expect(screen.getByRole('button', { name: 'Play' })).toHaveClass('bg-primary')
    expect(screen.getByRole('button', { name: 'Leave' })).toHaveClass('text-destructive')
    expect(screen.getByRole('button', { name: 'Accept' })).toHaveClass(
      'text-success',
      'bg-success/10'
    )
    expect(screen.getByRole('button', { name: 'Join' })).toHaveClass('h-6', 'border-border')
  })

  it('renders a square icon button', () => {
    render(
      <Button variant="outline" size="icon" aria-label="Close">
        ×
      </Button>
    )
    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('size-9')
  })

  it('renders an inline text button with no height nor padding', () => {
    render(
      <Button variant="link" size="none">
        Cancel
      </Button>
    )
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass('h-auto', 'p-0')
  })

  it('gives a bare button no look, but centred content and a keyboard focus ring', () => {
    render(<Button variant="bare">Kira</Button>)
    const button = screen.getByRole('button', { name: 'Kira' })
    expect(button).toHaveClass('items-center', 'focus-visible:ring-3')
    expect(button).not.toHaveClass('border', 'bg-primary')
  })

  it('lets className override the variant through cn()', () => {
    render(<Button className="hidden">Donate</Button>)
    const button = screen.getByRole('button', { name: 'Donate' })
    expect(button).toHaveClass('hidden')
    expect(button).not.toHaveClass('inline-flex')
  })

  it('gives text and icon buttons the same 36px height', () => {
    render(
      <>
        <Button size="sm">Donate</Button>
        <Button size="md">Play</Button>
        <Button size="icon" aria-label="Close">
          ×
        </Button>
      </>
    )
    expect(screen.getByRole('button', { name: 'Donate' })).toHaveClass('h-9')
    expect(screen.getByRole('button', { name: 'Play' })).toHaveClass('h-9')
    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('size-9')
  })

  it('keeps its size and shows a spinner while loading, disabled and busy', async () => {
    const onClick = vi.fn()
    render(
      <Button onClick={onClick} loading>
        Join
      </Button>
    )
    const button = screen.getByRole('button', { name: 'Join' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button.querySelector('.animate-spin')).toBeInTheDocument()
    expect(screen.getByText('Join')).toHaveClass('opacity-0')
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })
})
