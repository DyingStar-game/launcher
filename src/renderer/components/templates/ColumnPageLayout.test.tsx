import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import ColumnPageLayout from './ColumnPageLayout'

describe('ColumnPageLayout', () => {
  it('shows its content in a column that scrolls', () => {
    render(
      <ColumnPageLayout>
        <p>Content</p>
      </ColumnPageLayout>
    )
    const column = screen.getByText('Content').parentElement!
    expect(column).toHaveClass('flex-col')
    expect(column.parentElement).toHaveClass('overflow-y-auto')
  })
})
