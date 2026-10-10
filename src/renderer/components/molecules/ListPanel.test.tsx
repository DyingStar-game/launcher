import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import ListPanel from './ListPanel'

describe('ListPanel', () => {
  it('shows its rows in the scrolling element it hands out', () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <ListPanel ref={ref}>
        <p>Row</p>
      </ListPanel>
    )
    expect(ref.current).toContainElement(screen.getByText('Row'))
    expect(ref.current).toHaveClass('overflow-y-auto')
  })
})
