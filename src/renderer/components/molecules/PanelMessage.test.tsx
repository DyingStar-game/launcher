import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import PanelMessage from './PanelMessage'

describe('PanelMessage', () => {
  it.each([
    ['info', 'text-sky-100'],
    ['warning', 'text-amber-100'],
    ['error', 'text-red-200']
  ] as const)('styles a %s message', (variant, textClass) => {
    render(<PanelMessage variant={variant}>Heads up</PanelMessage>)
    expect(screen.getByRole('status')).toHaveClass(textClass)
  })

  it('accepts extra classes', () => {
    render(
      <PanelMessage variant="info" className="mt-2">
        Note
      </PanelMessage>
    )
    expect(screen.getByRole('status')).toHaveClass('mt-2')
  })
})
