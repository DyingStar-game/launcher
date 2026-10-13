import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '../test/render'
import { useNavigationStore } from '@stores/navigation'
import OrganisationPage from './OrganisationPage'

beforeEach(() => {
  act(() => useNavigationStore.getState().openOrganisation('x1'))
})

describe('OrganisationPage', () => {
  it('shows a skeleton of the page while the organisation loads, after a short delay', async () => {
    vi.mocked(window.api.socialGetOrganisation).mockReturnValue(new Promise(() => {}))
    render(<OrganisationPage />)
    expect(screen.queryByRole('status', { name: 'Loading content' })).not.toBeInTheDocument()
    expect(await screen.findByRole('status', { name: 'Loading content' })).toHaveAttribute(
      'aria-busy',
      'true'
    )
  })

  it('shows the translated error in red', async () => {
    vi.mocked(window.api.socialGetOrganisation).mockResolvedValue({
      ok: false,
      error: 'unavailable'
    })
    render(<OrganisationPage />)
    expect(
      await screen.findByText('The social service cannot be reached. Try again later.')
    ).toHaveClass('text-red-400')
  })
})
