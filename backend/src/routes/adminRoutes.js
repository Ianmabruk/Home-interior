import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { adminOverviewController } from '../controllers/adminOverviewController.js'
import { uploadSingle } from '../middleware/upload.js'
import { uploadFile } from '../uploads/uploadService.js'
import { prisma } from '../config/database.js'

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

export default router
