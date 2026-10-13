import { QueryClient } from '@tanstack/react-query'

/**
 * The launcher's query client (ADR 0025). No retry: main already refreshes the token and
 * retries a `401` once (ADR 0007), and a coded error must show at once.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}
