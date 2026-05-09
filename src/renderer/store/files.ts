import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useEnvStore, type Env } from './env'

// ─── Types ────────────────────────────────────────────────────────────────────

export type EnvFilesData = {
  // Persistés
  installed: boolean
  version: string | null
  releaseDate: string | null
  needsUpdate: boolean
  installPath: string
  // Transitoires (non persistés)
  installing: boolean
  progress: number
  progressLabel: string
}

type FilesState = {
  data: Record<Env, EnvFilesData>

  setInstallPath: (path: string) => void
  selectDirectory: () => Promise<void>
  install: () => Promise<void>
  update: () => Promise<void>
  verify: () => Promise<void>
  clearCache: () => void
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

// ─── Helper interne ───────────────────────────────────────────────────────────

type SetFn = (fn: (s: FilesState) => Partial<FilesState>) => void

function patchEnv(set: SetFn, env: Env, patch: Partial<EnvFilesData>): void {
  set((s) => ({
    data: {
      ...s.data,
      [env]: { ...s.data[env], ...patch }
    }
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
          // On met à jour l'env qui a déclenché l'install, même si l'utilisateur a switché
          patchEnv(set, env, { progress, progressLabel: label })
        })

        try {
          await window.api.installGame(env, installPath)
          patchEnv(set, env, {
            installed: true,
            version: '1.0.0',
            releaseDate: new Date().toISOString().split('T')[0],
            installing: false,
            needsUpdate: false,
            progress: 100,
            progressLabel: 'Installation terminée'
          })
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
          await window.api.installGame(env, installPath)
          patchEnv(set, env, {
            version: '1.1.0',
            installing: false,
            needsUpdate: false,
            progress: 100,
            progressLabel: 'Mise à jour terminée'
          })
        } catch (err) {
          console.error('[FilesStore] Échec mise à jour :', err)
          patchEnv(set, env, { installing: false, progress: 0, progressLabel: '' })
        }
      },

      verify: async () => {
        const env = useEnvStore.getState().activeEnv
        const { installPath } = get().data[env]
        console.log('[FilesStore] Vérification dans :', installPath, '(env:', env, ')')
        // TODO: IPC files:verify
      },

      clearCache: () => {
        const env = useEnvStore.getState().activeEnv
        console.log('[FilesStore] Cache vidé pour env :', env)
        // TODO: IPC files:clear-cache
      }
    }),
    {
      name: 'dyingstar-files',
      partialize: (state) => ({
        data: {
          'universe': {
            installed:    state.data['universe'].installed,
            version:      state.data['universe'].version,
            releaseDate:  state.data['universe'].releaseDate,
            needsUpdate:  state.data['universe'].needsUpdate,
            installPath:  state.data['universe'].installPath
          },
          'universe-testing': {
            installed:    state.data['universe-testing'].installed,
            version:      state.data['universe-testing'].version,
            releaseDate:  state.data['universe-testing'].releaseDate,
            needsUpdate:  state.data['universe-testing'].needsUpdate,
            installPath:  state.data['universe-testing'].installPath
          }
        }
      }),
      // Fusion avec les valeurs par défaut au chargement (réhydrate les champs transitoires)
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<FilesState>
        return {
          ...current,
          data: {
            'universe': { ...defaultEnvData, ...(p.data?.['universe'] ?? {}) },
            'universe-testing': { ...defaultEnvData, ...(p.data?.['universe-testing'] ?? {}) }
          }
        }
      }
    }
  )
)