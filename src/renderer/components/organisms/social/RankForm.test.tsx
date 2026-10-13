import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { rank, seedSocial } from '../../../test/seedSocial'
import RankForm from './RankForm'

const officer = rank({ id: 2, name: 'Officer', priority: 50, permissions: ['manage_ranks'] })

describe('RankForm', () => {
  it('creates a rank with the permissions ticked', async () => {
    seedSocial({})
    vi.mocked(window.api.socialCreateRank).mockResolvedValue({ ok: true, data: undefined })
    const onDone = vi.fn()
    render(<RankForm organisationId="c1" myRank={officer} onDone={onDone} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Recruiter')
    await userEvent.clear(screen.getByRole('textbox', { name: 'Priority (0–99)' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Priority (0–99)' }), '20')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Answer applications' }))
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))
    await waitFor(() => expect(onDone).toHaveBeenCalledOnce())
    expect(window.api.socialCreateRank).toHaveBeenCalledWith('universe-testing', 'c1', {
      name: 'Recruiter',
      priority: 20,
      permissions: ['recruit']
    })
  })

  it('keeps a priority below the player rank', async () => {
    seedSocial({})
    render(<RankForm organisationId="c1" myRank={officer} onDone={vi.fn()} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Boss')
    await userEvent.clear(screen.getByRole('textbox', { name: 'Priority (0–99)' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Priority (0–99)' }), '60')
    expect(await screen.findByText("Lower than your own rank's priority.")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
  })

  it('keeps the permissions of other services when editing', async () => {
    seedSocial({})
    vi.mocked(window.api.socialUpdateRank).mockResolvedValue({ ok: true, data: undefined })
    const pilot = rank({
      id: 3,
      name: 'Pilot',
      priority: 10,
      isDefault: false,
      permissions: ['invite', 'market:trade']
    })
    render(<RankForm organisationId="c1" rank={pilot} myRank={officer} onDone={vi.fn()} />)
    await userEvent.click(screen.getByRole('checkbox', { name: 'Invite players' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(window.api.socialUpdateRank).toHaveBeenCalledWith('universe-testing', 'c1', 3, {
        name: 'Pilot',
        priority: 10,
        permissions: ['market:trade']
      })
    )
  })

  it('lets the CEO rank take a new name only', () => {
    seedSocial({})
    const ceo = rank({ id: 1, name: 'CEO', priority: 99, isCeo: true })
    render(<RankForm organisationId="c1" rank={ceo} myRank={ceo} onDone={vi.fn()} />)
    expect(screen.getByRole('textbox', { name: 'Priority (0–99)' })).toBeDisabled()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })
})
