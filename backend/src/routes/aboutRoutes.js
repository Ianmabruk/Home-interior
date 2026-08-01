import { Router } from 'express'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import { aboutController } from '../controllers/aboutController.js'
import { uploadFields } from '../middleware/upload.js'

const router = Router()

router.get('/', optionalAuth, aboutController.get)
router.get('/team', optionalAuth, aboutController.get)
router.post('/', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'socialMedia', maxCount: 1 }]), aboutController.update)
router.put('/', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'socialMedia', maxCount: 1 }]), aboutController.update)

export default router
