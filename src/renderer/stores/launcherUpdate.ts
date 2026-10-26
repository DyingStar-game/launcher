import { create } from 'zustand'
import type { LauncherUpdateState } from '@shared/types/launcherUpdate'

type LauncherUpdateStoreState = {
  /** Where the in-place update stands, pushed by main (ADR 0050). */
  update: LauncherUpdateState
  /** True from the restart click until the launcher quits, or main refuses. */
  installing: boolean
  /** The download or install of a found update failed, not told yet (an error toast). */
  failed: boolean
  /** Marks the failure as told. */
  ackFailure: () => void
  /** Quits and installs the downloaded launcher; false when main refused. */
  install: () => Promise<boolean>
}

/** The launcher's in-place update (ADR 0050); the release check itself stays `useVersionStore`. */
export const useLauncherUpdateStore = create<LauncherUpdateStoreState>((set, get) => {
  window.api.onLauncherUpdateState((update) => {
    // A check that fails finds nothing to tell; a download or an install that fails does
    const { status } = get().update
    const failed = update.status === 'error' && (status === 'downloading' || status === 'ready')
    set({ update, installing: false, ...(failed ? { failed } : {}) })
  })

  void window.api.getLauncherUpdateState().then((update) => {
    if (update) set({ update })
  })

  return {
    update: { status: 'unsupported' },
    installing: false,
    failed: false,

    ackFailure: () => set({ failed: false }),

    install: async () => {
      set({ installing: true })
      const started = await window.api.installLauncherUpdate()
      if (!started) set({ installing: false })
      return started
    }
  }
})
