import { create } from 'zustand'

/** Main shell views: universe panels, social, lore, or changelog page. */
export type View = 'universe' | 'universe-testing' | 'social' | 'lore' | 'changelog'

interface NavigationState {
  currentView: View
  /** Switches the active shell view. */
  navigate: (view: View) => void
}

/**
 * Controls which top-level view is rendered inside the shell (below the navbar).
 */
export const useNavigationStore = create<NavigationState>((set) => ({
  currentView: 'universe',
  navigate: (view) => set({ currentView: view })
}))
