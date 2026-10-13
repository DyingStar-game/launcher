import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import PageSidebar from './PageSidebar'

describe('PageSidebar', () => {
  it('lays its items out in a full-height column', () => {
    render(
      <PageSidebar className="overflow-y-auto">
        <span>Friends</span>
      </PageSidebar>
    )
    const sidebar = screen.getByText('Friends').parentElement
    expect(sidebar).toHaveClass('flex-col', 'h-full', 'border-r', 'overflow-y-auto')
  })
})
