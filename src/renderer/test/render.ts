import { createElement, type ReactElement, type ReactNode } from 'react'
import {
  render as rtlRender,
  renderHook as rtlRenderHook,
  type RenderHookOptions,
  type RenderHookResult,
  type RenderOptions,
  type RenderResult
} from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from '@lib/queryClient'

export * from '@testing-library/react'

/** Wraps a test in a fresh query client (ADR 0025): no data leaks from one test to the next. */
function withQueryClient(): ({ children }: { children: ReactNode }) => ReactElement {
  const client = createQueryClient()
  return function Providers({ children }) {
    return createElement(QueryClientProvider, { client }, children)
  }
}

/** Testing Library's `render`, inside a fresh query client. */
export function render(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>): RenderResult {
  const wrapper = withQueryClient()
  const result = rtlRender(ui, { wrapper, ...options })
  return { ...result, rerender: (next) => result.rerender(next) }
}

/** Testing Library's `renderHook`, inside a fresh query client. */
export function renderHook<Result, Props>(
  hook: (props: Props) => Result,
  options?: Omit<RenderHookOptions<Props>, 'wrapper'>
): RenderHookResult<Result, Props> {
  return rtlRenderHook(hook, { wrapper: withQueryClient(), ...options })
}
