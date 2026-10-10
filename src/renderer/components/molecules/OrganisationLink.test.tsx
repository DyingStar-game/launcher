import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrganisationLink from './OrganisationLink'

describe('OrganisationLink', () => {
  it('shows name and ticker, and opens the sheet', async () => {
    const onOpen = vi.fn()
    render(
      <OrganisationLink
        organisation={{ id: 'c1', name: 'Nova Corp', ticker: 'NOVA' }}
        onOpen={onOpen}
      />
    )
    const link = screen.getByRole('button', { name: 'Open the organization Nova Corp' })
    expect(link).toHaveTextContent('Nova Corp [NOVA]')
    await userEvent.click(link)
    expect(onOpen).toHaveBeenCalledOnce()
  })

  it('uses the name look of the Button atom', () => {
    render(
      <OrganisationLink
        organisation={{ id: 'c1', name: 'Nova Corp', ticker: 'NOVA' }}
        onOpen={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Open the organization Nova Corp' })).toHaveClass(
      'font-medium',
      'hover:underline'
    )
  })
})
