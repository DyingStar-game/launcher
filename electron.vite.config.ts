import { resolve } from 'path'
import { defineConfig, loadEnv } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const sharedAlias = {
  '@shared': resolve(__dirname, 'src/shared')
}

const rendererAlias = {
  ...sharedAlias,
  '@hooks': resolve(__dirname, 'src/renderer/hooks'),
  '@lib': resolve(__dirname, 'src/renderer/lib'),
  '@assets': resolve(__dirname, 'src/renderer/assets'),
  '@content': resolve(__dirname, 'src/renderer/content'),
  '@stores': resolve(__dirname, 'src/renderer/stores'),
  '@components': resolve(__dirname, 'src/renderer/components'),
  '@views': resolve(__dirname, 'src/renderer/views'),
  '@i18n': resolve(__dirname, 'src/renderer/i18n/index.ts')
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode)
  Object.assign(process.env, env)

  return {
    main: {
      resolve: { alias: sharedAlias }
    },
    preload: {
      resolve: { alias: sharedAlias }
    },
    renderer: {
      resolve: { alias: rendererAlias },
      plugins: [tailwindcss(), react()]
    }
  }
})
