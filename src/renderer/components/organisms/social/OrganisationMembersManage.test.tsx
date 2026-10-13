import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import type { OrganisationMember } from '@shared/types/social'
import { rank, seedSocial } from '../../../test/seedSocial'
import OrganisationMembersManage from './OrganisationMembersManage'

const subject = { id: 'c1', env: 'universe-testing' as const }
const member = (id: string, name: string, priority: number, isCeo = false): OrganisationMember => ({
  id,
  name,
  rank: isCeo ? 'CEO' : priority >= 50 ? 'Officer' : 'Pilot',
  rankId: isCeo ? 1 : priority >= 50 ? 2 : 3,
  rankPriority: priority,
  isCeo,
  status: 'offline'
})
const officer = rank({ id: 2, name: 'Officer', priority: 50, permissions: ['manage_members'] })

function seed(): void {
  seedSocial({ selfId: 'me' })
  vi.mocked(window.api.socialGetOrganisationMembers).mockResolvedValue({
    ok: true,
    data: {
      members: [
        member('ceo', 'Aurel', 99, true),
        member('me', 'Me', 50),
        member('o2', 'Ona', 50),
        member('p1', 'Kira', 10)
      ],
      total: 4
    }
  })
  vi.mocked(window.api.socialGetOrganisationRanks).mockResolvedValue({
    ok: true,
    data: [
      rank({ id: 1, name: 'CEO', priority: 99, isCeo: true }),
      officer,
      rank({ id: 3, name: 'Pilot', priority: 10 }),
      rank({ id: 4, name: 'Cadet', priority: 5 })
    ]
  })
}

describe('OrganisationMembersManage', () => {
  it('acts only on members strictly below the player', async () => {
    seed()
    render(<OrganisationMembersManage subject={subject} myRank={officer} selfId="me" />)
    expect(await screen.findByRole('button', { name: 'Rank of Kira' })).toBeInTheDocument()
    for (const name of ['Aurel', 'Me', 'Ona']) {
      expect(screen.queryByRole('button', { name: `Rank of ${name}` })).not.toBeInTheDocument()
    }
  })

  it('gives a rank below the player, never the CEO one', async () => {
    seed()
    vi.mocked(window.api.socialSetMemberRank).mockResolvedValue({ ok: true, data: undefined })
    render(<OrganisationMembersManage subject={subject} myRank={officer} selfId="me" />)
    await userEvent.click(await screen.findByRole('button', { name: 'Rank of Kira' }))
    const menu = await screen.findByRole('menu')
    expect(within(menu).queryByRole('menuitemradio', { name: 'CEO' })).not.toBeInTheDocument()
    expect(within(menu).queryByRole('menuitemradio', { name: 'Officer' })).not.toBeInTheDocument()
    await userEvent.click(within(menu).getByRole('menuitemradio', { name: 'Cadet' }))
    await waitFor(() =>
      expect(window.api.socialSetMemberRank).toHaveBeenCalledWith('universe-testing', 'c1', 'p1', 4)
    )
  })

  it("shows no rank menu when the only rank to give is the member's own", async () => {
    seed()
    vi.mocked(window.api.socialGetOrganisationRanks).mockResolvedValue({
      ok: true,
      data: [
        rank({ id: 1, name: 'CEO', priority: 99, isCeo: true }),
        officer,
        rank({ id: 3, name: 'Pilot', priority: 10 })
      ]
    })
    render(<OrganisationMembersManage subject={subject} myRank={officer} selfId="me" />)
    expect(await screen.findByRole('button', { name: 'Remove' })).toBeInTheDocument()
    // Once the ranks are loaded, the menu would have appeared
    await expect(
      screen.findByRole('button', { name: 'Rank of Kira' }, { timeout: 300 })
    ).rejects.toThrow()
  })

  it('removes a member after confirming', async () => {
    seed()
    vi.mocked(window.api.socialRemoveMember).mockResolvedValue({ ok: true, data: undefined })
    render(<OrganisationMembersManage subject={subject} myRank={officer} selfId="me" />)
    await userEvent.click(await screen.findByRole('button', { name: 'Remove' }))
    await userEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Remove' })
    )
    await waitFor(() =>
      expect(window.api.socialRemoveMember).toHaveBeenCalledWith('universe-testing', 'c1', 'p1')
    )
  })
})
