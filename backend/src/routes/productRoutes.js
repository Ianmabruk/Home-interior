import { Router } from 'express'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import { productController } from '../controllers/productController.js'
import { uploadProductImages } from '../middleware/upload.js'
import { cacheHeaders } from '../middleware/cacheHeaders.js'

const router = Router()

router.get('/', cacheHeaders(60, 30), productController.list)
router.get('/:id', cacheHeaders(120, 60), productController.get)
router.post('/', authenticate, uploadProductImages(60), productController.create)
router.patch('/:id', authenticate, uploadProductImages(60), productController.update)
router.delete('/:id', authenticate, productController.delete)
router.get('/admin/all', authenticate, productController.getAll)

export default router
