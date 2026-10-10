import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import userEvent from '@testing-library/user-event'
import { Toggle } from './toggle'

describe('Toggle', () => {
  it('is a button that reports and shows whether it is pressed', async () => {
    const onPressedChange = vi.fn()
    render(
      <Toggle aria-label="Bold" pressed={false} onPressedChange={onPressedChange}>
        B
      </Toggle>
    )
    const toggle = screen.getByRole('button', { name: 'Bold' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(toggle)
    expect(onPressedChange).toHaveBeenCalledWith(true)
  })
})
