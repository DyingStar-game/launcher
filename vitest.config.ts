import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

/** Unit tests for main / shared logic, run in Node (ADR 0007). */
export default defineConfig({
  resolve: {
    alias: { '@shared': resolve(__dirname, 'src/shared') }
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
})
