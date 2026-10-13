import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import userEvent from '@testing-library/user-event'
import OrganisationIdentity from './OrganisationIdentity'

const organisation = { id: 'c1', name: 'Nova Corp', ticker: 'NOVA' }

describe('OrganisationIdentity', () => {
  it('shows the ticker avatar and the given lines', () => {
    render(
      <OrganisationIdentity organisation={organisation} onOpen={vi.fn()}>
        <span>Officer</span>
      </OrganisationIdentity>
    )
    expect(screen.getByText('NO')).toBeInTheDocument()
    expect(screen.getByText('Officer')).toBeInTheDocument()
  })

  it('opens the sheet from the name', async () => {
    const onOpen = vi.fn()
    render(<OrganisationIdentity organisation={organisation} onOpen={onOpen} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open the organization Nova Corp' }))
    expect(onOpen).toHaveBeenCalledOnce()
  })
})
