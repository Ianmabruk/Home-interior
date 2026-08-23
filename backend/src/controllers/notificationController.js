import { prisma } from '../config/database.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { authorize } from '../middleware/auth.js'
import { createSubscription, listActiveSubscriptions, deactivateSubscription } from '../services/pushService.js'
import { getBuildVersion } from '../middleware/buildVersion.js'

export const notificationController = {
  me: asyncHandler(async (req, res) => {
    if (!req.admin) {
      return res.status(401).json({ success: false, message: 'Admin authentication required' })
    }
    const version = getBuildVersion()
    const subs = await listActiveSubscriptions(req.admin.id)
    res.json({
      success: true,
      data: {
        buildVersion: version,
        pushEnabled: subs.length > 0,
        subscriptions: subs
          .map((s) => ({
            id: s.id,
            active: s.active,
            createdAt: s.createdAt,
            lastActiveAt: s.lastActiveAt,
          }))
          .slice(0, 10),
        subscriptionCount: subs.length,
      },
    })
  }),

  subscribe: asyncHandler(async (req, res) => {
    if (!req.admin) {
      return res.status(401).json({ success: false, message: 'Admin authentication required' })
    }
    const { subscription } = req.body || {}
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, message: 'Invalid subscription payload' })
    }
    const saved = await createSubscription(req.admin.id, subscription)
    res.status(201).json({ success: true, data: { id: saved.id, active: saved.active } })
  }),

  listMine: asyncHandler(async (req, res) => {
    if (!req.admin) {
      return res.status(401).json({ success: false, message: 'Admin authentication required' })
    }
    const subs = await listActiveSubscriptions(req.admin.id)
    res.json({
      success: true,
      data: subs.map((s) => ({
        id: s.id,
        active: s.active,
        createdAt: s.createdAt,
        lastActiveAt: s.lastActiveAt,
      })),
    })
  }),

  revoke: asyncHandler(async (req, res) => {
    if (!req.admin) {
      return res.status(401).json({ success: false, message: 'Admin authentication required' })
    }
    const { id } = req.params
    await prisma.pushSubscription.updateMany({
      where: { id, adminId: req.admin.id, active: true },
      data: { active: false, revokedAt: new Date() },
    })
    res.json({ success: true, data: { message: 'Subscription revoked' } })
  }),
}

export default notificationController
