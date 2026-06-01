import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { InstallProgressLabel } from '@shared/types/installProgress'
import { useEnvStore, type Env } from './env'
import { useVersionStore } from './version'

export type EnvFilesData = {
  /** Persisted: game payload is installed under installPath/DyingStar */
  installed: boolean
  version: string | null
  releaseDate: string | null
  needsUpdate: boolean
  installPath: string
  /** Transient: install/update in progress */
  installing: boolean
  progress: number
  progressEvent: InstallProgressLabel | null
}

/** Outcome of clearing Godot shader/chunk caches. */
export type ClearGodotCacheOutcome = 'success' | 'partial' | 'error'

type FilesState = {
  data: Record<Env, EnvFilesData>
  setInstallPath: (path: string) => void
  selectDirectory: () => Promise<void>
  install: () => Promise<void>
  update: () => Promise<void>
  verify: () => Promise<void>
  clearCache: () => Promise<ClearGodotCacheOutcome>
  /**
   * Reconciles persisted install flags with files on disk (startup, env switch, verify).
   * Clears install state when the game folder or executable was removed manually.
   */
  syncInstalledVersions: () => Promise<void>
}

const defaultEnvData: EnvFilesData = {
  installed: false,
  version: null,
  releaseDate: null,
  needsUpdate: false,
  installPath: '',
  installing: false,
  progress: 0,
  progressEvent: null
}

const defaultData: Record<Env, EnvFilesData> = {
  universe: { ...defaultEnvData },
  'universe-testing': { ...defaultEnvData }
}

type SetFn = (fn: (s: FilesState) => Partial<FilesState>) => void

/** Ignores stale `syncInstalledVersions` results after a new install/update starts. */
let installedVersionSyncGeneration = 0

/** Merges partial file/install fields for one environment. */
function patchEnv(set: SetFn, env: Env, patch: Partial<EnvFilesData>): void {
  set((s) => ({
    data: { ...s.data, [env]: { ...s.data[env], ...patch } }
  }))
}

/**
 * Per-environment install path, download progress, and install/update actions.
 * Install metadata is persisted to disk via zustand/persist.
 */
