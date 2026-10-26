import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render, screen } from '../../test/render'
import Button from '@components/atoms/Button'
import LabelTooltip from './LabelTooltip'

describe('LabelTooltip (rendering)', () => {
  it('opens the tooltip saying why when the pointer is on the disabled button itself', async () => {
    render(
      <div className="p-10">
        <LabelTooltip label="Everything is already read" disabled>
          <Button variant="outline" disabled>
            Mark all as read
          </Button>
        </LabelTooltip>
      </div>
    )
    await userEvent.hover(screen.getByRole('button', { name: 'Mark all as read' }))
    await expect
      .poll(() => screen.queryByRole('tooltip')?.textContent)
      .toContain('Everything is already read')
  })
})
