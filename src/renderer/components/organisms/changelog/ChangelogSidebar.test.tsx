import { describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { useChangelogStore } from '@stores/changelog'
import ChangelogSidebar from './ChangelogSidebar'

describe('ChangelogSidebar', () => {
  it('shows a skeleton of versions while loading, not the empty message', async () => {
    act(() => useChangelogStore.setState({ loading: true, data: null, fetched: false }))
    render(<ChangelogSidebar />)
    expect(screen.queryByText('No release notes yet.')).not.toBeInTheDocument()
    expect(await screen.findByRole('status', { name: 'Loading content' })).toBeInTheDocument()
  })
})
