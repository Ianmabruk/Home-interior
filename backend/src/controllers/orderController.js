import { asyncHandler } from '../middleware/asyncHandler.js'
import { orderService } from '../services/orderService.js'
import { failure } from '../utils/response.js'

export const orderController = {
  create: asyncHandler(async (req, res) => {
    const shipping = req.body.shipping || req.body.shippingAddress || {}
    const name = String(shipping.fullName || shipping.name || req.body.name || '').trim()
    const email = String(shipping.email || req.body.email || '').trim()
    const phone = String(shipping.phone || req.body.phone || '').trim()

    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Name and email are required' })
    }

    const rawItems = typeof req.body.items === 'string' ? req.body.items : JSON.stringify(Array.isArray(req.body.items) ? req.body.items : [])
    let parsedItems
    try {
      parsedItems = JSON.parse(rawItems)
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid items format' })
    }
    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' })
    }

    const rawShipping = typeof shipping === 'string' ? shipping : JSON.stringify(shipping)
    const rawPayment = typeof req.body.paymentDetails === 'string' ? req.body.paymentDetails : JSON.stringify(req.body.paymentDetails || {})

    const data = {
      userId: req.user?.id || null,
      email,
      name,
      phone,
      items: rawItems,
      shippingAddress: rawShipping,
      shippingMethod: req.body.shippingMethod || req.body.shippingAddress?.shippingMethod || 'standard',
      paymentMethod: shipping.paymentMethod || req.body.paymentMethod || 'guest',
      paymentDetails: rawPayment,
      total: Number(req.body.total) || 0,
    }
    const order = await orderService.createOrder(data)
    res.status(201).json({ success: true, data: order })
  }),

  trackOrder: asyncHandler(async (req, res) => {
    const { trackingNumber, contact } = req.body
    if (!trackingNumber || !contact) {
      return res.status(400).json({ success: false, message: 'Tracking number and contact are required' })
    }
    const order = await orderService.trackOrder(trackingNumber, contact)
    res.json({ success: true, data: order })
  }),

  listMine: asyncHandler(async (req, res) => {
    const user = req.user || req.admin
    const email = user?.email || req.query.email
    const userId = req.user?.id
    if (!email && !userId) {
      return res.status(400).json({ success: false, message: 'Email or user ID required' })
    }
    const orders = await orderService.getUserOrders(userId || email)
    res.json({ success: true, data: orders })
  }),

  listAll: asyncHandler(async (req, res) => {
    const { sort } = req.query
    const orders = await orderService.getAllOrders({ sort })
    res.json({ success: true, data: orders })
  }),

  get: asyncHandler(async (req, res) => {
    const order = await orderService.getOrder(req.params.id)
    console.log('[orders:get] req.user:', req.user?.id, 'req.admin:', !!req.admin, 'order.userId:', order.userId, 'order.email:', order.email)
    if (req.admin) {
      if (req.admin.role !== 'ADMIN' && order.email !== req.admin.email) {
        return res.status(403).json({ success: false, message: 'Access denied' })
      }
    } else if (req.user) {
      if (order.userId && order.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' })
      }
      if (!order.userId && order.email !== req.user.email) {
        return res.status(403).json({ success: false, message: 'Access denied' })
      }
    } else {
      const requesterEmail = req.query.email
      if (!requesterEmail || order.email !== requesterEmail) {
        return res.status(403).json({ success: false, message: 'Access denied' })
      }
    }
    res.json({ success: true, data: order })
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const { status, customerNote, estimatedDelivery } = req.body
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' })
    }
    const updateData = { status }
    if (customerNote !== undefined) updateData.customerNote = customerNote
    if (estimatedDelivery !== undefined) updateData.estimatedDelivery = estimatedDelivery
    const order = await orderService.updateOrderStatus(req.params.id, updateData)
    res.json({ success: true, data: order })
  }),
}
