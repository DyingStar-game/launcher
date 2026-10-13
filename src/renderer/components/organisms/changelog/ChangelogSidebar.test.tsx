import { describe, expect, it, vi } from 'vitest'
import type { ChangelogEntryRef } from '@shared/types/changelog'
import { act, render, screen } from '../../../test/render'
import { useChangelogStore } from '@stores/changelog'
import ChangelogSidebar from './ChangelogSidebar'

describe('ChangelogSidebar', () => {
  it('shows a skeleton of versions while loading, not the empty message', async () => {
    act(() => useChangelogStore.setState({ loading: true, data: null, fetched: false }))
    render(<ChangelogSidebar />)
    expect(screen.queryByText('No release notes yet.')).not.toBeInTheDocument()
    expect(await screen.findByRole('status', { name: 'Loading content' })).toBeInTheDocument()
  })

  it('marks the versions not read yet as new', () => {
    const entry = (id: string, version: string): ChangelogEntryRef => ({
      id,
      env: 'universe',
      componentId: 'launcher',
      moduleKind: 'launcher',
      kind: 'release',
      version,
      date: null
    })
    const saved = useChangelogStore.getState()
    act(() =>
      useChangelogStore.setState({
        loading: false,
        getEntries: () => [entry('a', '1.0.0'), entry('b', '0.9.0')],
        getCurrentId: () => 'b',
        isUnread: (id) => id === 'a',
        syncSelectionForEnv: vi.fn()
      })
    )
    render(<ChangelogSidebar />)
    expect(screen.getByRole('button', { name: /1\.0\.0.*New/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /0\.9\.0/ })).not.toHaveTextContent('New')
    act(() => useChangelogStore.setState(saved))
  })
})
