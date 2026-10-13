import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import { Badge } from './badge'

describe('Badge', () => {
  it('shows its content as a filled pill by default', () => {
    render(<Badge>3</Badge>)
    expect(screen.getByText('3')).toHaveAttribute('data-variant', 'default')
    expect(screen.getByText('3')).toHaveClass('rounded-4xl', 'bg-primary')
  })

  it('takes a variant', () => {
    render(<Badge variant="secondary">Closed</Badge>)
    expect(screen.getByText('Closed')).toHaveClass('bg-secondary')
  })
})
