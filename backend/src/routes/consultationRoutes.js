import { Router } from 'express'
import { uploadArray } from '../middleware/upload.js'
import { consultationController } from '../controllers/consultationController.js'
import { validateZod } from '../middleware/validateZod.js'
import { consultationSchemas } from '../validations/schemas.js'

const router = Router()

router.post('/', uploadArray('images', 10), validateZod(consultationSchemas.publicCreate), consultationController.publicCreate)
router.get('/', consultationController.list)

export default router
