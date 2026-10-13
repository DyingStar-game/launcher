import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import ChangelogEntryItem from './ChangelogEntryItem'

describe('ChangelogEntryItem (rendering)', () => {
  it('puts its first line next to the list bullet', () => {
    render(
      <ul className="list-disc pl-5">
        <li>
          <ChangelogEntryItem text={'First line\\nSecond line'} />
        </li>
      </ul>
    )
    const item = screen.getByRole('listitem')
    const first = screen.getByText('First line')
    // The first line sits on the bullet's line, not under it
    const offset = first.getBoundingClientRect().top - item.getBoundingClientRect().top
    expect(offset).toBeLessThan(first.getBoundingClientRect().height)
    expect(getComputedStyle(item.firstElementChild!).display).toBe('inline')
  })
})
