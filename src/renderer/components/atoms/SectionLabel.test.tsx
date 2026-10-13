import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import SectionLabel from './SectionLabel'

describe('SectionLabel', () => {
  it('is a paragraph by default', () => {
    render(<SectionLabel>Pending</SectionLabel>)
    const label = screen.getByText('Pending')
    expect(label.tagName).toBe('P')
    expect(label).toHaveClass('uppercase', 'text-ds-muted')
  })

  it('can be a heading', () => {
    render(<SectionLabel as="h2">Account</SectionLabel>)
    expect(screen.getByRole('heading', { level: 2, name: 'Account' })).toBeInTheDocument()
  })
})
