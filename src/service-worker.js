/*
 * HOK Interiors — Service Worker (extends the VitePWA-generated SW).
 *
 * This is the ONLY service worker for the application. VitePWA (injectManifest)
 * copies this file, injects `self.__WB_MANIFEST__` (precached build assets), and
 * registers it via its auto-generated runtime. We extend it here with:
 *   - push event handling (admin device push notifications)
 *   - notificationclick handling (deep-link to the relevant admin page)
 *   - the existing Workbox runtime caching is preserved via the plugin config.
 *
 * No competing service workers are registered.
 */
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Precache manifest injected by Workbox at build time (via VitePWA injectManifest).
// This must remain; VitePWA replaces it with the generated asset manifest.
/* eslint-disable no-undef */
self.__WB_MANIFEST
/* eslint-enable no-undef */

function safeParse(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

self.addEventListener('push', (event) => {
  if (!event.data) return
  const payload = safeParse(event.data.text())
  if (!payload) return

  const title = payload.title || 'HOK Interiors'
  const options = {
    body: payload.body || '',
    tag: payload.tag || 'hok-notification',
    data: {
      url: payload.url || '/admin',
      ...(payload.data || {}),
    },
    badge: '/apple-touch-icon.png',
    icon: '/favicon-192.png',
    requireInteraction: payload.tag === 'NEW_ORDER' || payload.tag === 'NEW_CONSULTATION',
    actions: [
      { action: 'open', label: 'Open' },
    ],
    timestamp: Date.now(),
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification && event.notification.data && event.notification.data.url) || '/admin'

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const sameOrigin = (url) => {
        try {
          return new URL(url, self.location.origin).origin === self.location.origin
        } catch {
          return false
        }
      }

      const decoded = target.startsWith('/') ? target : `/${target}`
      const targetUrl = sameOrigin(decoded) ? new URL(decoded, self.location.origin).href : '/admin'

      // Focus an existing admin tab if one is open, navigating it to the deep link.
      for (const client of allClients) {
        if (client.url.indexOf('/admin') !== -1 && sameOrigin(client.url)) {
          try {
            if (client.navigate) await client.navigate(targetUrl)
            return client.focus()
          } catch (e) {
            // fall through to opening a new window
          }
        }
      }

      // No existing admin tab — open one.
      try {
        await self.clients.openWindow(targetUrl)
      } catch (e) {
        // no-op
      }
    })()
  )
})

self.addEventListener('notificationclose', (event) => {
  // Subscriptions are pruned server-side on send failure; nothing to do here.
})
