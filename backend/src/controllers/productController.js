import { asyncHandler } from '../middleware/asyncHandler.js'
import { productService } from '../services/productService.js'
import { failure } from '../utils/response.js'

export const productController = {
  list: asyncHandler(async (req, res) => {
    const { sort, limit, featured, category } = req.query
    const where = {}
    if (category) where.category = category
    const items = await productService.listProducts({ sort, limit, featured })
    res.json({ success: true, data: items })
  }),

  getAll: asyncHandler(async (req, res) => {
    const { sort, limit } = req.query
    const result = await productService.getAllProducts({ sort, limit })
    res.json({ success: true, data: result })
  }),

  get: asyncHandler(async (req, res) => {
    const item = await productService.getProduct(req.params.id)
    res.json({ success: true, data: item })
  }),

  create: asyncHandler(async (req, res) => {
    const files = Array.isArray(req.files) ? req.files : []
    const imageFiles = files.filter((f) => f.fieldname === 'images' || !f.fieldname)
    const variantFiles = files
      .filter((f) => f.fieldname && f.fieldname.startsWith('variantImages['))
      .map((f) => {
        const match = f.fieldname.match(/variantImages\[(\d+)\]/)
        return { ...f, index: match ? Number(match[1]) : 0 }
      })

    const data = {
      name: req.body.name || 'Untitled Product',
      description: req.body.description || '',
      price: Number(req.body.price) || 0,
      originalPrice: req.body.discountPrice ? Number(req.body.discountPrice) : undefined,
      category: req.body.category || 'Mirrors',
      vendor: req.body.vendor || '',
      stock: Number(req.body.stock) || 0,
      sku: req.body.sku || '',
      tags: req.body.tags || [],
      featured: req.body.isFeatured === 'true' || req.body.isFeatured === true,
      inStock: req.body.isPublished !== 'false' && req.body.isPublished !== false,
      displayOrder: Number(req.body.displayOrder) || 0,
      variants: req.body.variants ? (() => { try { return JSON.parse(req.body.variants) } catch { return [] } })() : [],
    }
    const item = await productService.createProduct(data, imageFiles, variantFiles)
    res.status(201).json({ success: true, data: item })
  }),

  update: asyncHandler(async (req, res) => {
    const files = Array.isArray(req.files) ? req.files : []
    const imageFiles = files.filter((f) => f.fieldname === 'images' || !f.fieldname)
    const variantFiles = files
      .filter((f) => f.fieldname && f.fieldname.startsWith('variantImages['))
      .map((f) => {
        const match = f.fieldname.match(/variantImages\[(\d+)\]/)
        return { ...f, index: match ? Number(match[1]) : 0 }
      })

    const data = {}
    if (req.body.name !== undefined) data.name = req.body.name
    if (req.body.description !== undefined) data.description = req.body.description
    if (req.body.price !== undefined) data.price = Number(req.body.price)
    if (req.body.discountPrice !== undefined) data.originalPrice = Number(req.body.discountPrice)
    if (req.body.category !== undefined) data.category = req.body.category
    if (req.body.vendor !== undefined) data.vendor = req.body.vendor
    if (req.body.stock !== undefined) data.stock = Number(req.body.stock)
    if (req.body.sku !== undefined) data.sku = req.body.sku
    if (req.body.tags !== undefined) data.tags = req.body.tags
    if (req.body.isFeatured !== undefined) data.featured = req.body.isFeatured === 'true' || req.body.isFeatured === true
    if (req.body.isPublished !== undefined) data.inStock = req.body.isPublished === 'false' || req.body.isPublished === false
    if (req.body.variants !== undefined) {
      try { data.variants = JSON.parse(req.body.variants) } catch { data.variants = [] }
    }
    const item = await productService.updateProduct(req.params.id, data, imageFiles, variantFiles)
    res.json({ success: true, data: item })
  }),

  delete: asyncHandler(async (req, res) => {
    await productService.deleteProduct(req.params.id)
    res.json({ success: true, data: { message: 'Deleted' } })
  }),
}
