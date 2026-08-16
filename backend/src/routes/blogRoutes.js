import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { uploadFields } from '../middleware/upload.js'
import { blogController } from '../controllers/blogController.js'
import { validateZod } from '../middleware/validateZod.js'
import { blogSchemas } from '../validations/schemas.js'

const router = Router()

router.use(authenticate, authorize('ADMIN'))

router.get('/', blogController.getAll)
router.get('/stats', blogController.stats)
router.get('/slug/:slug', blogController.getBySlug)
router.get('/:id', blogController.get)
router.get('/:id/related', blogController.related)
router.post(
  '/',
  uploadFields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'contentImages', maxCount: 10 },
    { name: 'homepageCircularImage', maxCount: 1 },
  ]),
  validateZod(blogSchemas.create),
  blogController.create,
)
router.patch(
  '/:id',
  uploadFields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'contentImages', maxCount: 10 },
    { name: 'homepageCircularImage', maxCount: 1 },
  ]),
  validateZod(blogSchemas.update),
  blogController.update,
)
router.delete('/:id', blogController.delete)

export default router
