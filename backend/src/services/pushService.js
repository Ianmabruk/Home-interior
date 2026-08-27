import webpush from 'web-push'
import { prisma } from '../config/database.js'

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@hokinteriors.co.ke'

let initialized = false

export function initPush() {
  if (initialized) return initialized
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[push] VAPID keys not configured — push notifications are disabled. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in the environment.')
    initialized = false
    return false
  }
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
    initialized = true
  } catch (err) {
    console.error('[push] Failed to initialize web-push:', err?.message || err)
    initialized = false
  }
  return initialized
}

export async function createSubscription(adminId, sub) {
  if (!sub || !adminId) return null
  const endpoint = sub.endpoint
  const keys = sub.keys || {}
  const existing = await prisma.pushSubscription.findFirst({
    where: { endpoint },
  })
  if (existing) {
    return prisma.pushSubscription.update({
      where: { id: existing.id },
      data: {
        adminId,
        keys: {
          p256dh: keys.p256dh || keys.p256ecdsa || '',
          auth: keys.auth || '',
        },
        active: true,
        revokedAt: null,
        lastActiveAt: new Date(),
      },
    })
  }
  return prisma.pushSubscription.create({
    data: {
      adminId,
      endpoint,
      keys: {
        p256dh: keys.p256dh || keys.p256ecdsa || '',
        auth: keys.auth || '',
      },
      active: true,
      lastActiveAt: new Date(),
    },
  })
}

export async function listActiveSubscriptions(adminId) {
  return prisma.pushSubscription.findMany({
    where: { adminId, active: true },
  })
}

export async function deactivateSubscription(endpoint) {
  return prisma.pushSubscription.updateMany({
    where: { endpoint },
    data: { active: false, revokedAt: new Date() },
  })
}

async function sendToOne(sub, payload) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({ ok: false, reason: 'timeout' })
    }, 10000)
    webpush.sendNotification(sub.endpoint, payload, {
      vapidDetails: {
        publicKey: VAPID_PUBLIC_KEY,
        privateKey: VAPID_PRIVATE_KEY,
        subject: VAPID_SUBJECT,
      },
      TTL: 60,
    })
      .then(() => {
        clearTimeout(timer)
        resolve({ ok: true })
      })
      .catch((err) => {
        clearTimeout(timer)
        const status = err?.statusCode || err?.response?.statusCode
        if (status === 404 || status === 410) {
          deactivateSubscription(sub.endpoint).catch(() => {})
          resolve({ ok: false, reason: 'endpoint-gone' })
        }
        resolve({ ok: false, reason: err?.message || 'send-error' })
      })
  })
}

export async function notifyAdmins({ title, body, url, tag }) {
  if (!initPush()) {
    console.warn('[push] Skipped notification (VAPID not configured):', title)
    return { sent: 0, failed: 0, skipped: true }
  }
  const subs = await prisma.pushSubscription.findMany({ where: { active: true } })
  if (subs.length === 0) return { sent: 0, failed: 0, skipped: false }

  const payload = JSON.stringify({ title, body, url, tag })

  // Send all notifications in parallel with per-subscription timeout.
  const results = await Promise.allSettled(
    subs.map((sub) => {
      const parsedKeys = (() => {
        try { return typeof sub.keys === 'string' ? JSON.parse(sub.keys) : sub.keys } catch { return {} }
      })()
      const nativeSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: parsedKeys.p256dh,
          auth: parsedKeys.auth,
        },
      }
      return sendToOne(nativeSub, payload)
    })
  )

  let sent = 0
  let failed = 0
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value?.ok) sent++
    else failed++
  }
  return { sent, failed, skipped: false }
}

export default {
  initPush,
  createSubscription,
  listActiveSubscriptions,
  deactivateSubscription,
  notifyAdmins,
}
