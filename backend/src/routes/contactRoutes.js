import express from 'express'
import { optionalAuth } from '../middleware/auth.js'
import { contactController } from '../controllers/contactController.js'
import { cacheHeaders } from '../middleware/cacheHeaders.js'
import { uploadFields } from '../middleware/upload.js'
import { validateZod } from '../middleware/validateZod.js'
import { contactSchemas } from '../validations/schemas.js'

const router = express.Router()

router.get('/', optionalAuth, cacheHeaders(60, 30), contactController.get)
router.post('/', validateZod(contactSchemas.post), contactController.post)
router.post('/inquiry', uploadFields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }, { name: 'image3', maxCount: 1 }]), validateZod(contactSchemas.inquiry), contactController.inquiry)

export default router
