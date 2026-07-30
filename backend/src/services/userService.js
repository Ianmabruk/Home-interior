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
  return {
    items: items.map((item) => ({
      _id: item.productId,
      id: item.productId,
      quantity: item.quantity,
      selectedVariant: item.variant ? JSON.parse(item.variant) : null,
    })),
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
