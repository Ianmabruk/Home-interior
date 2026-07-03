import { Router } from 'express'
import adminRoutes from './adminRoutes.js'
import authRoutes from './authRoutes.js'
import contentRoutes from './contentRoutes.js'
import messageRoutes from './messageRoutes.js'
import { subscribeNewsletter } from '../controllers/newsletterController.js'
import orderRoutes from './orderRoutes.js'
import productRoutes from './productRoutes.js'
import userRoutes from './userRoutes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/products', productRoutes)
router.use('/content', contentRoutes)
router.use('/orders', orderRoutes)
router.use('/users', userRoutes)
router.use('/admin', adminRoutes)
router.use('/messages', messageRoutes)
router.post('/newsletter/subscribe', subscribeNewsletter)

export default router
