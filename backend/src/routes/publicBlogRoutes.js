import { Router } from 'express'
import { blogController } from '../controllers/blogController.js'
import { cacheHeaders } from '../middleware/cacheHeaders.js'

const router = Router()

router.get('/', cacheHeaders(5, 30), blogController.listPublished)
router.get('/:id', cacheHeaders(10, 60), blogController.getPublished)

export default router
