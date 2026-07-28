import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { uploadSingle, uploadFields, uploadProductImages } from '../middleware/upload.js'
import { uploadFile } from '../uploads/uploadService.js'
import { prisma } from '../config/database.js'
import { portfolioController } from '../controllers/portfolioController.js'
import { virtualDesignController } from '../controllers/virtualDesignController.js'
import { serviceController } from '../controllers/serviceController.js'
import { productController } from '../controllers/productController.js'
import { aboutController } from '../controllers/aboutController.js'
import { heroMediaController } from '../controllers/heroMediaController.js'
import { testimonialController } from '../controllers/testimonialController.js'
import { consultationController } from '../controllers/consultationController.js'
import { orderController } from '../controllers/orderController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import adminSocialRoutes from './adminSocialRoutes.js'

const router = Router()

router.get('/overview', authenticate, adminOverviewController.getStats)
router.get('/settings', authenticate, adminOverviewController.getSettings)
router.put('/settings', authenticate, adminOverviewController.updateSettings)
router.post('/settings/shop-banner', authenticate, uploadSingle('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image uploaded' })
  }
  try {
    const uploaded = await uploadFile(req.file.buffer, req.file.mimetype, 'shop-banner')
    const existing = await prisma.siteSetting.findUnique({ where: { key: 'shopBannerImage' } })
    if (existing) {
      await prisma.siteSetting.update({ where: { key: 'shopBannerImage' }, data: { value: uploaded.url } })
    } else {
      await prisma.siteSetting.create({ data: { key: 'shopBannerImage', value: uploaded.url } })
    }
    res.status(201).json({ success: true, data: { url: uploaded.url, path: uploaded.path } })
  } catch (err) {
    res.status(500).json({ success: false, message: err?.message || 'Upload failed' })
  }
})

// Admin Socials
router.use('/socials', adminSocialRoutes)

// Admin Portfolio
router.get('/portfolio', authenticate, portfolioController.list)
router.get('/portfolio/:id', authenticate, portfolioController.get)
router.post('/portfolio', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), portfolioController.create)
router.patch('/portfolio/:id', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), portfolioController.update)
router.delete('/portfolio/:id', authenticate, portfolioController.delete)

// Admin Virtual Designs
router.get('/virtual-designs', authenticate, virtualDesignController.list)
router.get('/virtual-designs/:id', authenticate, virtualDesignController.get)
router.post('/virtual-designs', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), virtualDesignController.create)
router.patch('/virtual-designs/:id', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), virtualDesignController.update)
router.delete('/virtual-designs/:id', authenticate, virtualDesignController.delete)

// Admin Services
router.get('/services', authenticate, serviceController.list)
router.get('/services/:id', authenticate, serviceController.get)
router.post('/services', authenticate, uploadSingle('image'), serviceController.create)
router.patch('/services/:id', authenticate, uploadSingle('image'), serviceController.update)
router.delete('/services/:id', authenticate, serviceController.delete)
router.post('/services/reorder', authenticate, serviceController.reorder)

// Admin Shop (Products)
router.get('/shop', authenticate, productController.list)
router.get('/shop/:id', authenticate, productController.get)
router.post('/shop', authenticate, uploadProductImages(60), productController.create)
router.patch('/shop/:id', authenticate, uploadProductImages(60), productController.update)
router.delete('/shop/:id', authenticate, productController.delete)

// Admin About
router.get('/about', authenticate, aboutController.get)
router.put('/about', authenticate, uploadSingle('image'), aboutController.update)

// Admin Hero Images
router.get('/hero-images', authenticate, heroMediaController.list)
router.get('/hero-images/:id', authenticate, heroMediaController.get)
router.post('/hero-images', authenticate, uploadFields([{ name: 'media', maxCount: 10 }]), heroMediaController.create)
router.patch('/hero-images/:id', authenticate, uploadFields([{ name: 'media', maxCount: 10 }]), heroMediaController.update)
router.delete('/hero-images/:id', authenticate, heroMediaController.delete)

// Admin Testimonials
router.get('/testimonials', authenticate, testimonialController.list)
router.get('/testimonials/:id', authenticate, testimonialController.get)
router.post('/testimonials', authenticate, uploadSingle('photo'), testimonialController.create)
router.patch('/testimonials/:id', authenticate, uploadSingle('photo'), testimonialController.update)
router.delete('/testimonials/:id', authenticate, testimonialController.delete)

// Admin Consultations
router.get('/consultations', authenticate, consultationController.list)
router.patch('/consultations/:id/status', authenticate, consultationController.updateStatus)
router.delete('/consultations/:id', authenticate, consultationController.delete)
router.get('/consultations/export', authenticate, consultationController.exportCsv)

// Admin Orders
router.get('/orders', authenticate, orderController.listAll)
router.patch('/orders/:id/status', authenticate, orderController.updateStatus)

export default router
