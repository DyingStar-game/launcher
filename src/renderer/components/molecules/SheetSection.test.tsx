import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import SheetSection from './SheetSection'

describe('SheetSection', () => {
  it('titles its content', () => {
    render(
      <SheetSection title="Biography">
        <p>Trader</p>
      </SheetSection>
    )
    expect(screen.getByRole('heading', { name: 'Biography' })).toBeInTheDocument()
    expect(screen.getByText('Trader')).toBeInTheDocument()
  })
})
