/* eslint-disable react-refresh/only-export-components -- Entry point */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import './index.css'

const App = lazy(() => import('./App.jsx'))

const AppFallback = () => (
  <div style={{ minHeight: '100vh', background: '#FAF8F4' }} />
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={<AppFallback />}>
        <App />
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)
