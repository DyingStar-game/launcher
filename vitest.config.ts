import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

const r = (path: string): string => resolve(__dirname, path)

/**
 * Unit tests (ADR 0007, 0011): `*.test.ts` run in Node (main, shared, renderer logic),
 * `*.test.tsx` run in jsdom with Testing Library (renderer components). Rendering tests
 * (ADR 0033): `*.browser.test.tsx` run in headless Chromium with the real Tailwind CSS, to check
 * layout and computed styles, which jsdom does not compute.
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
          exclude: ['src/renderer/**/*.browser.test.tsx'],
          setupFiles: ['src/renderer/test/setup.ts']
        }
      },
      {
        extends: true,
        plugins: [tailwindcss()],
        test: {
          name: 'browser',
          include: ['src/renderer/**/*.browser.test.tsx'],
          setupFiles: ['src/renderer/test/browserSetup.ts'],
          browser: {
            enabled: true,
            headless: true,
            // Playwright hides scrollbars in headless mode; the launcher shows them (thin, styled)
            provider: playwright({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } }),
            // The launcher's full width (navbar without the burger menu, ADR 0026)
            viewport: { width: 1400, height: 900 },
            instances: [{ browser: 'chromium' }]
          }
        }
      }
    ]
  }
})
