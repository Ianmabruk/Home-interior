import { Router } from 'express'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import { productController } from '../controllers/productController.js'
import { uploadProductImages, uploadProductImagesStrict } from '../middleware/upload.js'
import { cacheHeaders } from '../middleware/cacheHeaders.js'

const router = Router()

router.get('/', cacheHeaders(5, 30), productController.list)
router.get('/:id', cacheHeaders(10, 60), productController.get)
router.post('/', authenticate, uploadProductImagesStrict(60), productController.create)
router.patch('/:id', authenticate, uploadProductImagesStrict(60), productController.update)
router.delete('/:id', authenticate, productController.delete)
router.delete('/:id/images/:imageId', authenticate, productController.deleteImage)
router.get('/admin/all', authenticate, productController.getAll)

export default router
