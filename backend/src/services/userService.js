import { prisma } from '../config/database.js'

export const userService = {
  getWishlist,
  toggleWishlist,
  removeFromWishlist,
  getCart,
  addToCart,
  removeFromCart,
  updateCart,
  clearCart,
}

async function getWishlist(email) {
  const items = await prisma.wishlistItem.findMany({
    where: { adminEmail: email },
    orderBy: { createdAt: 'desc' },
  })
  return items.map((item) => ({
    _id: item.productId,
    id: item.productId,
    variant: item.variant ? JSON.parse(item.variant) : null,
  }))
}

async function toggleWishlist(email, productId) {
  const existing = await prisma.wishlistItem.findFirst({
    where: { adminEmail: email, productId },
  })
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } })
    return { products: await getWishlist(email) }
  }
  await prisma.wishlistItem.create({
    data: { adminEmail: email, productId },
  })
  return { products: await getWishlist(email) }
}

async function removeFromWishlist(email, productId) {
  await prisma.wishlistItem.deleteMany({
    where: { adminEmail: email, productId },
  })
  return { products: await getWishlist(email) }
}

async function getCart(email) {
  const items = await prisma.cartItem.findMany({
    where: { adminEmail: email },
    orderBy: { createdAt: 'desc' },
  })

  const productIds = [...new Set(items.map((item) => item.productId).filter(Boolean))]
  const products = productIds.length > 0 ? await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { variants: true },
  }) : []

  const productMap = new Map(products.map((p) => [p.id, p]))

  return {
    items: items.map((item) => {
      const product = productMap.get(item.productId)
      const variant = item.variant ? JSON.parse(item.variant) : null
      return {
        _id: item.productId,
        id: item.productId,
        quantity: item.quantity,
        selectedVariant: variant,
        name: product?.name || 'Unknown Product',
        category: product?.category || '',
        image: variant?.image || product?.mainImage || product?.images?.[0] || '',
        images: product?.images || [],
        price: product?.price || 0,
        discountPrice: product?.originalPrice || null,
        stock: product?.stock || 0,
        sku: product?.sku || '',
        featured: product?.featured || false,
        inStock: product?.inStock || true,
        displayOrder: product?.displayOrder || 0,
        tags: product?.tags || [],
        vendor: product?.vendor || '',
        description: product?.description || '',
        mainImage: product?.mainImage || '',
        storagePaths: product?.storagePaths || [],
        colorVariants: product?.colorVariants || [],
        styleVariants: product?.styleVariants || [],
        createdAt: product?.createdAt || item.createdAt,
        updatedAt: product?.updatedAt || item.updatedAt,
      }
    }),
  }
}

async function addToCart(email, productId, quantity = 1, variant) {
  const variantStr = variant ? JSON.stringify(variant) : null
  const existing = await prisma.cartItem.findFirst({
    where: {
      adminEmail: email,
      productId,
      variant: variantStr,
    },
  })
  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    })
  } else {
    await prisma.cartItem.create({
      data: { adminEmail: email, productId, variant: variantStr, quantity },
    })
  }
  return getCart(email)
}

async function removeFromCart(email, productId, variant) {
  const variantStr = variant ? JSON.stringify(variant) : null
  if (variantStr) {
    await prisma.cartItem.deleteMany({
      where: { adminEmail: email, productId, variant: variantStr },
    })
  } else {
    await prisma.cartItem.deleteMany({
      where: { adminEmail: email, productId },
    })
  }
  return getCart(email)
}

async function updateCart(email, productId, quantity, variant) {
  if (quantity <= 0) {
    return removeFromCart(email, productId, variant)
  }
  const variantStr = variant ? JSON.stringify(variant) : null
  const existing = await prisma.cartItem.findFirst({
    where: {
      adminEmail: email,
      productId,
      variant: variantStr,
    },
  })
  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity },
    })
  }
  return getCart(email)
}

async function clearCart(email) {
  await prisma.cartItem.deleteMany({
    where: { adminEmail: email },
  })
  return { items: [] }
}
