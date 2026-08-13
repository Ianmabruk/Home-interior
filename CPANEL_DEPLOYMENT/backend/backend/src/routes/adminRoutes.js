import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { uploadSingle, uploadFields, uploadProductImages, uploadProductImagesStrict } from '../middleware/upload.js'
import { uploadFile } from '../uploads/uploadService.js'
import { validateCsrfToken } from '../middleware/csrf.js'
import { prisma } from '../config/database.js'
import { portfolioController } from '../controllers/portfolioController.js'
import { virtualDesignController } from '../controllers/virtualDesignController.js'
import { serviceController } from '../controllers/serviceController.js'
import { productController } from '../controllers/productController.js'
import { aboutController } from '../controllers/aboutController.js'
import { aboutImageController } from '../controllers/aboutImageController.js'
import { heroMediaController } from '../controllers/heroMediaController.js'
import { testimonialController } from '../controllers/testimonialController.js'
import { consultationController } from '../controllers/consultationController.js'
import { orderController } from '../controllers/orderController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { adminOverviewController } from '../controllers/adminOverviewController.js'
import { workWithUsController } from '../controllers/workWithUsController.js'
import adminSocialRoutes from './adminSocialRoutes.js'

const router = Router()

router.use(authenticate, authorize('ADMIN'), validateCsrfToken)

router.get('/overview', adminOverviewController.getStats)
router.get('/settings', adminOverviewController.getSettings)
router.put('/settings', adminOverviewController.updateSettings)
router.post('/settings/shop-banner', uploadSingle('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image uploaded' })
  }
  const uploaded = await uploadFile(req.file.buffer, req.file.mimetype, 'shop-banner')
  await prisma.siteSetting.upsert({
    where: { key: 'shopBannerImage' },
    update: { value: uploaded.url },
    create: { key: 'shopBannerImage', value: uploaded.url },
  })
  res.status(201).json({ success: true, data: { url: uploaded.url, path: uploaded.path } })
}))

// Admin Socials
router.use('/socials', adminSocialRoutes)

// Admin Portfolio
router.get('/portfolio', portfolioController.list)
router.get('/portfolio/:id', portfolioController.get)
router.post('/portfolio', uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), portfolioController.create)
router.patch('/portfolio/:id', uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), portfolioController.update)
router.delete('/portfolio/:id', portfolioController.delete)

// Admin Virtual Designs
router.get('/virtual-designs', virtualDesignController.list)
router.get('/virtual-designs/:id', virtualDesignController.get)
router.post('/virtual-designs', uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), virtualDesignController.create)
router.patch('/virtual-designs/:id', uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), virtualDesignController.update)
router.delete('/virtual-designs/:id', virtualDesignController.delete)

// Admin Services
router.get('/services', serviceController.list)
router.get('/services/:id', serviceController.get)
router.post('/services', uploadSingle('media'), serviceController.create)
router.patch('/services/:id', uploadSingle('media'), serviceController.update)
router.delete('/services/:id', serviceController.delete)
router.post('/services/reorder', serviceController.reorder)

// Admin Shop (Products)
router.get('/shop', productController.list)
router.get('/shop/:id', productController.get)
router.post('/shop', uploadProductImagesStrict(60), productController.create)
router.patch('/shop/:id', uploadProductImagesStrict(60), productController.update)
router.delete('/shop/:id', productController.delete)

// Admin About
router.get('/about', aboutController.get)
router.put('/about', uploadSingle('media'), aboutController.update)

// Admin About Images
router.get('/about/images', aboutImageController.list)
router.post('/about/images', uploadSingle('image'), aboutImageController.create)
router.patch('/about/images/:id', uploadSingle('image'), aboutImageController.update)
router.delete('/about/images/:id', aboutImageController.delete)
router.patch('/about/images/reorder', aboutImageController.reorder)

// Admin Socials
router.use('/socials', adminSocialRoutes)

// Admin Hero Images
router.get('/hero-images', heroMediaController.list)
router.get('/hero-images/:id', heroMediaController.get)
router.post('/hero-images', uploadFields([{ name: 'media', maxCount: 10 }]), heroMediaController.create)
router.patch('/hero-images/:id', uploadFields([{ name: 'media', maxCount: 10 }]), heroMediaController.update)
router.delete('/hero-images/:id', heroMediaController.delete)

// Admin Testimonials
router.get('/testimonials', testimonialController.list)
router.get('/testimonials/:id', testimonialController.get)
router.post('/testimonials', uploadSingle('photo'), testimonialController.create)
router.patch('/testimonials/:id', uploadSingle('photo'), testimonialController.update)
router.delete('/testimonials/:id', testimonialController.delete)

// Admin Consultations
router.get('/consultations', consultationController.list)
router.patch('/consultations/:id/status', consultationController.updateStatus)
router.delete('/consultations/:id', consultationController.delete)
router.get('/consultations/export', consultationController.exportCsv)

// Admin Orders
router.get('/orders', orderController.listAll)
router.patch('/orders/:id/status', orderController.updateStatus)

// Admin Work With Us
router.get('/work-with-us', workWithUsController.list)
router.get('/work-with-us/:id', workWithUsController.get)
router.patch('/work-with-us/:id/status', workWithUsController.updateStatus)
router.delete('/work-with-us/:id', workWithUsController.delete)
router.get('/work-with-us/content', workWithUsController.listContent)
router.post('/work-with-us/content', workWithUsController.createContent)
router.patch('/work-with-us/content/:id', workWithUsController.updateContent)
router.delete('/work-with-us/content/:id', workWithUsController.deleteContent)

export default router
