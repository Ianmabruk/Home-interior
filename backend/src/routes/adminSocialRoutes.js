import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { socialController } from '../controllers/socialController.js'
import { uploadSingle } from '../middleware/upload.js'

const router = Router()

router.get('/', authenticate, socialController.get)
router.post('/', authenticate, uploadSingle('image'), socialController.create)
router.patch('/:id', authenticate, uploadSingle('image'), socialController.update)
router.delete('/:id', authenticate, socialController.delete)
router.patch('/reorder', authenticate, socialController.reorder)

export default router
