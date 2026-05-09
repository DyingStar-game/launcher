// src/renderer/store/files.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type FilesState = {
  // Jeu
  installed: boolean
  version: string | null
  releaseDate: string | null
  needsUpdate: boolean

  // Chemin d'installation (persisté)
  installPath: string

  // Installation en cours
  installing: boolean
  progress: number
  progressLabel: string

  // Actions
  setInstallPath: (path: string) => void
  selectDirectory: () => Promise<void>
  install: () => Promise<void>
  update: () => Promise<void>
  verify: () => Promise<void>
  clearCache: () => void
}

export const useFilesStore = create<FilesState>()(
  persist(
    (set, get) => ({
      installed: false,
      version: null,
      releaseDate: null,
      needsUpdate: false,
      installPath: '',

      installing: false,
      progress: 0,
      progressLabel: '',

      setInstallPath: (path: string) => set({ installPath: path }),

      selectDirectory: async () => {
        const selected = await window.api.selectDirectory()
        if (selected) {
          set({ installPath: selected })
        }
      },

      install: async () => {
        const { installPath } = get()
        if (!installPath) {
          console.warn('[FilesStore] Aucun répertoire d\'installation défini.')
          return
        }

        set({ installing: true, progress: 0, progressLabel: 'Connexion au serveur...' })

        // Abonnement aux événements de progression du main process
        window.api.onInstallProgress((progress, label) => {
          set({ progress, progressLabel: label })
        })

        try {
          await window.api.installGame(installPath)

          set({
            installed: true,
            version: '1.0.0',
            releaseDate: new Date().toISOString().split('T')[0],
            installing: false,
            needsUpdate: false,
            progress: 100,
            progressLabel: 'Installation terminée'
          })
        } catch (err) {
          console.error('[FilesStore] Échec de l\'installation :', err)
          set({
            installing: false,
            progress: 0,
            progressLabel: ''
          })
        }
      },

      update: async () => {
        const { installPath } = get()
        if (!installPath) return

        set({ installing: true, progress: 0, progressLabel: 'Recherche des mises à jour...' })

        window.api.onInstallProgress((progress, label) => {
          set({ progress, progressLabel: label })
        })

        try {
          await window.api.installGame(installPath)

          set({
            version: '1.1.0',
            installing: false,
            needsUpdate: false,
            progress: 100,
            progressLabel: 'Mise à jour terminée'
          })
        } catch (err) {
          console.error('[FilesStore] Échec de la mise à jour :', err)
          set({ installing: false, progress: 0, progressLabel: '' })
        }
      },

      verify: async () => {
        const { installPath } = get()
        console.log('[FilesStore] Vérification des fichiers dans :', installPath)
        // TODO: IPC files:verify
      },

      clearCache: () => {
        console.log('[FilesStore] Cache vidé')
        // TODO: IPC files:clear-cache
      }
    }),
    {
      name: 'dyingstar-files',
      // On ne persiste que les données utiles entre sessions, pas l'état transitoire
      partialize: (state) => ({
        installed: state.installed,
        version: state.version,
        releaseDate: state.releaseDate,
        needsUpdate: state.needsUpdate,
        installPath: state.installPath
      })
    }
  )
)