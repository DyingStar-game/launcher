import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import SidebarPageLayout from './SidebarPageLayout'

describe('SidebarPageLayout', () => {
  it('pads the content column by default', () => {
    render(
      <SidebarPageLayout sidebar={<aside>Side</aside>}>
        <p>Content</p>
      </SidebarPageLayout>
    )
    expect(screen.getByText('Side')).toBeInTheDocument()
    expect(screen.getByText('Content').parentElement).toHaveClass('p-6')
  })

  it('leaves bare content as is', () => {
    render(
      <SidebarPageLayout sidebar={<aside>Side</aside>} bare>
        <p>Content</p>
      </SidebarPageLayout>
    )
    expect(screen.getByText('Content').parentElement).not.toHaveClass('p-6')
  })
})
