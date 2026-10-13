import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render, screen } from '../../test/render'
import Button from './Button'
import ListRow from './ListRow'

describe('ListRow (rendering)', () => {
  it('lights the whole row up while the pointer is on its action', async () => {
    render(
      <ListRow>
        <span>Kira</span>
        <Button variant="danger" size="chip">
          Remove
        </Button>
      </ListRow>
    )
    const row = screen.getByText('Kira').parentElement!
    const idle = getComputedStyle(row).backgroundColor
    await userEvent.hover(screen.getByRole('button', { name: 'Remove' }))
    await expect.poll(() => getComputedStyle(row).backgroundColor).not.toBe(idle)
  })
})
