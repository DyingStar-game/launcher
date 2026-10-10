import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs } from '@components/ui/tabs'
import SocialSidebar from './SocialSidebar'

const renderInTabs = (onValueChange = vi.fn()): ReturnType<typeof vi.fn> => {
  render(
    <Tabs value="friends" onValueChange={onValueChange} orientation="vertical">
      <SocialSidebar current="friends" />
    </Tabs>
  )
  return onValueChange
}

describe('SocialSidebar', () => {
  it('lists the four tabs, the current one selected', () => {
    renderInTabs()
    for (const name of ['Friends', 'Find players', 'Requests', 'Organizations']) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
    expect(screen.getByRole('tab', { name: 'Friends' })).toHaveAttribute('aria-selected', 'true')
  })

  it('switches tab on click', async () => {
    const onValueChange = renderInTabs()
    await userEvent.click(screen.getByRole('tab', { name: 'Find players' }))
    expect(onValueChange).toHaveBeenCalledWith('players')
  })

  it('moves between tabs with the arrow keys', async () => {
    const onValueChange = renderInTabs()
    screen.getByRole('tab', { name: 'Friends' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('tab', { name: 'Find players' })).toHaveFocus()
    expect(onValueChange).toHaveBeenCalledWith('players')
  })
})
