import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import userEvent from '@testing-library/user-event'
import { RadioGroup, RadioGroupItem } from './radio-group'

describe('RadioGroup', () => {
  it('picks one value', async () => {
    const onValueChange = vi.fn()
    render(
      <RadioGroup value="open" onValueChange={onValueChange} aria-label="Recruitment">
        <RadioGroupItem value="open" aria-label="Open" />
        <RadioGroupItem value="closed" aria-label="Closed" />
      </RadioGroup>
    )
    expect(screen.getByRole('radio', { name: 'Open' })).toBeChecked()
    await userEvent.click(screen.getByRole('radio', { name: 'Closed' }))
    expect(onValueChange).toHaveBeenCalledWith('closed')
  })
})
