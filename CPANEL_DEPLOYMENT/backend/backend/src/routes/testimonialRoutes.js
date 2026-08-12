import { Router } from 'express'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import { testimonialController } from '../controllers/testimonialController.js'
import { uploadSingle } from '../middleware/upload.js'
import { cacheHeaders } from '../middleware/cacheHeaders.js'
import { validateZod } from '../middleware/validateZod.js'
import { validateCsrfToken } from '../middleware/csrf.js'
import { testimonialSchemas } from '../validations/schemas.js'

const router = Router()

router.get('/', optionalAuth, cacheHeaders(120, 60), testimonialController.list)
router.get('/:id', optionalAuth, cacheHeaders(120, 60), testimonialController.get)
router.post('/', authenticate, validateCsrfToken, uploadSingle('photo', ['image/jpeg', 'image/png', 'image/webp']), validateZod(testimonialSchemas.create), testimonialController.create)
router.patch('/:id', authenticate, validateCsrfToken, uploadSingle('photo', ['image/jpeg', 'image/png', 'image/webp']), validateZod(testimonialSchemas.update), testimonialController.update)
router.delete('/:id', authenticate, validateCsrfToken, testimonialController.delete)

export default router
