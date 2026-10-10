import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import userEvent from '@testing-library/user-event'
import { Tabs } from '@components/ui/tabs'
import SocialSidebar from './SocialSidebar'

const renderInTabs = (
  pending = { friends: 0, organisations: 0 },
  onValueChange = vi.fn(),
  onOpenProfile?: () => void
): ReturnType<typeof vi.fn> => {
  render(
    <Tabs value="friends" onValueChange={onValueChange} orientation="vertical">
      <SocialSidebar current="friends" pending={pending} onOpenProfile={onOpenProfile} />
    </Tabs>
  )
  return onValueChange
}

describe('SocialSidebar', () => {
  it('lists the two sections, the current one selected', () => {
    renderInTabs()
    expect(screen.getAllByRole('tab')).toHaveLength(2)
    expect(screen.getByRole('tab', { name: 'Friends' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Organizations' })).toBeInTheDocument()
  })

  it('shows the requests waiting in each section', () => {
    renderInTabs({ friends: 0, organisations: 2 })
    expect(
      screen.getByRole('tab', { name: /Organizations.*2 requests waiting/ })
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Friends' })).toBeInTheDocument()
  })

  it('switches section on click and with the arrow keys', async () => {
    const onValueChange = renderInTabs()
    await userEvent.click(screen.getByRole('tab', { name: 'Organizations' }))
    expect(onValueChange).toHaveBeenCalledWith('organisations')
    onValueChange.mockClear()
    screen.getByRole('tab', { name: 'Friends' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('tab', { name: 'Organizations' })).toHaveFocus()
    expect(onValueChange).toHaveBeenCalledWith('organisations')
  })

  it("opens the player's own sheet from My profile, not a tab", async () => {
    const onOpenProfile = vi.fn()
    renderInTabs(undefined, undefined, onOpenProfile)
    const link = screen.getByRole('button', { name: 'My profile' })
    expect(screen.queryByRole('tab', { name: 'My profile' })).not.toBeInTheDocument()
    await userEvent.click(link)
    expect(onOpenProfile).toHaveBeenCalledOnce()
  })

  it('disables "My profile" until the player is known', () => {
    renderInTabs()
    expect(screen.getByRole('button', { name: 'My profile' })).toBeDisabled()
  })
})
