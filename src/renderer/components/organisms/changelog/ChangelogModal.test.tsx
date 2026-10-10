import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChangelogModal from './ChangelogModal'

const props = { title: 'Changelog', loadingLabel: 'Loading', emptyLabel: 'Empty', onClose: vi.fn() }

describe('ChangelogModal', () => {
  it('renders nothing when closed', () => {
    render(<ChangelogModal {...props} open={false} markdown="# Hi" />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the markdown', () => {
    render(<ChangelogModal {...props} open markdown="## Version 1" />)
    expect(screen.getByRole('heading', { name: 'Version 1' })).toBeInTheDocument()
  })

  it('shows loading, then empty', () => {
    const { rerender } = render(<ChangelogModal {...props} open loading markdown={null} />)
    expect(screen.getByText('Loading')).toBeInTheDocument()
    rerender(<ChangelogModal {...props} open markdown="" />)
    expect(screen.getByText('Empty')).toBeInTheDocument()
  })
})
