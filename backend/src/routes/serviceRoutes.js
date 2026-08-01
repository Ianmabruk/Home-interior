import { Router } from 'express'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import { serviceController } from '../controllers/serviceController.js'
import { uploadSingle } from '../middleware/upload.js'
import { cacheHeaders } from '../middleware/cacheHeaders.js'
import { validateZod } from '../middleware/validateZod.js'
import { serviceSchemas } from '../validations/schemas.js'

const router = Router()

router.get('/', optionalAuth, cacheHeaders(120, 60), serviceController.list)
router.get('/:id', optionalAuth, cacheHeaders(120, 60), serviceController.get)
router.post('/', authenticate, uploadSingle('media', ['image/jpeg', 'image/png', 'image/webp', 'image/gif']), validateZod(serviceSchemas.create), serviceController.create)
router.patch('/:id', authenticate, uploadSingle('media', ['image/jpeg', 'image/png', 'image/webp', 'image/gif']), validateZod(serviceSchemas.update), serviceController.update)
router.patch('/reorder', authenticate, validateZod(serviceSchemas.reorder), serviceController.reorder)
router.delete('/:id', authenticate, serviceController.delete)

export default router
