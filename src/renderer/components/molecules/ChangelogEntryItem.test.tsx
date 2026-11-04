import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import ChangelogEntryItem from './ChangelogEntryItem'

describe('ChangelogEntryItem', () => {
  it('renders the markdown of a bullet, styled per element', () => {
    render(<ChangelogEntryItem text="**Fixed** the [launcher](https://example.com) `start`" />)
    expect(screen.getByText('Fixed')).toHaveClass('font-semibold')
    expect(screen.getByRole('link', { name: 'launcher' })).toHaveClass('text-ds-accent')
    expect(screen.getByText('start')).toHaveClass('bg-ds-surface-hover')
  })

  it('reads its line breaks as soft wraps: one paragraph (ADR 0051)', () => {
    render(<ChangelogEntryItem text={'First line\nsecond line\\nthird line'} />)
    expect(screen.getByText('First line second line third line')).toBeInTheDocument()
  })
})
