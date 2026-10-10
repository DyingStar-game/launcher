import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import NavbarMoreMenu from './NavbarMoreMenu'
import type { NavbarEnvOption, NavbarSection } from './NavbarMoreMenu'

const sections: NavbarSection[] = [
  { label: 'Social', view: 'social' },
  { label: 'Lore', view: 'lore' },
  { label: 'Changelog', view: 'changelog' }
]

const envs: NavbarEnvOption[] = [
  { env: 'universe', label: 'Universe' },
  { env: 'universe-testing', label: 'Universe Testing' }
]
const envProps = { envs, activeEnv: 'universe' as const, onEnvSwitch: vi.fn() }

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
  it('lists the sections and marks the current one', async () => {
    render(
      <NavbarMoreMenu
        {...envProps}
        sections={sections}
        currentSection="lore"
        onNavigate={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'More' }))
    expect(screen.getByRole('menuitem', { name: 'Social' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('menuitem', { name: 'Lore' })).toHaveAttribute('aria-current', 'true')
  })

  it('navigates to a section and closes', async () => {
    const onNavigate = vi.fn()
    render(
      <NavbarMoreMenu
        {...envProps}
        sections={sections}
        currentSection="social"
        onNavigate={onNavigate}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'More' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Changelog' }))
    expect(onNavigate).toHaveBeenCalledWith('changelog')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('shows a badge on the toggle when a section has one', () => {
    const { rerender } = render(
      <NavbarMoreMenu
        {...envProps}
        sections={sections}
        currentSection="social"
        onNavigate={vi.fn()}
      />
    )
    expect(screen.queryByTestId('navbar-more-badge')).not.toBeInTheDocument()
    rerender(
      <NavbarMoreMenu
        {...envProps}
        sections={[...sections.slice(0, 2), { label: 'Changelog', view: 'changelog', badge: true }]}
        currentSection="social"
        onNavigate={vi.fn()}
      />
    )
    expect(screen.getByTestId('navbar-more-badge')).toBeInTheDocument()
  })

  it('switches the env from the menu and closes', async () => {
    const onEnvSwitch = vi.fn()
    render(
      <NavbarMoreMenu
        sections={sections}
        currentSection="social"
        onNavigate={vi.fn()}
        envs={envs}
        activeEnv="universe"
        onEnvSwitch={onEnvSwitch}
      />
    )
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
    render(
      <NavbarMoreMenu
        {...envProps}
        sections={sections}
        currentSection="social"
        onNavigate={vi.fn()}
      />
    )
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
    render(
      <NavbarMoreMenu
        {...envProps}
        sections={sections}
        currentSection="social"
        onNavigate={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'More' }))
    const item = screen.getByRole('menuitem', { name: 'Lore' })
    expect(item).toHaveClass('cursor-pointer', 'py-2')
    expect(item).not.toHaveClass('cursor-default')
  })
})
