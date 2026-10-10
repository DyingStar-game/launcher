import { beforeEach, describe, expect, it } from 'vitest'
import { useEnvStore } from './env'
import { navSection, useNavigationStore } from './navigation'

const state = (): ReturnType<typeof useNavigationStore.getState> => useNavigationStore.getState()

beforeEach(() => {
  useEnvStore.setState({ activeEnv: 'universe-testing' })
  state().navigate('social')
})

describe('navigation store', () => {
  it('opens sheets in the active env and goes back through them', () => {
    state().openPlayer('p1')
    expect(state()).toMatchObject({
      currentView: 'player',
      subject: { id: 'p1', env: 'universe-testing' }
    })

    state().openOrganisation('c1')
    expect(state()).toMatchObject({ currentView: 'organisation', subject: { id: 'c1' } })

    state().back()
    expect(state()).toMatchObject({ currentView: 'player', subject: { id: 'p1' } })
    state().back()
    expect(state()).toMatchObject({ currentView: 'social', subject: null })
  })

  it('restores the page state of the location it returns to', () => {
    state().setPageState({ tab: 'players', query: 'kir' })
    state().openPlayer('p1')
    expect(state().pageState).toEqual({})
    state().setPageState({ scroll: 120 })
    state().openOrganisation('c1')
    state().back()
    expect(state().pageState).toEqual({ scroll: 120 })
    state().back()
    expect(state().pageState).toEqual({ tab: 'players', query: 'kir' })
  })

  it('clears the page state on a top-level view', () => {
    state().setPageState({ tab: 'players' })
    state().navigate('social')
    expect(state().pageState).toEqual({})
  })

  it('falls back to the social page without history', () => {
    state().navigate('lore')
    state().back()
    expect(state().currentView).toBe('social')
  })

  it('starts a fresh history on a top-level view', () => {
    state().openPlayer('p1')
    state().navigate('changelog')
    expect(state()).toMatchObject({ currentView: 'changelog', subject: null, history: [] })
  })

  it('files the sheets under Social in the navbar', () => {
    expect(navSection('player')).toBe('social')
    expect(navSection('organisation')).toBe('social')
    expect(navSection('lore')).toBe('lore')
  })
})
