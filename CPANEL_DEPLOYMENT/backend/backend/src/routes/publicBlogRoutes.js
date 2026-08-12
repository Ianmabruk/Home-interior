import { Router } from 'express'
import { blogController } from '../controllers/blogController.js'
import { cacheHeaders } from '../middleware/cacheHeaders.js'

const router = Router()

router.get('/', cacheHeaders(5, 30), blogController.listPublished)
router.get('/slug/:slug', cacheHeaders(10, 60), blogController.getBySlug)
router.get('/categories', cacheHeaders(60, 300), blogController.getCategoriesAndTags)
router.get('/:id', cacheHeaders(10, 60), blogController.getPublished)
router.get('/:id/related', cacheHeaders(10, 60), blogController.related)
router.get('/:id/prev-next', cacheHeaders(10, 60), blogController.getPreviousAndNext)

export default router
