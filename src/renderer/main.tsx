import './assets/main.css'
import './i18n'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from '@lib/queryClient'
import ErrorBoundary from '@components/atoms/ErrorBoundary'
import RenderErrorNotice from '@components/molecules/RenderErrorNotice'
import App from './App'

const queryClient = createQueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* Last resort (ADR 0041): never a black window, reloading starts the launcher over */}
      <ErrorBoundary
        fallback={() => (
          <div className="flex size-full flex-col bg-ds-bg font-sans">
            <RenderErrorNotice onRetry={() => window.location.reload()} />
          </div>
        )}
      >
        <App />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>
)
