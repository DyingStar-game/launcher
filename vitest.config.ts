import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const r = (path: string): string => resolve(__dirname, path)

/**
 * Unit tests (ADR 0007, 0011): `*.test.ts` run in Node (main, shared, renderer logic),
 * `*.test.tsx` run in jsdom with Testing Library (renderer components).
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': r('src/shared'),
      '@hooks': r('src/renderer/hooks'),
      '@lib': r('src/renderer/lib'),
      '@assets': r('src/renderer/assets'),
      '@content': r('src/renderer/content'),
      '@stores': r('src/renderer/stores'),
      '@components': r('src/renderer/components'),
      '@pages': r('src/renderer/pages'),
      '@i18n': r('src/renderer/i18n/index.ts')
    }
  },
  test: {
    projects: [
      { extends: true, test: { name: 'node', environment: 'node', include: ['src/**/*.test.ts'] } },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/renderer/**/*.test.tsx'],
          setupFiles: ['src/renderer/test/setup.ts']
        }
      }
    ]
  }
})
