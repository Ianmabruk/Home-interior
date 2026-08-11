import { asyncHandler } from '../middleware/asyncHandler.js'
import { orderService } from '../services/orderService.js'
import { failure } from '../utils/response.js'

export const orderController = {
  create: asyncHandler(async (req, res) => {
    const shipping = req.body.shipping || req.body.shippingAddress || {}
    const name = shipping.fullName || shipping.name || req.body.name || ''
    const email = shipping.email || req.body.email || ''
    const phone = shipping.phone || req.body.phone || ''

    const rawItems = typeof req.body.items === 'string' ? req.body.items : JSON.stringify(req.body.items || [])
    const rawShipping = typeof shipping === 'string' ? shipping : JSON.stringify(shipping)
    const rawPayment = typeof req.body.paymentDetails === 'string' ? req.body.paymentDetails : JSON.stringify(req.body.paymentDetails || {})

    const data = {
      email,
      name,
      phone,
      items: rawItems,
      shippingAddress: rawShipping,
      shippingMethod: req.body.shippingMethod || 'standard',
      paymentMethod: shipping.paymentMethod || req.body.paymentMethod || '',
      paymentDetails: rawPayment,
      total: Number(req.body.total) || 0,
    }
    const order = await orderService.createOrder(data)
    res.status(201).json({ success: true, data: order })
  }),

  listMine: asyncHandler(async (req, res) => {
    const user = req.user || req.admin
    const email = user?.email || req.query.email
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' })
    }
    const orders = await orderService.getUserOrders(email)
    res.json({ success: true, data: orders })
  }),

  listAll: asyncHandler(async (req, res) => {
    const { sort } = req.query
    const orders = await orderService.getAllOrders({ sort })
    res.json({ success: true, data: orders })
  }),

  get: asyncHandler(async (req, res) => {
    const order = await orderService.getOrder(req.params.id)
    if (req.admin.role !== 'ADMIN' && order.email !== req.admin.email) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    res.json({ success: true, data: order })
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const { status } = req.body
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' })
    }
    const order = await orderService.updateOrderStatus(req.params.id, status)
    res.json({ success: true, data: order })
  }),
}
