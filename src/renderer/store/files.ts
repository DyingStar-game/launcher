import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useEnvStore, type Env } from './env'
import { useVersionStore } from './version'

// ─── Types ────────────────────────────────────────────────────────────────────

export type EnvFilesData = {
  // Persistés
  installed: boolean
  version: string | null
  releaseDate: string | null
  needsUpdate: boolean
  installPath: string
  // Transitoires
  installing: boolean
  progress: number
  progressLabel: string
}

/** Résultat du vidage cache Godot (shader_cache / chunk_cache). */
export type ClearGodotCacheOutcome = 'success' | 'partial' | 'error'

type FilesState = {
  data: Record<Env, EnvFilesData>

  setInstallPath: (path: string) => void
  selectDirectory: () => Promise<void>
  install: () => Promise<void>
  update: () => Promise<void>
  verify: () => Promise<void>
  clearCache: () => Promise<ClearGodotCacheOutcome>
  syncInstalledVersions: () => Promise<void>
}

// ─── Valeurs par défaut ───────────────────────────────────────────────────────

const defaultEnvData: EnvFilesData = {
  installed: false,
  version: null,
  releaseDate: null,
  needsUpdate: false,
  installPath: '',
  installing: false,
  progress: 0,
  progressLabel: ''
}

const defaultData: Record<Env, EnvFilesData> = {
  'universe':         { ...defaultEnvData },
  'universe-testing': { ...defaultEnvData }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

type SetFn = (fn: (s: FilesState) => Partial<FilesState>) => void

function patchEnv(set: SetFn, env: Env, patch: Partial<EnvFilesData>): void {
  set((s) => ({
    data: { ...s.data, [env]: { ...s.data[env], ...patch } }
  }))
}

// ─── Store ────────────────────────────────────────────────────────────────────

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
          console.warn('[FilesStore] Aucun répertoire d\'installation défini.')
          return
        }

        patchEnv(set, env, { installing: true, progress: 0, progressLabel: 'Connexion au serveur...' })

        window.api.onInstallProgress((progress, label) => {
          patchEnv(set, env, { progress, progressLabel: label })
        })

        try {
          // installGame retourne maintenant { version, releaseDate } depuis version.json
          const { version, releaseDate } = await window.api.installGame(env, installPath)

          patchEnv(set, env, {
            installed: true,
            version,
            releaseDate,
            installing: false,
            needsUpdate: false,
            progress: 100,
            progressLabel: `Installation terminée — v${version}`
          })
          void useVersionStore.getState().checkVersions()
        } catch (err) {
          console.error('[FilesStore] Échec installation :', err)
          patchEnv(set, env, { installing: false, progress: 0, progressLabel: '' })
        }
      },

      update: async () => {
        const env = useEnvStore.getState().activeEnv
        const { installPath } = get().data[env]
        if (!installPath) return

        patchEnv(set, env, { installing: true, progress: 0, progressLabel: 'Recherche des mises à jour...' })

        window.api.onInstallProgress((progress, label) => {
          patchEnv(set, env, { progress, progressLabel: label })
        })

        try {
          const { version, releaseDate } = await window.api.installGame(env, installPath)

          try {
            await window.api.clearGodotGameCache()
          } catch (cacheErr) {
            console.warn('[FilesStore] Cache Godot après mise à jour :', cacheErr)
          }

          patchEnv(set, env, {
            version,
            releaseDate,
            installing: false,
            needsUpdate: false,
            progress: 100,
            progressLabel: `Mise à jour terminée — v${version}`
          })
          void useVersionStore.getState().checkVersions()
        } catch (err) {
          console.error('[FilesStore] Échec mise à jour :', err)
          patchEnv(set, env, { installing: false, progress: 0, progressLabel: '' })
        }
      },

      verify: async () => {
        const env = useEnvStore.getState().activeEnv
        const { installPath } = get().data[env]
        console.log('[FilesStore] Vérification dans :', installPath, '(env:', env, ')')
      },

      clearCache: async (): Promise<ClearGodotCacheOutcome> => {
        try {
          const result = await window.api.clearGodotGameCache()
          if (result.errors.length > 0) {
            console.warn('[FilesStore] Cache Godot — erreurs :', result.errors)
            return 'partial'
          }
          console.log('[FilesStore] Cache Godot vidé', { root: result.root, removed: result.removed.length })
          return 'success'
        } catch (err) {
          console.error('[FilesStore] Échec vidage cache Godot :', err)
          return 'error'
        }
      },

      syncInstalledVersions: async () => {
        const envs: Env[] = ['universe', 'universe-testing']
        await Promise.all(
          envs.map(async (env) => {
            const { installed, installPath } = get().data[env]
            if (!installed || !installPath) return
            try {
              const resolved = await window.api.resolveInstalledVersion(env, installPath)
              if (!resolved?.version) return
              patchEnv(set, env, {
                version: resolved.version,
                releaseDate: resolved.releaseDate
              })
            } catch (err) {
              console.warn('[FilesStore] Sync version installée :', env, err)
            }
          })
        )
      }
    }),
    {
      name: 'dyingstar-files',
      partialize: (state) => ({
        data: {
          'universe': {
            installed:   state.data['universe'].installed,
            version:     state.data['universe'].version,
            releaseDate: state.data['universe'].releaseDate,
            needsUpdate: state.data['universe'].needsUpdate,
            installPath: state.data['universe'].installPath
          },
          'universe-testing': {
            installed:   state.data['universe-testing'].installed,
            version:     state.data['universe-testing'].version,
            releaseDate: state.data['universe-testing'].releaseDate,
            needsUpdate: state.data['universe-testing'].needsUpdate,
            installPath: state.data['universe-testing'].installPath
          }
        }
      }),
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<FilesState>
        return {
          ...current,
          data: {
            'universe':         { ...defaultEnvData, ...(p.data?.['universe']         ?? {}) },
            'universe-testing': { ...defaultEnvData, ...(p.data?.['universe-testing'] ?? {}) }
          }
        }
      },
      onRehydrateStorage: () => (state) => {
        if (state) void state.syncInstalledVersions()
      }
    }
  )
)