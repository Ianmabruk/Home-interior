import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { orderService } from '../services/orderService.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/mpesa', authenticate, asyncHandler(async (req, res) => {
  const { phone, amount, orderId } = req.body
  if (!phone || !amount) {
    return res.status(400).json({ success: false, message: 'Phone and amount are required' })
  }
  const payment = {
    method: 'mpesa',
    phone,
    amount,
    status: 'initiated',
    reference: `MPESA-${Date.now()}`,
  }
  res.json({ success: true, data: payment })
}))

router.post('/card', authenticate, asyncHandler(async (req, res) => {
  const { cardNumber, cardHolder, expiry, cvv, amount, orderData } = req.body
  if (!cardNumber || !cardHolder || !expiry || !cvv || !amount) {
    return res.status(400).json({ success: false, message: 'All card fields and amount are required' })
  }
  const payment = {
    method: 'card',
    cardHolder,
    amount,
    status: 'success',
    reference: `CARD-${Date.now()}`,
  }
  let order = null
  if (orderData) {
    order = await orderService.createOrder(orderData)
  }
  res.json({ success: true, data: { ...payment, order } })
}))

router.post('/verify', authenticate, asyncHandler(async (req, res) => {
  const { reference } = req.body
  if (!reference) {
    return res.status(400).json({ success: false, message: 'Reference is required' })
  }
  res.json({ success: true, data: { reference, status: 'completed', verifiedAt: new Date().toISOString() } })
}))

export default router