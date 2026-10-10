import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import SheetStat from './SheetStat'

describe('SheetStat', () => {
  it('pairs a label and a value', () => {
    render(
      <dl>
        <SheetStat label="Reputation" value={12} />
      </dl>
    )
    expect(screen.getByRole('term')).toHaveTextContent('Reputation')
    expect(screen.getByRole('definition')).toHaveTextContent('12')
  })
})
