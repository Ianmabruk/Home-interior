import { Router } from 'express'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import { aboutController } from '../controllers/aboutController.js'
import { aboutImageController } from '../controllers/aboutImageController.js'
import { uploadFields, uploadSingle } from '../middleware/upload.js'
import { cacheHeaders } from '../middleware/cacheHeaders.js'

const router = Router()

router.get('/', optionalAuth, cacheHeaders(60, 30), aboutController.get)

router.post('/', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'socialMedia', maxCount: 1 }]), aboutController.update)
router.put('/', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'socialMedia', maxCount: 1 }]), aboutController.update)

router.get('/images', optionalAuth, cacheHeaders(60, 30), aboutImageController.list)
router.post('/images', authenticate, uploadSingle('image'), aboutImageController.create)
router.patch('/images/:id', authenticate, uploadSingle('image'), aboutImageController.update)
router.delete('/images/:id', authenticate, aboutImageController.delete)
router.patch('/images/reorder', authenticate, aboutImageController.reorder)

export default router
