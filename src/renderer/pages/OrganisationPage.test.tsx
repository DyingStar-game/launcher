import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { useNavigationStore } from '@stores/navigation'
import { useSocialStore } from '@stores/social'
import { SocialStoreError } from '@lib/socialErrors'
import OrganisationPage from './OrganisationPage'

beforeEach(() => {
  act(() => useNavigationStore.getState().openOrganisation('x1'))
})

describe('OrganisationPage', () => {
  it('shows a muted loading line while the organisation loads', () => {
    act(() =>
      useSocialStore.setState({ getOrganisation: vi.fn(() => new Promise<never>(() => {})) })
    )
    render(<OrganisationPage />)
    expect(screen.getByText('Loading...')).toHaveClass('text-[var(--color-ds-muted)]')
  })

  it('shows the translated error in red', async () => {
    act(() =>
      useSocialStore.setState({
        getOrganisation: vi.fn(() => Promise.reject(new SocialStoreError('unavailable')))
      })
    )
    render(<OrganisationPage />)
    expect(
      await screen.findByText('The social service cannot be reached. Try again later.')
    ).toHaveClass('text-red-400')
  })
})
