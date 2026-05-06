import { create } from 'zustand'

type FilesState = {
  installed: boolean
  version: string | null
  releaseDate: string | null
  needsUpdate: boolean

  installing: boolean
  progress: number

  install: () => Promise<void>
  update: () => Promise<void>
  verify: () => Promise<void>
  clearCache: () => void
}

export const useFilesStore = create<FilesState>((set) => ({
  installed: false,
  version: null,
  releaseDate: null,
  needsUpdate: false,

  installing: false,
  progress: 0,

  install: async () => {
    set({ installing: true, progress: 0 })

    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 200))
      set({ progress: i })
    }

    set({
      installed: true,
      version: '1.0.0',
      releaseDate: '2026-01-01',
      installing: false,
      needsUpdate: false
    })
  },

  update: async () => {
    set({ installing: true, progress: 0 })

    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 150))
      set({ progress: i })
    }

    set({
      version: '1.0.1',
      installing: false,
      needsUpdate: false
    })
  },

  verify: async () => {
    console.log('Verifying files...')
  },

  clearCache: () => {
    console.log('Cache cleared')
  }
}))