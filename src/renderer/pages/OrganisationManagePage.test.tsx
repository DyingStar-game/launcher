import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '../test/render'
import userEvent from '@testing-library/user-event'
import { useNavigationStore } from '@stores/navigation'
import { membership, rank, seedSocial } from '../test/seedSocial'
import OrganisationManagePage from './OrganisationManagePage'

beforeEach(() => {
  vi.mocked(window.api.socialGetOrganisation).mockResolvedValue({
    ok: true,
    data: {
      id: 'c1',
      name: 'Nova',
      ticker: 'NOVA',
      recruitment: 'open',
      members: 2,
      createdAt: '2026-10-01T00:00:00.000Z',
      subsidiaries: [],
      subsidiaryCount: 0
    }
  })
  vi.mocked(window.api.socialGetOrganisationMembers).mockResolvedValue({
    ok: true,
    data: { members: [], total: 0 }
  })
  vi.mocked(window.api.socialGetOrganisationRanks).mockResolvedValue({ ok: true, data: [] })
  vi.mocked(window.api.socialGetOrganisationRequests).mockResolvedValue({ ok: true, data: [] })
})

const open = (): void =>
  act(() => {
    useNavigationStore.getState().openOrganisation('c1')
    useNavigationStore.getState().openOrganisationManage('c1')
  })

describe('OrganisationManagePage', () => {
  it('shows only the tabs the rank opens', async () => {
    seedSocial({
      memberships: [
        membership({ id: 'c1', rank: rank({ permissions: ['invite', 'manage_ranks'] }) })
      ]
    })
    open()
    render(<OrganisationManagePage />)
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Manage Nova' })
    ).toBeInTheDocument()
    expect((await screen.findAllByRole('tab')).map((tab) => tab.textContent)).toEqual([
      'Invitations',
      'Ranks'
    ])
  })

  it('gives the CEO every tab, and comes back to the one left', async () => {
    seedSocial({ memberships: [membership({ id: 'c1', rank: rank({ isCeo: true }) })] })
    open()
    const { unmount } = render(<OrganisationManagePage />)
    expect(await screen.findAllByRole('tab')).toHaveLength(5)
    await userEvent.click(screen.getByRole('tab', { name: 'Leadership' }))
    act(() => useNavigationStore.getState().openPlayer('p1'))
    unmount()
    act(() => useNavigationStore.getState().back())
    render(<OrganisationManagePage />)
    expect(await screen.findByRole('tab', { name: 'Leadership' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })

  it('says when the rank no longer lets the player manage', async () => {
    seedSocial({ memberships: [membership({ id: 'c1' })] })
    open()
    render(<OrganisationManagePage />)
    expect(
      await screen.findByText('Your rank no longer lets you manage this organization.')
    ).toBeInTheDocument()
  })
})
