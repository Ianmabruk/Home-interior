import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { userService } from '../services/userService.js'

const router = Router()

router.get('/wishlist', authenticate, asyncHandler(async (req, res) => {
  const items = await userService.getWishlist(req.admin.email)
  res.json({ success: true, data: items })
}))

router.post('/wishlist', authenticate, asyncHandler(async (req, res) => {
  const { productId } = req.body
  if (!productId) {
    throw new ApiError(400, 'productId is required')
  }
  const result = await userService.toggleWishlist(req.admin.email, productId)
  res.json({ success: true, data: result })
}))

router.delete('/wishlist/:productId', authenticate, asyncHandler(async (req, res) => {
  const result = await userService.removeFromWishlist(req.admin.email, req.params.productId)
  res.json({ success: true, data: result })
}))

router.get('/cart', authenticate, asyncHandler(async (req, res) => {
  const result = await userService.getCart(req.admin.email)
  res.json({ success: true, data: result })
}))

router.post('/cart', authenticate, asyncHandler(async (req, res) => {
  const { productId, quantity, variant, variantId } = req.body
  if (!productId) {
    throw new ApiError(400, 'productId is required')
  }
  const resolvedVariant = variant || (variantId ? { _id: variantId } : null)
  const result = await userService.addToCart(req.admin.email, productId, Number(quantity) || 1, resolvedVariant)
  res.json({ success: true, data: result })
}))

router.delete('/cart/:productId', authenticate, asyncHandler(async (req, res) => {
  const { variant, color, colorName, variantId } = req.body || {}
  const resolvedVariant = variant || color || colorName || (variantId ? { _id: variantId } : null)
  const result = await userService.removeFromCart(req.admin.email, req.params.productId, resolvedVariant)
  res.json({ success: true, data: result })
}))

router.patch('/cart', authenticate, asyncHandler(async (req, res) => {
  const { productId, quantity, variant, variantId } = req.body
  if (!productId) {
    throw new ApiError(400, 'productId is required')
  }
  const resolvedVariant = variant || (variantId ? { _id: variantId } : null)
  const result = await userService.updateCart(req.admin.email, productId, Number(quantity) || 1, resolvedVariant)
  res.json({ success: true, data: result })
}))

router.delete('/cart', authenticate, asyncHandler(async (req, res) => {
  const result = await userService.clearCart(req.admin.email)
  res.json({ success: true, data: result })
}))

export default router
