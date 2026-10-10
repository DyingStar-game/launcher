import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import userEvent from '@testing-library/user-event'
import OrgaRow from './OrgaRow'

const orga = { id: 'c1', name: 'Nova Corp', ticker: 'NOVA' }

describe('OrgaRow', () => {
  it('shows its detail line and the given action', () => {
    render(
      <OrgaRow orga={orga} detail="12 members" onOpen={vi.fn()} action={<span>Action slot</span>} />
    )
    expect(screen.getByText('12 members')).toBeInTheDocument()
    expect(screen.getByText('Action slot')).toBeInTheDocument()
  })

  it('opens the sheet from the name', async () => {
    const onOpen = vi.fn()
    render(<OrgaRow orga={orga} detail="Officer" onOpen={onOpen} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open the organization Nova Corp' }))
    expect(onOpen).toHaveBeenCalledOnce()
  })
})
