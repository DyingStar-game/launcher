import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '../test/render'
import { useNavigationStore } from '@stores/navigation'
import { seedSocial } from '../test/seedSocial'
import ProfileEditPage from './ProfileEditPage'

beforeEach(() => {
  seedSocial({ selfId: 'me' })
  act(() => {
    useNavigationStore.getState().openPlayer('me')
    useNavigationStore.getState().openProfileEdit('me')
  })
})

describe('ProfileEditPage', () => {
  it('loads the profile into the form', async () => {
    vi.mocked(window.api.socialGetPlayer).mockResolvedValue({
      ok: true,
      data: {
        id: 'me',
        name: 'Kira',
        status: 'online',
        faction: 'Traders',
        reputation: 0,
        playtimeHours: 0,
        memberSince: '2026-10-01T00:00:00.000Z',
        corporations: [],
        politics: []
      }
    })
    render(<ProfileEditPage />)
    expect(await screen.findByRole('textbox', { name: 'Faction' })).toHaveValue('Traders')
    expect(screen.getByRole('heading', { level: 1, name: 'Edit my profile' })).toBeInTheDocument()
  })

  it('goes back to the sheet', async () => {
    vi.mocked(window.api.socialGetPlayer).mockReturnValue(new Promise(() => {}))
    render(<ProfileEditPage />)
    await screen.findByRole('button', { name: /Back/ }).then((b) => b.click())
    expect(useNavigationStore.getState().currentView).toBe('player')
  })

  it('shows the translated error in red', async () => {
    vi.mocked(window.api.socialGetPlayer).mockResolvedValue({ ok: false, error: 'unavailable' })
    render(<ProfileEditPage />)
    expect(await screen.findByText(/cannot be reached/)).toHaveClass('text-red-400')
  })
})
