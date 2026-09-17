import { useEffect, useRef } from 'react'

export function useAppLifecycle(callbacks) {
  // Keep callbacks in a ref so the effect never needs to re-run when they change.
  // We update the ref in an effect (not during render) to satisfy React's
  // "no ref mutation during render" rule.
  const callbacksRef = useRef(callbacks)
  useEffect(() => {
    callbacksRef.current = callbacks
  }, [callbacks])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        callbacksRef.current.onVisible?.()
      } else {
        callbacksRef.current.onHidden?.()
      }
    }

    // pageshow fires when the page is restored from the browser's back/forward
    // cache (bfcache). event.persisted === true means it was a bfcache restore,
    // which means the JS state is stale and we must treat it as a fresh visit.
    const handlePageShow = (event) => {
      if (event.persisted) {
        callbacksRef.current.onVisible?.()
      }
    }

    const handleOnline = () => callbacksRef.current.onOnline?.()
    const handleOffline = () => callbacksRef.current.onOffline?.()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, []) // Empty deps — callbacks are accessed via ref
}
