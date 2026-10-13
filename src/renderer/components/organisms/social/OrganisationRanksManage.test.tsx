import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { rank, seedSocial } from '../../../test/seedSocial'
import OrganisationRanksManage from './OrganisationRanksManage'

const subject = { id: 'c1', env: 'universe-testing' as const }
const officer = rank({
  id: 2,
  name: 'Officer',
  priority: 50,
  permissions: ['manage_ranks'],
  isDefault: false
})

function seed(): void {
  seedSocial({})
  vi.mocked(window.api.socialGetOrganisationRanks).mockResolvedValue({
    ok: true,
    data: [
      rank({ id: 1, name: 'CEO', priority: 99, isCeo: true, isDefault: false }),
      officer,
      rank({ id: 3, name: 'Pilot', priority: 10, isDefault: true, permissions: ['recruit'] }),
      rank({ id: 4, name: 'Cadet', priority: 5, isDefault: false })
    ]
  })
}

describe('OrganisationRanksManage', () => {
  it('lists the ranks with their permissions, editable only below the player', async () => {
    seed()
    render(<OrganisationRanksManage subject={subject} myRank={officer} />)
    expect(await screen.findByText('Answer applications')).toBeInTheDocument()
    // Pilot and Cadet are below the officer: Edit on both, Delete on Cadet (Pilot is the default)
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(1)
  })

  it('deletes a rank after confirming', async () => {
    seed()
    vi.mocked(window.api.socialDeleteRank).mockResolvedValue({ ok: true, data: undefined })
    render(<OrganisationRanksManage subject={subject} myRank={officer} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }))
    await userEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete' })
    )
    await waitFor(() =>
      expect(window.api.socialDeleteRank).toHaveBeenCalledWith('universe-testing', 'c1', 4)
    )
  })

  it('opens the form to create a rank', async () => {
    seed()
    render(<OrganisationRanksManage subject={subject} myRank={officer} />)
    await userEvent.click(await screen.findByRole('button', { name: 'New rank' }))
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
  })
})
