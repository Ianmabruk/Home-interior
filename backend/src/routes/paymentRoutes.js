import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { orderService } from '../services/orderService.js'
import { authenticate } from '../middleware/auth.js'
import { failure } from '../utils/response.js'

const router = Router()

router.post('/mpesa', authenticate, asyncHandler(async (req, res) => {
  const { phone, amount, orderData } = req.body
  if (!phone || !amount) {
    return res.status(400).json({ success: false, message: 'Phone and amount are required' })
  }
  let order = null
  if (orderData) {
    order = await orderService.createOrder(orderData)
  }
  const payment = {
    method: 'mpesa',
    phone,
    amount: Number(amount),
    status: 'initiated',
    reference: `MPESA-${Date.now()}`,
    orderId: order?.id || null,
  }
  res.status(201).json({ success: true, data: payment })
}))

router.post('/card', authenticate, asyncHandler(async (req, res) => {
  const { cardHolder, expiry, amount, orderData } = req.body
  if (!cardHolder || !expiry || !amount) {
    return res.status(400).json({ success: false, message: 'Card holder, expiry, and amount are required' })
  }
  let order = null
  if (orderData) {
    order = await orderService.createOrder(orderData)
  }
  const payment = {
    method: 'card',
    cardHolder,
    amount: Number(amount),
    status: 'pending',
    reference: `CARD-${Date.now()}`,
    orderId: order?.id || null,
  }
  res.status(201).json({ success: true, data: { ...payment, order } })
}))

router.post('/verify', authenticate, asyncHandler(async (req, res) => {
  const { reference } = req.body
  if (!reference) {
    return res.status(400).json({ success: false, message: 'Reference is required' })
  }
  res.json({ success: true, data: { reference, status: 'pending', verifiedAt: new Date().toISOString() } })
}))

export default router