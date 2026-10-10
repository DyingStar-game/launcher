import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { seedSocial } from '../../../test/seedSocial'
import CreateOrganisationForm from './CreateOrganisationForm'

describe('CreateOrganisationForm', () => {
  it('upper-cases the ticker and creates the organisation', async () => {
    seedSocial({})
    vi.mocked(window.api.socialCreateOrganisation).mockResolvedValue({ ok: true, data: undefined })
    render(<CreateOrganisationForm onClose={vi.fn()} />)
    const [name, ticker] = screen.getAllByRole('textbox')
    await userEvent.type(name, 'Nova Corp')
    await userEvent.type(ticker, 'nova12')
    expect(ticker).toHaveValue('NOVA1')
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))
    expect(window.api.socialCreateOrganisation).toHaveBeenCalledWith(
      'universe-testing',
      'Nova Corp',
      'NOVA1'
    )
    expect(await screen.findByText('Organization created!')).toBeInTheDocument()
  })

  it('shows why the creation was refused', async () => {
    seedSocial({})
    vi.mocked(window.api.socialCreateOrganisation).mockResolvedValue({
      ok: false,
      error: 'nameOrTickerTaken'
    })
    render(<CreateOrganisationForm onClose={vi.fn()} />)
    const [name, ticker] = screen.getAllByRole('textbox')
    await userEvent.type(name, 'Nova Corp')
    await userEvent.type(ticker, 'NOVA')
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))
    expect(
      await screen.findByText('This organization name or ticker is already taken.')
    ).toBeInTheDocument()
  })
})
