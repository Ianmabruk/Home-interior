import { Router } from 'express'
import { contentController } from '../controllers/contentController.js'
import { portfolioController } from '../controllers/portfolioController.js'
import { virtualDesignController } from '../controllers/virtualDesignController.js'
import { uploadFields } from '../middleware/upload.js'
import { authenticate } from '../middleware/auth.js'
import { cacheHeaders } from '../middleware/cacheHeaders.js'
import { validateZod } from '../middleware/validateZod.js'
import { contentSchemas, portfolioSchemas, virtualDesignSchemas } from '../validations/schemas.js'

const router = Router()

router.get('/homepage', cacheHeaders(5, 30), contentController.homepage)
router.post('/newsletter', validateZod(contentSchemas.newsletter), contentController.newsletter)

export const portfolioRoutes = Router()
portfolioRoutes.get('/', cacheHeaders(5, 30), portfolioController.list)
portfolioRoutes.get('/:id', cacheHeaders(10, 60), portfolioController.get)
portfolioRoutes.post('/', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), validateZod(portfolioSchemas.create), portfolioController.create)
portfolioRoutes.patch('/:id', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), validateZod(portfolioSchemas.update), portfolioController.update)
portfolioRoutes.delete('/:id', authenticate, portfolioController.delete)

export const virtualDesignRoutes = Router()
virtualDesignRoutes.get('/', cacheHeaders(5, 30), virtualDesignController.list)
virtualDesignRoutes.get('/:id', cacheHeaders(10, 60), virtualDesignController.get)
virtualDesignRoutes.post('/', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), validateZod(virtualDesignSchemas.create), virtualDesignController.create)
virtualDesignRoutes.patch('/:id', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), validateZod(virtualDesignSchemas.update), virtualDesignController.update)
virtualDesignRoutes.delete('/:id', authenticate, virtualDesignController.delete)

export default router
