import { useCallback, useRef } from 'react'
import { useAppLifecycle } from '@hooks/useAppLifecycle'
import { useAuth } from '@context/AuthContext'
import { clearApiCache } from '@services/api'

// Minimum idle time before we consider data stale and force a full refresh.
const STALE_THRESHOLD_MS = 10 * 60 * 1000 // 10 minutes

export function AppLifecycleProvider({ children }) {
  const { validateSession } = useAuth()
  const hiddenAtRef = useRef(null)

  const handleHidden = useCallback(() => {
    hiddenAtRef.current = Date.now()
  }, [])

  const handleVisible = useCallback(() => {
    const hiddenAt = hiddenAtRef.current
    hiddenAtRef.current = null

    const idleMs = hiddenAt ? Date.now() - hiddenAt : 0

    if (idleMs >= STALE_THRESHOLD_MS) {
      // Data is stale — clear the in-memory API cache so every component
      // refetches from the backend on its next render cycle.
      clearApiCache()

      // Dispatch a custom event that page components can listen to in order
      // to trigger their own data reload (e.g. ShopPage, PortfolioPage).
      window.dispatchEvent(new CustomEvent('hok-app-resumed', { detail: { idleMs } }))
    }

    // Always re-validate the auth session when the tab becomes visible.
    const token = localStorage.getItem('hok_access_token')
    if (token) {
      validateSession()
    }
  }, [validateSession])

  const handleOnline = useCallback(() => {
    // When connectivity is restored after being offline, clear the cache
    // so stale/empty responses are not served from memory.
    clearApiCache()
    window.dispatchEvent(new CustomEvent('hok-app-resumed', { detail: { reason: 'online' } }))
  }, [])

  useAppLifecycle({
    onVisible: handleVisible,
    onHidden: handleHidden,
    onOnline: handleOnline,
    onOffline: () => {
      // No action needed on offline — components already handle errors gracefully.
    },
  })

  return <>{children}</>
}
