import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/index.css'
import { AppProviders } from './app/providers/AppProviders'
import { AppRouter } from './app/router/AppRouter'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <AppProviders>
          <AppRouter />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--bg)',
                color: 'var(--primary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '12px 16px',
              },
            }}
          />
        </AppProviders>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
)