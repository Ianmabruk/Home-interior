import { Router } from 'express'
import { auth } from '../middleware/auth.js'
import {
	addToCart,
	getCart,
	getWishlist,
	me,
	removeCartItem,
	toggleWishlist,
	updateCartItem,
	updateMe,
} from '../controllers/userController.js'

const router = Router()

router.get('/me', auth, me)
router.patch('/me', auth, updateMe)
router.get('/wishlist', auth, getWishlist)
router.post('/wishlist/toggle', auth, toggleWishlist)
router.get('/cart', auth, getCart)
router.post('/cart', auth, addToCart)
router.patch('/cart', auth, updateCartItem)
router.delete('/cart/:productId', auth, removeCartItem)

export default router
