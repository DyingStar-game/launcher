import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import userEvent from '@testing-library/user-event'
import { Tabs } from '@components/ui/tabs'
import SubTabList from './SubTabList'

const tabs = [
  { value: 'mine', label: 'My friends' },
  { value: 'find', label: 'Find players' },
  { value: 'requests', label: 'Requests', pending: 3 }
]

describe('SubTabList', () => {
  it('lists the tabs with their counts, the current one selected', () => {
    render(
      <Tabs value="mine">
        <SubTabList label="Friends" current="mine" tabs={tabs} />
      </Tabs>
    )
    expect(screen.getByRole('tablist', { name: 'Friends' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'My friends' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /Requests.*3 requests waiting/ })).toBeInTheDocument()
  })

  it('switches tab on click', async () => {
    const onValueChange = vi.fn()
    render(
      <Tabs value="mine" onValueChange={onValueChange}>
        <SubTabList label="Friends" current="mine" tabs={tabs} />
      </Tabs>
    )
    await userEvent.click(screen.getByRole('tab', { name: 'Find players' }))
    expect(onValueChange).toHaveBeenCalledWith('find')
  })
})
