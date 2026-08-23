import { useState, useEffect, useCallback } from 'react'
import { api } from '@services/api'

const STORAGE_KEY = 'hok_push_permission_state'
const LAST_CHECK_KEY = 'hok_push_last_check'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const decoded =
    typeof window !== 'undefined' && typeof window.atob === 'function'
      ? window.atob(base64)
      : (typeof globalThis !== 'undefined' && globalThis.Buffer
          ? globalThis.Buffer.from(base64, 'base64').toString('binary')
          : '')
  const arr = new Uint8Array(decoded.length)
  for (let i = 0; i < decoded.length; i++) arr[i] = decoded.charCodeAt(i)
  return arr
}

export function urlB64ToUint8Array(base64String) {
  return urlBase64ToUint8Array(base64String)
}

function setStoredPermission(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value)
    localStorage.setItem(LAST_CHECK_KEY, Date.now().toString())
  } catch {
    // localStorage unavailable
  }
}

export function usePushNotifications() {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [vapidPublicKey, setVapidPublicKey] = useState('')

  useEffect(() => {
    const ok = !!(
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    )
    setSupported(ok)
    if (ok) {
      setPermission(Notification.permission)
      setStoredPermission(Notification.permission)
    }

    if (!ok) return

    let cancelled = false
    const refreshSubscription = async () => {
      const sw = await navigator.serviceWorker.ready
      const sub = await sw.pushManager.getSubscription()
      if (!cancelled) setSubscribed(!!sub)
    }
    refreshSubscription().catch(() => {
      if (!cancelled) setSubscribed(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const loadVapidPublicKey = useCallback(async () => {
    if (!vapidPublicKey) {
      try {
        const res = await api.get('/config/public')
        const key = res.data?.push?.vapidPublicKey || ''
        setVapidPublicKey(key)
        return key
      } catch (err) {
        setError(err?.message || 'Unable to load push configuration')
        return ''
      }
    }
    return vapidPublicKey
  }, [vapidPublicKey])

  const ensureServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported in this browser.')
    }
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    }
    return navigator.serviceWorker.ready
  }, [])

  const subscribe = useCallback(async () => {
    if (!supported) {
      setError('Push notifications are not supported in this browser. Use Chrome/Firefox/Edge on desktop or add this site to your Home Screen on iPhone (iOS 16.4+).')
      return { ok: false }
    }
    if (permission === 'denied') {
      setError('Notification permission was denied. To re-enable, open your browser/device settings, find HOK Interiors, and allow notifications, then try again.')
      return { ok: false, denied: true }
    }

    setLoading(true)
    setError(null)
    try {
      const key = await loadVapidPublicKey()
      if (!key) {
        setError('Push notifications are not configured on the server. Contact the site owner.')
        return { ok: false, notConfigured: true }
      }

      await ensureServiceWorker()
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)
      setStoredPermission(permissionResult)
      if (permissionResult !== 'granted') {
        setError('Notifications permission not granted.')
        return { ok: false, denied: true }
      }

      const sw = await navigator.serviceWorker.ready
      const existing = await sw.pushManager.getSubscription()
      if (existing) {
        await existing.unsubscribe()
      }

      const sub = await sw.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      })

      await api.post('/admin/push/subscribe', { subscription: sub })
      setSubscribed(true)
      setStoredPermission('granted')
      return { ok: true }
    } catch (err) {
      setError(err?.message || 'Failed to enable notifications')
      return { ok: false }
    } finally {
      setLoading(false)
    }
  }, [supported, permission, loadVapidPublicKey, ensureServiceWorker])

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/admin/push')
      setSubscribed((res.data?.subscriptionCount || 0) > 0)
    } catch {
      setSubscribed(false)
    }
  }, [])

  const canReRequest = permission === 'denied'
  const reason = canReRequest
    ? 'Permission was denied. You can re-enable notifications in your browser/device settings, then click "Enable Notifications" again.'
    : undefined

  return {
    supported,
    permission,
    subscribed,
    loading,
    error,
    subscribe,
    fetchStatus,
    reason,
  }
}
