import { describe, expect, it } from 'vitest'
import { act, render, screen } from '../../../test/render'
import { useChangelogStore } from '@stores/changelog'
import ChangelogContent from './ChangelogContent'

describe('ChangelogContent', () => {
  it('shows a skeleton of an entry while the changelog loads', async () => {
    act(() => useChangelogStore.setState({ loading: true, data: null, fetched: false }))
    render(<ChangelogContent />)
    expect(await screen.findByRole('status', { name: 'Loading content' })).toBeInTheDocument()
  })

  it('says when the changelog is unavailable', () => {
    act(() => useChangelogStore.setState({ loading: false, data: null, fetched: true }))
    render(<ChangelogContent />)
    expect(screen.getByText(/unavailable|not available/i)).toBeInTheDocument()
  })
})
