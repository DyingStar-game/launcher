import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import userEvent from '@testing-library/user-event'
import { Tabs, TabsList, TabsTrigger } from './tabs'

const renderTabs = (onValueChange = vi.fn()): ReturnType<typeof vi.fn> => {
  render(
    <Tabs value="a" onValueChange={onValueChange} orientation="vertical">
      <TabsList variant="plain">
        <TabsTrigger value="a" asChild>
          <button className="mine">A</button>
        </TabsTrigger>
        <TabsTrigger value="b">B</TabsTrigger>
      </TabsList>
    </Tabs>
  )
  return onValueChange
}

describe('Tabs', () => {
  it('passes the orientation to Radix: vertical tabs move with the down arrow', async () => {
    const onValueChange = renderTabs()
    screen.getByRole('tab', { name: 'A' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(onValueChange).toHaveBeenCalledWith('b')
  })

  it('keeps the classes of an asChild trigger', () => {
    renderTabs()
    expect(screen.getByRole('tab', { name: 'A' }).className).toBe('mine')
    expect(screen.getByRole('tab', { name: 'B' })).toHaveClass('rounded-md')
  })

  it('has a plain list variant', () => {
    renderTabs()
    expect(screen.getByRole('tablist')).toHaveClass('bg-transparent', 'p-0')
  })
})
