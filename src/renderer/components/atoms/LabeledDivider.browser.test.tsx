import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import LabeledDivider from './LabeledDivider'

describe('LabeledDivider (rendering)', () => {
  it('draws its line after the label, up to the end of its parent', () => {
    render(
      <div style={{ width: '40rem' }}>
        <LabeledDivider>Already seen</LabeledDivider>
      </div>
    )
    const label = screen.getByText('Already seen').getBoundingClientRect()
    const parent = screen.getByText('Already seen').parentElement!.getBoundingClientRect()
    const line = document.querySelector('[data-slot="separator"]')!.getBoundingClientRect()
    expect(line.height).toBeGreaterThan(0)
    expect(line.left).toBeGreaterThan(label.right)
    expect(line.right).toBe(parent.right)
    expect(line.top).toBeGreaterThanOrEqual(label.top)
    expect(line.bottom).toBeLessThanOrEqual(label.bottom)
  })
})
