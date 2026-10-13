import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import userEvent from '@testing-library/user-event'
import { Checkbox } from './checkbox'

describe('Checkbox', () => {
  it('reports when it is ticked', async () => {
    const onCheckedChange = vi.fn()
    render(<Checkbox aria-label="Recruit" checked={false} onCheckedChange={onCheckedChange} />)
    await userEvent.click(screen.getByRole('checkbox', { name: 'Recruit' }))
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })
})
