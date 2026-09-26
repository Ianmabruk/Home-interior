import { Router } from 'express'
import { blogController } from '../controllers/blogController.js'
import { cacheHeaders } from '../middleware/cacheHeaders.js'

const router = Router()

// The list changes rarely, so it can be cached briefly. Individual article
// reads are NOT given a long public window: a CDN could otherwise keep serving
// a cached 404 (or a pre-edit copy) for a post that was just created or
// updated, which is what made freshly published articles look like they had
// vanished on refresh. Short freshness + a modest stale window keeps the page
// responsive while bounding how long stale content can survive.
const LIST_CACHE = 30
const LIST_STALE = 60
const DETAIL_CACHE = 10
const DETAIL_STALE = 10

router.get('/', cacheHeaders(LIST_CACHE, LIST_STALE), blogController.listPublished)
router.get('/slug/:slug', cacheHeaders(DETAIL_CACHE, DETAIL_STALE), blogController.getBySlug)
router.get('/categories', cacheHeaders(60, 300), blogController.getCategoriesAndTags)
router.post('/:id/view', blogController.recordView)
router.get('/:id', cacheHeaders(DETAIL_CACHE, DETAIL_STALE), blogController.getPublished)
router.get('/:id/related', cacheHeaders(DETAIL_CACHE, DETAIL_STALE), blogController.related)
router.get('/:id/prev-next', cacheHeaders(DETAIL_CACHE, DETAIL_STALE), blogController.getPreviousAndNext)

export default router
