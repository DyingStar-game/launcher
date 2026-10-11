import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { useEnvStore } from '@stores/env'
import { useNavigationStore } from '@stores/navigation'
import Navbar from './Navbar'

beforeEach(() => {
  act(() => {
    useEnvStore.setState({ activeEnv: 'universe-testing' })
    useNavigationStore.getState().navigate('social')
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('Navbar', () => {
  it('keeps nav buttons on one line so the bar keeps its height', () => {
    render(<Navbar />)
    for (const name of ['Universe', 'Universe Testing']) {
      expect(screen.getByRole('button', { name })).toHaveClass('whitespace-nowrap')
    }
  })

  it('hides the donate button below the wide breakpoint', () => {
    vi.stubEnv('VITE_NAV_DONATE_URL', 'https://donate.example')
    render(<Navbar />)
    const donate = screen.getByRole('button', { name: 'Donate' })
    // cn() drops the atom's own inline-flex, so `hidden` really applies
    expect(donate).toHaveClass('hidden', 'nav-full:inline-flex')
    expect(donate).not.toHaveClass('inline-flex')
    // Same corners as the other buttons (rounded-lg from the atom)
    expect(donate).toHaveClass('rounded-lg')
    expect(donate).not.toHaveAttribute('title')
  })

  it('explains an unconfigured donate link in a tooltip', async () => {
    vi.stubEnv('VITE_NAV_DONATE_URL', '')
    render(<Navbar />)
    const donate = screen.getByRole('button', { name: 'Support link not configured' })
    expect(donate).toBeDisabled()
    // A disabled button gets no events: its focusable wrapper carries layout and tooltip
    const wrapper = donate.parentElement as HTMLElement
    expect(wrapper).toHaveClass('hidden', 'nav-full:inline-flex')
    await userEvent.hover(wrapper)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Support link not configured')
  })

  it('never shrinks the side holding the window controls', () => {
    render(<Navbar />)
    expect(screen.getByRole('button', { name: 'Close' }).parentElement?.parentElement).toHaveClass(
      'shrink-0'
    )
  })

  it('folds the env switch into the menu below the narrow breakpoint', () => {
    render(<Navbar />)
    expect(screen.getByRole('button', { name: 'Universe Testing' }).parentElement).toHaveClass(
      'hidden',
      'nav-env:flex'
    )
  })

  it('draws the close button as an outline icon button (ADR 0028)', () => {
    render(<Navbar />)
    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('size-9', 'border-border')
  })

  it('shows the wiki with the open book of the admin panel', () => {
    render(<Navbar />)
    const wiki = screen.getByRole('button', { name: 'Open wiki' })
    expect(wiki.querySelector('svg')).toHaveClass('lucide-book-open')
  })

  it('separates its four groups (language, links, sound, window) with the same divider', () => {
    const { container } = render(<Navbar />)
    expect(container.querySelectorAll('div[aria-hidden="true"].w-px')).toHaveLength(3)
  })
})
