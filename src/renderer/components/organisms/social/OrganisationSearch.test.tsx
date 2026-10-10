import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSocialStore } from '@stores/social'
import { seedSocial } from '../../../test/seedSocial'
import OrganisationSearch from './OrganisationSearch'

describe('OrganisationSearch', () => {
  it('reloads the directory with the search', async () => {
    seedSocial({})
    render(<OrganisationSearch />)
    await userEvent.type(screen.getByRole('textbox'), 'nova')
    await userEvent.click(screen.getByRole('button', { name: 'Search' }))
    expect(window.api.socialLoad).toHaveBeenCalledWith('universe-testing', 'nova')
    expect(useSocialStore.getState().data['universe-testing'].orgaSearch).toBe('nova')
  })
})
