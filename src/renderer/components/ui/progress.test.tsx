import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import { Progress } from './progress'

describe('Progress', () => {
  it('reports its value and fills that share of the track', () => {
    render(<Progress value={43} aria-label="Installing" />)
    const bar = screen.getByRole('progressbar', { name: 'Installing' })
    expect(bar).toHaveAttribute('aria-valuenow', '43')
    expect(bar.firstElementChild).toHaveStyle({ transform: 'translateX(-57%)' })
  })
})
