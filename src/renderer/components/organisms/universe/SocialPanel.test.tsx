import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { useNavigationStore } from '@stores/navigation'
import { seedSocial } from '../../../test/seedSocial'
import SocialPanel from './SocialPanel'

describe('SocialPanel', () => {
  it('shows friends and the number of incoming requests', async () => {
    seedSocial({
      friends: [{ id: 'p1', name: 'Kira', status: 'online' }],
      incoming: [{ id: 1, playerId: 'p2', name: 'Zed' }]
    })
    render(<SocialPanel />)
    expect(await screen.findByText('Kira')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('opens a friend sheet, and the social page', async () => {
    seedSocial({ friends: [{ id: 'p1', name: 'Kira', status: 'online' }] })
    render(<SocialPanel />)
    await userEvent.click(await screen.findByRole('button', { name: 'Open the profile of Kira' }))
    expect(useNavigationStore.getState()).toMatchObject({
      currentView: 'player',
      subject: { id: 'p1' }
    })
    await userEvent.click(screen.getByRole('button', { name: /See all/ }))
    expect(useNavigationStore.getState().currentView).toBe('social')
  })

  it('shows a skeleton of the friend list while loading', async () => {
    seedSocial({})
    vi.mocked(window.api.socialLoad).mockReturnValue(new Promise(() => {}))
    render(<SocialPanel />)
    expect(await screen.findByRole('status', { name: 'Loading content' })).toBeInTheDocument()
  })
})
