import { Router } from 'express'
import { blogController } from '../controllers/blogController.js'

const router = Router()

router.get('/', blogController.listPublished)
router.get('/:id', blogController.getPublished)

export default router
