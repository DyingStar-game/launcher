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
})
