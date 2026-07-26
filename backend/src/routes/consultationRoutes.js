import { Router } from 'express'
import { uploadArray } from '../middleware/upload.js'
import { consultationController } from '../controllers/consultationController.js'

const router = Router()

router.post('/', uploadArray('images', 10), consultationController.publicCreate)
router.get('/', consultationController.list)

export default router
