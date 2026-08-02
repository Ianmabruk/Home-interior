import { Router } from 'express'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import { aboutController } from '../controllers/aboutController.js'
import { uploadFields } from '../middleware/upload.js'
import { cacheHeaders } from '../middleware/cacheHeaders.js'

const router = Router()

router.get('/', optionalAuth, cacheHeaders(60, 30), aboutController.get)
router.get('/team', optionalAuth, cacheHeaders(60, 30), aboutController.get)
router.post('/', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'socialMedia', maxCount: 1 }]), aboutController.update)
router.put('/', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'socialMedia', maxCount: 1 }]), aboutController.update)

export default router