export const useFilesStore = create<FilesState>()(
  persist(
    (set, get) => ({
      data: defaultData,

      setInstallPath: (path) => {
        const env = useEnvStore.getState().activeEnv
        patchEnv(set, env, { installPath: path })
      },

      selectDirectory: async () => {
        const selected = await window.api.selectDirectory()
        if (selected) {
          const env = useEnvStore.getState().activeEnv
          patchEnv(set, env, { installPath: selected })
        }
      },

      install: async () => {
        const env = useEnvStore.getState().activeEnv
        const { installPath } = get().data[env]
        if (!installPath) {
          console.warn('[FilesStore] No install directory set.')
          return
        }

        installedVersionSyncGeneration += 1
        patchEnv(set, env, { installing: true, progress: 0, progressEvent: { key: 'connecting' } })

        window.api.onInstallProgress((progress, label) => {
          patchEnv(set, env, { progress, progressEvent: label })
        })

        try {
          const { version, releaseDate } = await window.api.installGame(env, installPath)

          patchEnv(set, env, {
            installed: true,
            version,
            releaseDate,
            installing: false,
            needsUpdate: false,
            progress: 100,
            progressEvent: { key: 'completeInstall', version }
          })
          await get().syncInstalledVersions()
          void useVersionStore.getState().checkVersions()
        } catch (err) {
          console.error('[FilesStore] Install failed:', err)
          patchEnv(set, env, { installing: false, progress: 0, progressEvent: null })
        }
      },

      update: async () => {
        const env = useEnvStore.getState().activeEnv
        const { installPath } = get().data[env]
        if (!installPath) return

        installedVersionSyncGeneration += 1
        patchEnv(set, env, {
          installing: true,
          progress: 0,
          progressEvent: { key: 'checkingUpdates' }
        })

        window.api.onInstallProgress((progress, label) => {
          patchEnv(set, env, { progress, progressEvent: label })
        })

        try {
          const { version, releaseDate } = await window.api.installGame(env, installPath)

          try {
            await window.api.clearGodotGameCache()
          } catch (cacheErr) {
            console.warn('[FilesStore] Godot cache clear after update:', cacheErr)
          }

          patchEnv(set, env, {
            version,
            releaseDate,
            installing: false,
            needsUpdate: false,
            progress: 100,
            progressEvent: { key: 'completeUpdate', version }
          })
          await get().syncInstalledVersions()
          void useVersionStore.getState().checkVersions()
        } catch (err) {
          console.error('[FilesStore] Update failed:', err)
          patchEnv(set, env, { installing: false, progress: 0, progressEvent: null })
        }
      },

      verify: async () => {
        await get().syncInstalledVersions()
      },

      clearCache: async (): Promise<ClearGodotCacheOutcome> => {
        try {
          const result = await window.api.clearGodotGameCache()
          if (result.errors.length > 0) {
            console.warn('[FilesStore] Godot cache — errors:', result.errors)
            return 'partial'
          }
          console.log('[FilesStore] Godot cache cleared', {
            root: result.root,
            removed: result.removed.length
          })
          return 'success'
        } catch (err) {
          console.error('[FilesStore] Godot cache clear failed:', err)
          return 'error'
        }
      },

      syncInstalledVersions: async () => {
        const generation = ++installedVersionSyncGeneration
        const envs: Env[] = ['universe', 'universe-testing']
        const patches: Array<{ env: Env; patch: Partial<EnvFilesData> }> = []

        await Promise.all(
          envs.map(async (env) => {
            const { installPath } = get().data[env]
            if (!installPath) {
              if (get().data[env].installed) {
                patches.push({
                  env,
                  patch: {
                    installed: false,
                    version: null,
                    releaseDate: null,
                    needsUpdate: false
                  }
                })
              }
              return
            }
            try {
              const resolved = await window.api.resolveInstalledVersion(env, installPath)
              if (!resolved?.version) {
                patches.push({
                  env,
                  patch: {
                    installed: false,
                    version: null,
                    releaseDate: null,
                    needsUpdate: false
                  }
                })
                return
              }
              patches.push({
                env,
                patch: {
                  installed: true,
                  version: resolved.version,
                  releaseDate: resolved.releaseDate
                }
              })
            } catch (err) {
              console.warn('[FilesStore] Sync installed version:', env, err)
              patches.push({
                env,
                patch: {
                  installed: false,
                  version: null,
                  releaseDate: null,
                  needsUpdate: false
                }
              })
            }
          })
        )

        if (generation !== installedVersionSyncGeneration) return
        for (const { env, patch } of patches) {
          patchEnv(set, env, patch)
        }
      }
    }),
    {
      name: 'dyingstar-files',
      /** Persists only install metadata, not transient progress flags. */
      partialize: (state) => ({
        data: {
          universe: {
            installed: state.data.universe.installed,
            version: state.data.universe.version,
            releaseDate: state.data.universe.releaseDate,
            needsUpdate: state.data.universe.needsUpdate,
            installPath: state.data.universe.installPath
          },
          'universe-testing': {
            installed: state.data['universe-testing'].installed,
            version: state.data['universe-testing'].version,
            releaseDate: state.data['universe-testing'].releaseDate,
            needsUpdate: state.data['universe-testing'].needsUpdate,
            installPath: state.data['universe-testing'].installPath
          }
        }
      }),
      /** Restores persisted slice and merges with default transient fields. */
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<FilesState>
        return {
          ...current,
          data: {
            universe: { ...defaultEnvData, ...(p.data?.universe ?? {}) },
            'universe-testing': { ...defaultEnvData, ...(p.data?.['universe-testing'] ?? {}) }
          }
        }
      },
      /** After disk rehydrate, refresh installed version from local `version.json`. */
      onRehydrateStorage: () => (state) => {
        if (state) void state.syncInstalledVersions()
      }
    }
  )
)
