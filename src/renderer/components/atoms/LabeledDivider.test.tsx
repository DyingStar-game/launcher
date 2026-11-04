import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import LabeledDivider from './LabeledDivider'

describe('LabeledDivider', () => {
  it('shows its label, neutral by default', () => {
    render(<LabeledDivider>Already seen</LabeledDivider>)
    expect(screen.getByText('Already seen')).toHaveClass('text-ds-subtle')
  })

  it('stands out in its accent tone', () => {
    render(<LabeledDivider tone="accent">New</LabeledDivider>)
    expect(screen.getByText('New')).toHaveClass('text-ds-text')
  })
})
