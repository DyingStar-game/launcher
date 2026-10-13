import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import type { PlayerProfile } from '@shared/types/social'
import { seedSocial } from '../../../test/seedSocial'
import { Toaster } from '@components/ui/sonner'
import ProfileEditForm from './ProfileEditForm'

const profile: PlayerProfile = {
  id: 'me',
  name: 'Kira',
  status: 'online',
  faction: 'Traders',
  characterName: 'Kira Vel',
  story: 'Born on Tarsis.',
  reputation: 0,
  playtimeHours: 0,
  memberSince: '2026-10-01T00:00:00.000Z',
  corporations: [],
  politics: []
}

describe('ProfileEditForm', () => {
  it('fills the fields with the profile, Save waiting for a change', () => {
    seedSocial({})
    render(<ProfileEditForm profile={profile} onDone={vi.fn()} />)
    expect(screen.getByRole('textbox', { name: 'Faction' })).toHaveValue('Traders')
    expect(screen.getByRole('textbox', { name: 'Biography' })).toHaveTextContent('')
    expect(screen.getByRole('textbox', { name: 'Character name' })).toHaveValue('Kira Vel')
    expect(screen.getByRole('textbox', { name: 'Story' })).toHaveTextContent('Born on Tarsis.')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('sends only what changed, then leaves', async () => {
    seedSocial({})
    vi.mocked(window.api.socialUpdateProfile).mockResolvedValue({ ok: true, data: undefined })
    const onDone = vi.fn()
    render(
      <>
        <ProfileEditForm profile={profile} onDone={onDone} />
        <Toaster />
      </>
    )
    await userEvent.clear(screen.getByRole('textbox', { name: 'Faction' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Alignment' }), 'Neutral')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onDone).toHaveBeenCalledOnce())
    const message = await screen.findByText('Profile saved.')
    expect(message.closest('[data-sonner-toast]')).not.toBeNull()
    expect(window.api.socialUpdateProfile).toHaveBeenCalledWith('universe-testing', {
      faction: null,
      rpSheet: { characterName: 'Kira Vel', alignment: 'Neutral', story: 'Born on Tarsis.' }
    })
  })

  it('keeps the values and explains a refusal', async () => {
    seedSocial({})
    vi.mocked(window.api.socialUpdateProfile).mockResolvedValue({
      ok: false,
      error: 'unavailable'
    })
    const onDone = vi.fn()
    render(<ProfileEditForm profile={profile} onDone={onDone} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Faction' }), ' guild')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText(/cannot be reached/)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Faction' })).toHaveValue('Traders guild')
    expect(onDone).not.toHaveBeenCalled()
  })

  it('leaves on Cancel without sending', async () => {
    seedSocial({})
    const onDone = vi.fn()
    render(<ProfileEditForm profile={profile} onDone={onDone} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onDone).toHaveBeenCalledOnce()
    expect(window.api.socialUpdateProfile).not.toHaveBeenCalled()
  })
})
