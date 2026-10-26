import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render, screen } from '../../test/render'
import Button from './Button'

const style = (el: Element): CSSStyleDeclaration => getComputedStyle(el)

describe('Button (rendering)', () => {
  it('shows a disabled button as not allowed, without the hover colour (ADR 0048)', async () => {
    render(
      <div className="flex gap-4 p-4">
        <Button variant="outline">On</Button>
        <Button variant="outline" disabled>
          Off
        </Button>
      </div>
    )
    const on = screen.getByRole('button', { name: 'On' })
    const off = screen.getByRole('button', { name: 'Off' })
    expect(style(off).cursor).toBe('not-allowed')

    const offAtRest = style(off).backgroundColor
    await userEvent.hover(off)
    // Same transition as an enabled button: had it changed, it would have by then
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(style(off).backgroundColor).toBe(offAtRest)

    const onAtRest = style(on).backgroundColor
    await userEvent.hover(on)
    await expect.poll(() => style(on).backgroundColor).not.toBe(onAtRest)
  })
})
