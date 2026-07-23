/* eslint-disable react-refresh/only-export-components -- Entry point */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { ShopProvider } from './context/ShopContext'
import { CurrencyProvider } from './context/CurrencyContext'
import { ErrorBoundary } from './components/common/ErrorBoundary'

const App = lazy(() => import('./App.jsx'))

const AppFallback = () => (
  <div style={{ minHeight: '100vh', background: '#FAF8F4' }} />
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={<AppFallback />}>
        <ErrorBoundary>
          <AuthProvider>
            <ShopProvider>
              <CurrencyProvider>
                <App />
              </CurrencyProvider>
            </ShopProvider>
          </AuthProvider>
        </ErrorBoundary>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)
