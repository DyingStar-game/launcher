import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { seedSocial } from '../../../test/seedSocial'
import { Toaster } from '@components/ui/sonner'
import CreateOrganisationForm from './CreateOrganisationForm'

describe('CreateOrganisationForm', () => {
  it('upper-cases the ticker and creates the organisation', async () => {
    seedSocial({})
    vi.mocked(window.api.socialCreateOrganisation).mockResolvedValue({ ok: true, data: undefined })
    const onClose = vi.fn()
    render(
      <>
        <CreateOrganisationForm onClose={onClose} />
        <Toaster />
      </>
    )
    const [name, ticker] = screen.getAllByRole('textbox')
    await userEvent.type(name, 'Nova Corp')
    await userEvent.type(ticker, 'nova12')
    expect(ticker).toHaveValue('NOVA1')
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))
    expect(window.api.socialCreateOrganisation).toHaveBeenCalledWith('universe-testing', {
      name: 'Nova Corp',
      ticker: 'NOVA1'
    })
    // Told in a toast, the form closes at once
    const message = await screen.findByText('Organization created!')
    expect(message.closest('[data-sonner-toast]')).not.toBeNull()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows why the creation was refused', async () => {
    seedSocial({})
    vi.mocked(window.api.socialCreateOrganisation).mockResolvedValue({
      ok: false,
      error: 'nameOrTickerTaken'
    })
    const onClose = vi.fn()
    render(
      <>
        <CreateOrganisationForm onClose={onClose} />
        <Toaster />
      </>
    )
    const [name, ticker] = screen.getAllByRole('textbox')
    await userEvent.type(name, 'Nova Corp')
    await userEvent.type(ticker, 'NOVA')
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))
    expect(
      await screen.findByText('This organization name or tag is already taken.')
    ).toBeInTheDocument()
  })

  it('keeps Create disabled and explains while a field is invalid', async () => {
    seedSocial({})
    render(<CreateOrganisationForm onClose={vi.fn()} />)
    const create = screen.getByRole('button', { name: 'Create' })
    expect(create).toBeDisabled()
    await userEvent.type(screen.getByRole('textbox', { name: 'Organization name' }), 'No')
    await userEvent.type(screen.getByRole('textbox', { name: /Tag/ }), 'N')
    expect(await screen.findByText('3 to 48 characters.')).toBeInTheDocument()
    expect(screen.getByText('2 to 5 letters or digits.')).toBeInTheDocument()
    expect(create).toBeDisabled()
    expect(window.api.socialCreateOrganisation).not.toHaveBeenCalled()
  })
})
