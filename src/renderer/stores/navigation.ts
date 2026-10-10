import { create } from 'zustand'
import type { Env } from '@shared/types/env'
import { useEnvStore } from './env'

/** Views about one player or organisation (ADR 0012, 0020): they have a subject and Back. */
export type SubjectView = 'player' | 'organisation' | 'profileEdit' | 'organisationManage'

/** Shell views: universe panels, social, lore, changelog, and the social sheets (ADR 0012). */
export type View = 'universe' | 'universe-testing' | 'social' | 'lore' | 'changelog' | SubjectView

/** Player or organisation shown by a subject view, in the env it came from. */
export type Subject = { id: string; env: Env }

/** Views reached from the navbar or the env switch. */
export type TopView = Exclude<View, SubjectView>

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
  /** Opens the edit page of the player's own profile (ADR 0020). */
  openProfileEdit: (playerId: string) => void
  /** Opens the management page of one of the player's organisations (ADR 0021). */
  openOrganisationManage: (corporationId: string) => void
  /** Returns to the previous location, or to the social page when there is none. */
  back: () => void
}

const SUBJECT_VIEWS: readonly View[] = [
  'player',
  'organisation',
  'profileEdit',
  'organisationManage'
]

/** Navbar section a view belongs to: the sheets and their edit pages belong to Social. */
export function navSection(view: View): View {
  return SUBJECT_VIEWS.includes(view) ? 'social' : view
}

/**
 * Controls which page is rendered inside the app layout (below the navbar), with a back history
 * for the player and organisation pages.
 */
export const useNavigationStore = create<NavigationState>((set) => {
  const open = (view: SubjectView, id: string): void =>
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
    openProfileEdit: (playerId) => open('profileEdit', playerId),
    openOrganisationManage: (corporationId) => open('organisationManage', corporationId),
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
