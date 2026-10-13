import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import { Input } from './input'

describe('Input', () => {
  it('renders an input with the shadcn look and its own props', () => {
    render(<Input aria-label="Name" placeholder="Kira" />)
    const input = screen.getByRole('textbox', { name: 'Name' })
    expect(input).toHaveAttribute('data-slot', 'input')
    expect(input).toHaveAttribute('placeholder', 'Kira')
  })
})
