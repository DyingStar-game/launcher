import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import userEvent from '@testing-library/user-event'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@components/ui/dropdown-menu'
import CommunityLinkItems from './CommunityLinkItems'

afterEach(() => vi.restoreAllMocks())

describe('CommunityLinkItems', () => {
  it('opens each link in the browser, a missing one disabled', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Links</DropdownMenuTrigger>
        <DropdownMenuContent>
          <CommunityLinkItems discord="https://discord.example" wiki="https://wiki.example" />
        </DropdownMenuContent>
      </DropdownMenu>
    )
    expect(screen.getByRole('menuitem', { name: 'Open official website' })).toBeDisabled()
    await userEvent.click(screen.getByRole('menuitem', { name: 'Discord' }))
    expect(open).toHaveBeenCalledWith('https://discord.example', '_blank')
  })

  it('shows the wiki with the open book of the admin panel', () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Links</DropdownMenuTrigger>
        <DropdownMenuContent>
          <CommunityLinkItems wiki="https://wiki.example" />
        </DropdownMenuContent>
      </DropdownMenu>
    )
    const wiki = screen.getByRole('menuitem', { name: 'Wiki' })
    expect(wiki.querySelector('svg')).toHaveClass('lucide-book-open')
  })
})
