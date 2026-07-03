import { useEffect } from 'react'

// Admin data change event system for real-time updates
const ADMIN_DATA_CHANGED_EVENT = 'admin:data-changed'

export function emitAdminDataChanged(payload = {}) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(ADMIN_DATA_CHANGED_EVENT, { detail: payload }))
}

export function getAdminDataChangedPayload(event) {
  return event?.detail || {}
}

export function useAdminDataChangedListener(callback) {
  useEffect(() => {
    const handler = (event) => callback(getAdminDataChangedPayload(event))
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [callback])
}

export { ADMIN_DATA_CHANGED_EVENT }