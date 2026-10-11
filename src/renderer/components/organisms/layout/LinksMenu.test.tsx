import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import LinksMenu from './LinksMenu'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('LinksMenu', () => {
  it('opens the community links from one button', async () => {
    vi.stubEnv('VITE_NAV_WIKI_URL', 'https://wiki.example')
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    render(<LinksMenu />)
    await userEvent.click(screen.getByRole('button', { name: 'Community' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Wiki' }))
    expect(open).toHaveBeenCalledWith('https://wiki.example', '_blank')
  })
})
