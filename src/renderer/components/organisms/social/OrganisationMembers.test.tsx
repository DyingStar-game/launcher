import { describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { OrganisationMember } from '@shared/types/social'
import { useNavigationStore } from '@stores/navigation'
import { seedSocial } from '../../../test/seedSocial'
import OrganisationMembers from './OrganisationMembers'

const member = (i: number): OrganisationMember => ({
  id: `m${i}`,
  name: `Member ${i}`,
  rank: i === 0 ? 'CEO' : 'Member',
  status: 'offline'
})
const subject = { id: 'c1', env: 'universe-testing' as const }

describe('OrganisationMembers', () => {
  it('loads the first page, then more on demand', async () => {
    seedSocial({})
    vi.mocked(window.api.socialGetOrganisationMembers)
      .mockResolvedValueOnce({ ok: true, data: { members: [0, 1].map(member), total: 3 } })
      .mockResolvedValueOnce({ ok: true, data: { members: [member(2)], total: 3 } })
    render(<OrganisationMembers subject={subject} />)

    expect(await screen.findByText('Member 0')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '3 members' })).toBeInTheDocument()
    expect(screen.getByText('CEO')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Load 1 more member' }))
    expect(await screen.findByText('Member 2')).toBeInTheDocument()
    expect(window.api.socialGetOrganisationMembers).toHaveBeenLastCalledWith(
      'universe-testing',
      'c1',
      2
    )
    expect(screen.queryByRole('button', { name: /Load/ })).not.toBeInTheDocument()
  })

  it('opens a member page', async () => {
    seedSocial({})
    vi.mocked(window.api.socialGetOrganisationMembers).mockResolvedValue({
      ok: true,
      data: { members: [member(1)], total: 1 }
    })
    render(<OrganisationMembers subject={subject} />)
    await userEvent.click(
      await screen.findByRole('button', { name: 'Open the profile of Member 1' })
    )
    expect(useNavigationStore.getState()).toMatchObject({
      currentView: 'player',
      subject: { id: 'm1' }
    })
  })

  it('shows a loading error', async () => {
    seedSocial({})
    vi.mocked(window.api.socialGetOrganisationMembers).mockResolvedValue({
      ok: false,
      error: 'unavailable'
    })
    render(<OrganisationMembers subject={subject} />)
    expect(await screen.findByText(/cannot be reached/)).toBeInTheDocument()
  })

  it('loads again as many members as were shown before Back', async () => {
    seedSocial({})
    act(() => useNavigationStore.getState().setPageState({ membersShown: 3 }))
    vi.mocked(window.api.socialGetOrganisationMembers)
      .mockResolvedValueOnce({ ok: true, data: { members: [0, 1].map(member), total: 4 } })
      .mockResolvedValueOnce({ ok: true, data: { members: [2, 3].map(member), total: 4 } })
    const onRestored = vi.fn()
    render(<OrganisationMembers subject={subject} onRestored={onRestored} />)

    expect(await screen.findByText('Member 3')).toBeInTheDocument()
    expect(window.api.socialGetOrganisationMembers).toHaveBeenCalledTimes(2)
    await waitFor(() => expect(onRestored).toHaveBeenCalledOnce())
  })

  it('remembers how many members were loaded', async () => {
    seedSocial({})
    vi.mocked(window.api.socialGetOrganisationMembers)
      .mockResolvedValueOnce({ ok: true, data: { members: [0].map(member), total: 2 } })
      .mockResolvedValueOnce({ ok: true, data: { members: [1].map(member), total: 2 } })
    render(<OrganisationMembers subject={subject} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Load 1 more member' }))
    await waitFor(() => expect(useNavigationStore.getState().pageState.membersShown).toBe(2))
  })

  it('shows a skeleton first, then a spinner in Load more while the next page loads', async () => {
    seedSocial({})
    let resolveFirst: (value: unknown) => void = () => {}
    vi.mocked(window.api.socialGetOrganisationMembers)
      .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)) as never)
      .mockReturnValueOnce(new Promise(() => {}))
    render(<OrganisationMembers subject={subject} />)
    expect(await screen.findByRole('status', { name: 'Loading content' })).toBeInTheDocument()

    await act(async () =>
      resolveFirst({ ok: true, data: { members: [0, 1].map(member), total: 3 } })
    )
    const more = await screen.findByRole('button', { name: 'Load 1 more member' })
    await userEvent.click(more)
    await waitFor(() => expect(more).toHaveAttribute('aria-busy', 'true'))
  })
})
