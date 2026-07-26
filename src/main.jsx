import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { ShopProvider } from './context/ShopContext'
import { CurrencyProvider } from './context/CurrencyContext'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import App from './App.jsx'
import { PageMeta } from './hooks/usePageMeta'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <ShopProvider>
            <CurrencyProvider>
              <PageMeta />
              <App />
            </CurrencyProvider>
          </ShopProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
)
