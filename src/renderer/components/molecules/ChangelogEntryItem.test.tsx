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

  it('indents the continuation lines in a muted colour', () => {
    render(<ChangelogEntryItem text={'First line\\nSecond line'} />)
    expect(screen.getByText('Second line').closest('.pl-4')).toHaveClass('text-ds-muted')
  })
})
