import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { InstallProgressLabel } from '@shared/types/installProgress'
import type { PendingDownload } from '@shared/types/install'
import { useEnvStore, type Env } from './env'
import { useVersionStore } from './version'
import { useChangelogStore } from './changelog'
import { addTransferSample, transferRate, type TransferSample } from '@lib/transferRate'

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
  /** Transient: download speed while the archive is downloading, null otherwise. */
  bytesPerSecond: number | null
  /** Transient: a paused or interrupted download on disk, to resume (ADR 0036). */
  paused: PendingDownload | null
  /** Transient: the player asked to pause or cancel the download, main has not stopped it yet. */
  stopping: 'pause' | 'cancel' | null
}

/** Outcome of clearing Godot shader/chunk caches. */
export type ClearGodotCacheOutcome = 'success' | 'partial' | 'error'

type FilesState = {
  data: Record<Env, EnvFilesData>
  setInstallPath: (path: string) => void
  selectDirectory: () => Promise<void>
  install: () => Promise<void>
  update: () => Promise<void>
  /** Pauses the active environment's download, kept on disk (ADR 0036). */
  pause: () => Promise<void>
  /** Resumes the active environment's paused install or update. */
  resume: () => Promise<void>
  /** Cancels the active environment's download, running or paused. */
  cancel: () => Promise<void>
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
  progressEvent: null,
  bytesPerSecond: null,
  paused: null,
  stopping: null
}

const defaultData: Record<Env, EnvFilesData> = {
  universe: { ...defaultEnvData },
  'universe-testing': { ...defaultEnvData }
}

type SetFn = (fn: (s: FilesState) => Partial<FilesState>) => void

/** Ignores stale `syncInstalledVersions` results after a new install/update starts. */
let installedVersionSyncGeneration = 0

/** Download samples of the install in progress, for its speed. */
let transferSamples: TransferSample[] = []

/** Merges partial file/install fields for one environment. */
function patchEnv(set: SetFn, env: Env, patch: Partial<EnvFilesData>): void {
  set((s) => ({
    data: { ...s.data, [env]: { ...s.data[env], ...patch } }
  }))
}

/** Follows an install or update's progress, with the download speed while downloading. */
function followInstallProgress(set: SetFn, env: Env): void {
  transferSamples = []
  window.api.onInstallProgress((progress, label) => {
    let bytesPerSecond: number | null = null
    if (label.key === 'downloading' || label.key === 'downloadingIndeterminate') {
      transferSamples = addTransferSample(transferSamples, {
        at: Date.now(),
        bytes: label.downloaded
      })
      bytesPerSecond = transferRate(transferSamples)
    }
    patchEnv(set, env, { progress, progressEvent: label, bytesPerSecond })
  })
}

/**
 * Per-environment install path, download progress, and install/update actions.
 * Install metadata is persisted to disk via zustand/persist.
 */
export const useFilesStore = create<FilesState>()(
  persist(
    (set, get) => {
      /** The environment's paused or interrupted download on disk, or null. */
      const findPending = async (env: Env): Promise<PendingDownload | null> => {
        const { installPath } = get().data[env]
        return installPath ? ((await window.api.pendingDownload(env, installPath)) ?? null) : null
      }

      /** Looks for the environment's paused or interrupted download on disk. */
      const refreshPending = async (env: Env): Promise<void> => {
        if (get().data[env].installing) return
        const paused = await findPending(env)
        if (!get().data[env].installing) patchEnv(set, env, { paused })
      }

      /** Runs (or resumes) an install or update, and applies how it ended (ADR 0036). */
      const runInstall = async (kind: 'install' | 'update'): Promise<void> => {
        const env = useEnvStore.getState().activeEnv
        const { installPath, paused } = get().data[env]
        if (!installPath) {
          console.warn('[FilesStore] No install directory set.')
          return
        }

        installedVersionSyncGeneration += 1
        patchEnv(set, env, {
          installing: true,
          paused: null,
          stopping: null,
          progress: paused?.progress ?? 0,
          progressEvent: { key: kind === 'install' ? 'connecting' : 'checkingUpdates' }
        })
        followInstallProgress(set, env)
        const stopped = {
          installing: false,
          progressEvent: null,
          bytesPerSecond: null,
          stopping: null
        }

        try {
          const outcome = await window.api.installGame(env, installPath)
          if (outcome.status === 'paused') {
            // One update, straight to paused: no flash of the state before the download
            patchEnv(set, env, { ...stopped, paused: await findPending(env) })
            return
          }
          if (outcome.status === 'cancelled') {
            patchEnv(set, env, { ...stopped, progress: 0, paused: null })
            return
          }

          const { version, releaseDate } = outcome
          if (kind === 'update') {
            try {
              await window.api.clearGodotGameCache()
            } catch (cacheErr) {
              console.warn('[FilesStore] Godot cache clear after update:', cacheErr)
            }
          }
          patchEnv(set, env, {
            installed: true,
            version,
            releaseDate,
            installing: false,
            needsUpdate: false,
            progress: 100,
            progressEvent: {
              key: kind === 'install' ? 'completeInstall' : 'completeUpdate',
              version
            },
            bytesPerSecond: null
          })
          await get().syncInstalledVersions()
          void useVersionStore.getState().checkVersions()
          void useChangelogStore.getState().fetch()
        } catch (err) {
          console.error(`[FilesStore] ${kind} failed:`, err)
          // An interrupted download stays on disk: it shows as paused, to resume
          patchEnv(set, env, { ...stopped, progress: 0, paused: await findPending(env) })
        }
      }

      return {
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

        install: () => runInstall('install'),

        update: () => runInstall('update'),

        pause: async () => {
          const env = useEnvStore.getState().activeEnv
          patchEnv(set, env, { stopping: 'pause' })
          // Too late once extracting: the install goes on
          if ((await window.api.pauseInstall(env)) === false) patchEnv(set, env, { stopping: null })
        },

        resume: () =>
          runInstall(get().data[useEnvStore.getState().activeEnv].installed ? 'update' : 'install'),

        cancel: async () => {
          const env = useEnvStore.getState().activeEnv
          const { installPath, installing } = get().data[env]
          if (installing) patchEnv(set, env, { stopping: 'cancel' })
          if ((await window.api.cancelInstall(env, installPath)) === false) {
            patchEnv(set, env, { stopping: null })
            return
          }
          // A running download settles through `runInstall`; a paused one is gone now
          if (!installing) patchEnv(set, env, { paused: null, progress: 0 })
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
          await Promise.all(envs.map(refreshPending))
        }
      }
    },
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
