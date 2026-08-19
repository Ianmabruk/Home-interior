import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { portfolioController } from '../controllers/portfolioController.js'
import { uploadFields } from '../middleware/upload.js'
import { validateCsrfToken } from '../middleware/csrf.js'

const router = Router()

const MAX_GALLERY_IMAGES = 21

router.get('/', portfolioController.list)
router.get('/:id', portfolioController.get)
router.post('/', authenticate, validateCsrfToken, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: MAX_GALLERY_IMAGES }, { name: 'before', maxCount: MAX_GALLERY_IMAGES }, { name: 'after', maxCount: MAX_GALLERY_IMAGES }]), portfolioController.create)
router.patch('/:id', authenticate, validateCsrfToken, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: MAX_GALLERY_IMAGES }, { name: 'before', maxCount: MAX_GALLERY_IMAGES }, { name: 'after', maxCount: MAX_GALLERY_IMAGES }]), portfolioController.update)
router.delete('/:id', authenticate, validateCsrfToken, portfolioController.delete)

export default router
