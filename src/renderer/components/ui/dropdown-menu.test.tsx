import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './dropdown-menu'

describe('DropdownMenu', () => {
  it('opens a launcher-styled, non-draggable menu; asChild items keep their classes', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <button className="mine">Mine</button>
          </DropdownMenuItem>
          <DropdownMenuItem>Theirs</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByRole('menu')).toHaveClass('app-no-drag', 'bg-popover', 'rounded-xl')
    expect(screen.getByRole('menuitem', { name: 'Mine' }).className).toBe('mine')
    expect(screen.getByRole('menuitem', { name: 'Theirs' })).toHaveClass('cursor-default')
  })
})
