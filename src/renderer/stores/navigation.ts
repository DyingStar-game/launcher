import { create } from 'zustand'
import type { Env } from '@shared/types/env'
import { useEnvStore } from './env'

/** Shell views: universe panels, social, lore, changelog, and the social sheets (ADR 0012). */
export type View =
  'universe' | 'universe-testing' | 'social' | 'lore' | 'changelog' | 'player' | 'organisation'

/** Player or organisation shown by the `player` / `organisation` views, in the env it came from. */
export type Subject = { id: string; env: Env }

/** Views reached from the navbar or the env switch. */
export type TopView = Exclude<View, 'player' | 'organisation'>

/** UI state of a page kept with its history location (ADR 0013): tab, search, scroll… */
export type PageState = Record<string, unknown>

type Location = { view: View; subject: Subject | null; pageState: PageState }

interface NavigationState {
  currentView: View
  subject: Subject | null
  /** UI state of the current page; restored by `back()` (ADR 0013). */
  pageState: PageState
  /** Merges keys into the current page state. */
  setPageState: (patch: PageState) => void
  /** Previous locations, for `back()`. */
  history: Location[]
  /** Switches to a top-level view and starts a fresh history (navbar, env switch). */
  navigate: (view: TopView) => void
  /** Opens a player's page in the active env, remembering where we came from. */
  openPlayer: (playerId: string) => void
  /** Opens an organisation's page in the active env, remembering where we came from. */
  openOrganisation: (corporationId: string) => void
  /** Returns to the previous location, or to the social page when there is none. */
  back: () => void
}

/** Navbar section a view belongs to: the sheets belong to Social. */
export function navSection(view: View): View {
  return view === 'player' || view === 'organisation' ? 'social' : view
}

/**
 * Controls which page is rendered inside the app layout (below the navbar), with a back history
 * for the player and organisation pages.
 */
export const useNavigationStore = create<NavigationState>((set) => {
  const open = (view: 'player' | 'organisation', id: string): void =>
    set((s) => ({
      currentView: view,
      subject: { id, env: useEnvStore.getState().activeEnv },
      pageState: {},
      history: [...s.history, { view: s.currentView, subject: s.subject, pageState: s.pageState }]
    }))

  return {
    currentView: 'universe',
    subject: null,
    pageState: {},
    setPageState: (patch) => set((s) => ({ pageState: { ...s.pageState, ...patch } })),
    history: [],
    navigate: (view) => set({ currentView: view, subject: null, pageState: {}, history: [] }),
    openPlayer: (playerId) => open('player', playerId),
    openOrganisation: (corporationId) => open('organisation', corporationId),
    back: () =>
      set((s) => {
        const previous = s.history.at(-1)
        if (!previous) return { currentView: 'social', subject: null, pageState: {} }
        return {
          currentView: previous.view,
          subject: previous.subject,
          pageState: previous.pageState,
          history: s.history.slice(0, -1)
        }
      })
  }
})
