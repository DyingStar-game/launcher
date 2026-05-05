import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer':   resolve(__dirname, 'src/renderer/src'),
        '@store':      resolve(__dirname, 'src/renderer/store'),
        '@components': resolve(__dirname, 'src/renderer/components'),
        '@views':      resolve(__dirname, 'src/renderer/views'),
        '@i18n':       resolve(__dirname, 'src/renderer/i18n')
      }
    },
    plugins: [tailwindcss(), react()]
  }
})