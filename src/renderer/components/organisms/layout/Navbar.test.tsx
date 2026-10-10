import { beforeEach, describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
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

describe('Navbar', () => {
  it('keeps Social highlighted on a player page', () => {
    act(() => useNavigationStore.getState().openPlayer('p1'))
    render(<Navbar />)
    expect(screen.getByRole('button', { name: 'Social' })).toHaveClass('bg-white/10')
    expect(screen.getByRole('button', { name: 'Lore' })).not.toHaveClass('bg-white/10')
  })

  it('navigates to a section with a fresh history', async () => {
    act(() => useNavigationStore.getState().openPlayer('p1'))
    render(<Navbar />)
    await userEvent.click(screen.getByRole('button', { name: 'Lore' }))
    expect(useNavigationStore.getState()).toMatchObject({ currentView: 'lore', history: [] })
  })

  it('keeps nav buttons on one line so the bar keeps its height', () => {
    render(<Navbar />)
    for (const name of ['Universe', 'Universe Testing', 'Social', 'Changelog']) {
      expect(screen.getByRole('button', { name })).toHaveClass('whitespace-nowrap')
    }
  })

  it('hides the donate button below the wide breakpoint', () => {
    render(<Navbar />)
    expect(
      screen.getByRole('button', { name: /^(Donate|Support link not configured)$/ }).parentElement
    ).toHaveClass('hidden', 'min-[1400px]:flex')
  })

  it('folds the section links into the menu below the wide breakpoint', () => {
    render(<Navbar />)
    expect(screen.getByRole('button', { name: 'Social' }).parentElement).toHaveClass(
      'hidden',
      'min-[1400px]:flex'
    )
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
      'min-[800px]:flex'
    )
  })
})
