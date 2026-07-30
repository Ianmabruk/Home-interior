import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { userService } from '../services/userService.js'

const router = Router()

router.get('/wishlist', authenticate, async (req, res) => {
  const items = await userService.getWishlist(req.admin.email)
  res.json({ success: true, data: items })
})

router.post('/wishlist', authenticate, async (req, res) => {
  const result = await userService.toggleWishlist(req.admin.email, req.body.productId)
  res.json({ success: true, data: result })
})

router.delete('/wishlist/:productId', authenticate, async (req, res) => {
  const result = await userService.removeFromWishlist(req.admin.email, req.params.productId)
  res.json({ success: true, data: result })
})

router.get('/cart', authenticate, async (req, res) => {
  const result = await userService.getCart(req.admin.email)
  res.json({ success: true, data: result })
})

router.post('/cart', authenticate, async (req, res) => {
  const variant = req.body.variant || (req.body.variantId ? { _id: req.body.variantId } : null)
  const result = await userService.addToCart(req.admin.email, req.body.productId, req.body.quantity, variant)
  res.json({ success: true, data: result })
})

router.delete('/cart/:productId', authenticate, async (req, res) => {
  const variant = req.body?.variant || req.body?.color || req.body?.colorName || (req.body?.variantId ? { _id: req.body.variantId } : null)
  const result = await userService.removeFromCart(req.admin.email, req.params.productId, variant)
  res.json({ success: true, data: result })
})

router.patch('/cart', authenticate, async (req, res) => {
  const variant = req.body.variant || (req.body.variantId ? { _id: req.body.variantId } : null)
  const result = await userService.updateCart(req.admin.email, req.body.productId, req.body.quantity, variant)
  res.json({ success: true, data: result })
})

router.delete('/cart', authenticate, async (req, res) => {
  const result = await userService.clearCart(req.admin.email)
  res.json({ success: true, data: result })
})

export default router
