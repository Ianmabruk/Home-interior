import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { socialsController } from '../controllers/socialsController.js'
import { uploadSingle } from '../middleware/upload.js'

const router = Router()

router.get('/', authenticate, socialsController.get)
router.post('/', authenticate, uploadSingle('socialImage'), socialsController.update)

export default router