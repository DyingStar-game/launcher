import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import { Button } from './button'

describe('Button (shadcn)', () => {
  it('is 32px high by default', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('h-8')
  })

  it('takes a variant and a size', () => {
    render(
      <Button variant="outline" size="icon" aria-label="Close">
        ×
      </Button>
    )
    const button = screen.getByRole('button', { name: 'Close' })
    expect(button).toHaveAttribute('data-variant', 'outline')
    expect(button).toHaveClass('size-8')
  })

  it('makes the main action of the home action bar glow', () => {
    render(<Button size="xl">Play</Button>)
    expect(screen.getByRole('button', { name: 'Play' })).toHaveClass('h-16', 'ring-4')
  })
})
