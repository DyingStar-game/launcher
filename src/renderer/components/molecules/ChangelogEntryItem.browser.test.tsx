import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import ChangelogEntryItem from './ChangelogEntryItem'

describe('ChangelogEntryItem (rendering)', () => {
  it('puts its text next to the list bullet', () => {
    render(
      <ul className="list-disc pl-5">
        <li>
          <ChangelogEntryItem text={'First line\nsecond line'} />
        </li>
      </ul>
    )
    const item = screen.getByRole('listitem')
    const text = screen.getByText('First line second line')
    // The text sits on the bullet's line, not under it
    const offset = text.getBoundingClientRect().top - item.getBoundingClientRect().top
    expect(offset).toBeLessThan(text.getBoundingClientRect().height)
  })
})
