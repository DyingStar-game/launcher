import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import { Slider } from './slider'

describe('Slider', () => {
  it('names its thumb with the aria-label', () => {
    render(<Slider aria-label="Volume" value={[40]} />)
    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveAttribute('aria-valuenow', '40')
  })
})
