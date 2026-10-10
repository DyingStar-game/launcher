import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

describe('Popover', () => {
  it('opens a launcher-styled, non-draggable panel', async () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent aria-label="Panel">Body</PopoverContent>
      </Popover>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByRole('dialog', { name: 'Panel' })).toHaveClass(
      'app-no-drag',
      'bg-popover',
      'rounded-xl'
    )
  })
})
