import { create } from 'zustand'

export type View = 'universe' | 'universe-testing' | 'social' | 'lore'

interface NavigationState {
  currentView: View
  navigate: (view: View) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentView: 'universe',
  navigate: (view) => set({ currentView: view })
}))