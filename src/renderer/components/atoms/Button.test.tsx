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
})
