import { describe, expect, it } from 'vitest'
import type { ChangelogFeedItem, ChangelogGroup } from '@shared/types/changelog'
import { render, screen } from '../../test/render'
import ChangelogEntryList from './ChangelogEntryList'

const entry = (text: string, over: Partial<ChangelogFeedItem> = {}): ChangelogFeedItem => ({
  componentId: 'DyingStar',
  type: 'added',
  area: null,
  text,
  publishedAt: 1,
  build: null,
  ...over
})

const group = (label: string | null, ...entries: ChangelogFeedItem[]): ChangelogGroup => ({
  type: label,
  label,
  entries
})

describe('ChangelogEntryList', () => {
  it('heads each type, the entries without one under "Other changes"', () => {
    render(
      <ChangelogEntryList groups={[group('Added', entry('Ships')), group(null, entry('Old'))]} />
    )
    expect(screen.getByRole('heading', { name: 'Added' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Other changes' })).toBeInTheDocument()
  })

  it('shows no heading when no entry has a type', () => {
    render(<ChangelogEntryList groups={[group(null, entry('Old'))]} />)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('starts an entry with its area', () => {
    render(<ChangelogEntryList groups={[group('Added', entry('Ships', { area: 'Vehicles' }))]} />)
    expect(screen.getByRole('listitem')).toHaveTextContent('Vehicles: Ships')
  })

  it('tags an entry with its module when asked', () => {
    render(
      <ChangelogEntryList
        groups={[
          group('Added', entry('Ships'), entry('Faster mesh', { componentId: 'horizonserver' }))
        ]}
        moduleTag={(id) => `Module ${id}`}
      />
    )
    const [game, horizon] = screen.getAllByRole('listitem')
    expect(game).toHaveTextContent('Module DyingStar')
    expect(horizon).toHaveTextContent('Module horizonserver')
    expect(screen.getByText('Module horizonserver')).toHaveAttribute('data-variant', 'subtle')
  })

  it('shows no tag when not asked', () => {
    render(<ChangelogEntryList groups={[group('Added', entry('Ships'))]} />)
    expect(screen.getByRole('listitem').textContent).toBe('Ships')
  })
})
