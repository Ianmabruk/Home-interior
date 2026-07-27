import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/index.css'
import { AppProviders } from './app/providers/AppProviders'
import { AppRouter } from './app/router/AppRouter'
import { ErrorBoundary } from './components/common/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <AppProviders>
          <AppRouter />
        </AppProviders>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
)