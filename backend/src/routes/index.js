import { Router } from 'express'
import authRoutes from './authRoutes.js'
import adminRoutes from './adminRoutes.js'
import productRoutes from './productRoutes.js'
import orderRoutes from './orderRoutes.js'
import mediaRoutes from './mediaRoutes.js'
import serviceRoutes from './serviceRoutes.js'
import testRoutes from './testimonialRoutes.js'
import heroRoutes from './heroMediaRoutes.js'
import aboutRoutes from './aboutRoutes.js'
import contactRoutes from './contactRoutes.js'
import consultationRoutes from './consultationRoutes.js'
import chatRoutes from './chatRoutes.js'
import publicBlogRoutes from './publicBlogRoutes.js'
import blogRoutes from './blogRoutes.js'
import contentRoutes, { portfolioRoutes as contentPortfolioRoutes, virtualDesignRoutes as contentVDRoutes } from './contentRoutes.js'
import messageRoutes from './messageRoutes.js'
import socialsRoutes from './socialsRoutes.js'
import workWithUsRoutes from './workWithUsRoutes.js'
import publicConfigController from '../controllers/publicConfigController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { uploadSingle } from '../middleware/upload.js'
import { uploadFile } from '../uploads/uploadService.js'
import { authenticate } from '../middleware/auth.js'
import { cacheHeaders } from '../middleware/cacheHeaders.js'
import { contentController } from '../controllers/contentController.js'
import { prisma } from '../config/database.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/admin', adminRoutes)

router.use('/content', contentRoutes)
router.get('/homepage', cacheHeaders(5, 30), contentController.homepage)
router.use('/content/portfolio', contentPortfolioRoutes)
router.use('/content/virtual-design', contentVDRoutes)
router.use('/content/services', serviceRoutes)
router.use('/content/about', aboutRoutes)
router.use('/about', aboutRoutes)
router.use('/contact', contactRoutes)
router.use('/content/hero-media', heroRoutes)
router.use('/content/consultations', consultationRoutes)
router.use('/content/media', mediaRoutes)
router.use('/content/testimonials', testRoutes)
router.use('/socials', socialsRoutes)
router.use('/content/socials', socialsRoutes)
router.use('/portfolio', contentPortfolioRoutes)
router.use('/virtual-design', contentVDRoutes)
router.use('/services', serviceRoutes)
router.use('/products', productRoutes)
router.use('/orders', orderRoutes)
router.use('/media', mediaRoutes)
router.use('/testimonials', testRoutes)
router.use('/messages', messageRoutes)
router.use('/chat', chatRoutes)
router.use('/blog', publicBlogRoutes)
router.use('/admin/blog', blogRoutes)
router.use('/content/work-with-us', workWithUsRoutes)
router.use('/work-with-us', workWithUsRoutes)

router.post('/test-upload', authenticate, uploadSingle('media'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' })
  }
  const uploaded = await uploadFile(req.file.buffer, req.file.mimetype, 'test-uploads')
  res.status(201).json({ success: true, data: { url: uploaded.url, path: uploaded.path } })
}))

router.get('/settings/shop-banner', asyncHandler(async (req, res) => {
  try {
    const settings = await prisma.siteSetting.findMany()
    const result = {}
    for (const s of settings) result[s.key] = s.value
    res.json({ success: true, data: { shopBannerImage: result.shopBannerImage || '' } })
  } catch {
    res.json({ success: true, data: { shopBannerImage: '' } })
  }
}))

// Public, non-sensitive config for the PWA + push (exposes ONLY the VAPID public key).
router.get('/config/public', publicConfigController.getConfig)

export default router
