import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrgaRow from './OrgaRow'

const orga = {
  id: 'c1',
  name: 'Nova Corp',
  ticker: 'NOVA',
  members: 12,
  recruitment: 'apply' as const,
  isMember: false,
  applicationPending: false
}

describe('OrgaRow', () => {
  it('shows the member count and the given action', () => {
    render(<OrgaRow orga={orga} onOpen={vi.fn()} action={<span>Action slot</span>} />)
    expect(screen.getByText('12 members')).toBeInTheDocument()
    expect(screen.getByText('Action slot')).toBeInTheDocument()
  })

  it('opens the sheet from the name', async () => {
    const onOpen = vi.fn()
    render(<OrgaRow orga={orga} onOpen={onOpen} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open the organization Nova Corp' }))
    expect(onOpen).toHaveBeenCalledOnce()
  })
})
