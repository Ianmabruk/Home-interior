import { prisma } from '../config/database.js'
import { uploadFile, deleteFiles } from '../uploads/uploadService.js'
import { failure } from '../utils/response.js'

function mapProduct(item) {
  if (!item) return null
  const images = Array.isArray(item.images) ? item.images : []
  const storagePaths = Array.isArray(item.storagePaths) ? item.storagePaths : []
  return {
    ...item,
    _id: item.id,
    images,
    storagePaths,
    discountPrice: item.originalPrice,
    variants: (item.variants || []).map((v) => ({
      id: v.id,
      color: v.color,
      colorHex: v.colorHex,
      image: v.image,
      stock: v.stock,
      price: v.price,
    })),
  }
}

function mapVariant(v) {
  return {
    id: v.id,
    productId: v.productId,
    color: v.color,
    image: v.image,
    stock: v.stock,
    price: v.price,
  }
}

export const productService = {
  listProducts,
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
}

async function listProducts({ sort = '-createdAt', limit = 100, featured } = {}) {
  try {
    const orderBy = sort?.startsWith('-') ? { [sort.slice(1)]: 'desc' } : { createdAt: 'asc' }
    const where = {}
    if (featured !== undefined) where.featured = featured === 'true' || featured === true
    if (featured === true || featured === 'true') where.inStock = true

    const items = await prisma.product.findMany({
      where,
      orderBy,
      take: Number(limit) || 100,
      include: { variants: true },
    })
    return items.map(mapProduct)
  } catch {
    return []
  }
}

async function getAllProducts({ sort = '-createdAt', limit = 500 } = {}) {
  try {
    const orderBy = sort?.startsWith('-') ? { [sort.slice(1)]: 'desc' } : { createdAt: 'asc' }
    const items = await prisma.product.findMany({
      orderBy,
      take: Number(limit) || 500,
      include: { variants: true },
    })
    return { items: items.map(mapProduct) }
  } catch {
    return { items: [] }
  }
}

async function getProduct(id) {
  const item = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  })
  if (!item) throw failure(404, 'Product not found')
  return mapProduct(item)
}

async function createProduct(data, files, variantFiles = []) {
  const createData = { ...data }
  const images = []
  const storagePaths = []

  if (Array.isArray(files)) {
    for (const f of files) {
      const uploaded = await uploadFile(f.buffer, f.mimetype, 'products')
      console.log('[PRODUCT SERVICE] uploaded url:', uploaded.url, 'path:', uploaded.path)
      images.push(uploaded.url)
      if (uploaded.path) storagePaths.push(uploaded.path)
    }
  }

  if (images.length > 0) {
    createData.images = images
    createData.storagePaths = storagePaths
  }

  if (!createData.mainImage && images.length > 0) {
    createData.mainImage = images[0]
  }

  if (createData.tags && typeof createData.tags === 'string') {
    createData.tags = createData.tags.split(',').map((s) => s.trim()).filter(Boolean)
  }

  const rawVariants = Array.isArray(data.variants) ? data.variants : []
  delete createData.variants

  const item = await prisma.product.create({
    data: {
      ...createData,
      variants: {
        create: await Promise.all(
          rawVariants.map(async (v, idx) => {
            const imageFiles = variantFiles.filter((vf) => vf && vf.index === idx)
            console.log(`[PRODUCT SERVICE] variant ${idx} imageFiles count:`, imageFiles.length)
            let image = v.image || ''
            let storagePath = v.storagePath || ''
            if (imageFiles.length > 0) {
              const uploaded = await uploadFile(imageFiles[0].buffer, imageFiles[0].mimetype, 'product-variants')
              image = uploaded.url
              if (uploaded.path) storagePath = uploaded.path
            }
            return {
              color: v.color || 'Default',
              image: image || null,
              stock: Number(v.stock) || 0,
              price: v.price ? Number(v.price) : null,
              storagePath: storagePath || null,
            }
          }),
        ),
      },
    },
    include: { variants: true },
  })

  return mapProduct(item)
}

async function updateProduct(id, data, files, variantFiles = []) {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  })
  if (!existing) throw failure(404, 'Product not found')

  const updateData = { ...data }
  const images = [...(existing.images || [])]
  const storagePaths = [...(existing.storagePaths || [])]

  if (Array.isArray(files) && files.length > 0) {
    for (const f of files) {
      const uploaded = await uploadFile(f.buffer, f.mimetype, 'products')
      images.push(uploaded.url)
      if (uploaded.path) storagePaths.push(uploaded.path)
    }
    updateData.images = images
    updateData.storagePaths = storagePaths
  }

  if (!updateData.mainImage && images.length > 0) {
    updateData.mainImage = images[0]
  }

  if (updateData.tags && typeof updateData.tags === 'string') {
    updateData.tags = updateData.tags.split(',').map((s) => s.trim()).filter(Boolean)
  }

  const rawVariants = data.variants !== undefined ? data.variants : null
  delete updateData.variants

  let updatedItem
  if (rawVariants !== null) {
    const oldVariantPaths = (existing.variants || [])
      .map((v) => v.storagePath)
      .filter(Boolean)

    const newVariants = await Promise.all(
      rawVariants.map(async (v, idx) => {
        const imageFiles = variantFiles.filter((vf) => vf && vf.index === idx)
        let image = v.image || ''
        let storagePath = v.storagePath || ''
        if (imageFiles.length > 0) {
          const uploaded = await uploadFile(imageFiles[0].buffer, imageFiles[0].mimetype, 'product-variants')
          image = uploaded.url
          if (uploaded.path) storagePath = uploaded.path
        }
        return {
          color: v.color || 'Default',
          image: image || null,
          stock: Number(v.stock) || 0,
          price: v.price ? Number(v.price) : null,
          storagePath: storagePath || null,
        }
      }),
    )

    await prisma.productVariant.deleteMany({ where: { productId: id } })
    if (oldVariantPaths.length > 0) {
      await deleteFiles(oldVariantPaths)
    }

    updatedItem = await prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        variants: {
          create: newVariants,
        },
      },
      include: { variants: true },
    })
  } else {
    updatedItem = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { variants: true },
    })
  }

  return mapProduct(updatedItem)
}

async function deleteProduct(id) {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  })
  if (!existing) throw failure(404, 'Product not found')

  const pathsToDelete = [
    ...(existing.storagePaths || []),
    ...(existing.variants || []).map((v) => v.storagePath).filter(Boolean),
  ]

  try {
    await deleteFiles(pathsToDelete)
  } catch {
    // best effort cleanup
  }

  await prisma.product.delete({ where: { id } })
}
