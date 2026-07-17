import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import adminRoutes from './adminRoutes.js'
import authRoutes from './authRoutes.js'
import contentRoutes from './contentRoutes.js'
import messageRoutes from './messageRoutes.js'
import analyticsRoutes from './analyticsRoutes.js'
import orderRoutes from './orderRoutes.js'
import productRoutes from './productRoutes.js'
import userRoutes from './userRoutes.js'
import projectV2Routes from './projectV2Routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/products', productRoutes)
router.use('/content', contentRoutes)
router.use('/project-v2', projectV2Routes)
router.use('/orders', orderRoutes)
router.use('/users', userRoutes)
router.use('/admin', adminRoutes)
router.use('/analytics', analyticsRoutes)
router.use('/messages', messageRoutes)

export default router
