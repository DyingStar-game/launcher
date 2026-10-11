import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import NavbarMoreMenu from './NavbarMoreMenu'
import type { NavbarEnvOption } from './NavbarMoreMenu'

const envs: NavbarEnvOption[] = [
  { env: 'universe', label: 'Universe' },
  { env: 'universe-testing', label: 'Universe Testing' }
]

// jsdom has no matchMedia; the menu listens to it to close on wide windows.
beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('NavbarMoreMenu', () => {
  it('lists the env switch, languages and community links, not the universe sections', async () => {
    render(<NavbarMoreMenu envs={envs} activeEnv="universe" onEnvSwitch={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'More' }))
    for (const name of ['Universe', 'English', 'Discord']) {
      expect(screen.getByRole('menuitem', { name })).toBeInTheDocument()
    }
    expect(screen.queryByRole('menuitem', { name: 'Changelog' })).not.toBeInTheDocument()
  })

  it('switches the env from the menu and closes', async () => {
    const onEnvSwitch = vi.fn()
    render(<NavbarMoreMenu envs={envs} activeEnv="universe" onEnvSwitch={onEnvSwitch} />)
    await userEvent.click(screen.getByRole('button', { name: 'More' }))
    expect(screen.getByRole('menuitem', { name: 'Universe' })).toHaveAttribute(
      'aria-current',
      'true'
    )
    await userEvent.click(screen.getByRole('menuitem', { name: 'Universe Testing' }))
    expect(onEnvSwitch).toHaveBeenCalledWith('universe-testing')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('opens on the first entry with the keyboard, moves with the arrows and gives focus back on Escape', async () => {
    render(<NavbarMoreMenu envs={envs} activeEnv="universe" onEnvSwitch={vi.fn()} />)
    const toggle = screen.getByRole('button', { name: 'More' })
    toggle.focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('menuitem', { name: 'Universe' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Universe Testing' })).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(toggle).toHaveFocus()
  })

  it('keeps the look of its entries: hand cursor, own padding', async () => {
    render(<NavbarMoreMenu envs={envs} activeEnv="universe" onEnvSwitch={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'More' }))
    const item = screen.getByRole('menuitem', { name: 'English' })
    expect(item).toHaveClass('cursor-pointer', 'py-2')
    expect(item).not.toHaveClass('cursor-default')
  })
})
