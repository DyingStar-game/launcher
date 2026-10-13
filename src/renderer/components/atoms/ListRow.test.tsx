import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import ListRow from './ListRow'

describe('ListRow', () => {
  it('is a div by default, a list item in a list', () => {
    render(
      <>
        <ListRow>Kira</ListRow>
        <ul>
          <ListRow as="li">Ona</ListRow>
        </ul>
      </>
    )
    expect(screen.getByText('Kira').tagName).toBe('DIV')
    expect(screen.getByRole('listitem')).toHaveTextContent('Ona')
  })

  it('takes a layout class', () => {
    render(<ListRow className="p-2">Kira</ListRow>)
    expect(screen.getByText('Kira')).toHaveClass('p-2')
    expect(screen.getByText('Kira')).not.toHaveClass('px-3')
  })
})
