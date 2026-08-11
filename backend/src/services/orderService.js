import { prisma } from '../config/database.js'
import { failure } from '../utils/response.js'

export const orderService = {
  createOrder,
  getOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
}

function parseOrder(order) {
  return {
    _id: order.id,
    id: order.id,
    email: order.email,
    name: order.name,
    phone: order.phone,
    items: typeof order.items === 'string' ? (() => { try { return JSON.parse(order.items) } catch { return [] } })() : (order.items || []),
    shippingAddress: typeof order.shippingAddress === 'string' ? (() => { try { return JSON.parse(order.shippingAddress) } catch { return {} } })() : (order.shippingAddress || {}),
    shippingMethod: order.shippingMethod,
    paymentMethod: order.paymentMethod,
    paymentDetails: typeof order.paymentDetails === 'string' ? (() => { try { return JSON.parse(order.paymentDetails) } catch { return {} } })() : (order.paymentDetails || {}),
    total: order.total,
    status: order.status,
    createdAt: order.createdAt,
  }
}

async function createOrder(data) {
  try {
    const enrichedItems = Array.isArray(data.items) ? data.items : (() => { try { return JSON.parse(data.items || '[]') } catch { return [] } })()
    if (!enrichedItems.length) {
      throw failure(400, 'Order must contain at least one item')
    }

    const productIds = enrichedItems.map((i) => i.productId).filter(Boolean)
    const products = productIds.length > 0 ? await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: true },
    }) : []
    const productMap = new Map(products.map((p) => [p.id, p]))

    const finalItems = enrichedItems.map((item) => {
      const product = productMap.get(item.productId)
      const variant = product?.variants?.find((v) => v.id === item.variantId)
      return {
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
        name: product?.name || 'Unknown Product',
        image: variant?.image || product?.mainImage || (Array.isArray(product?.images) ? product.images[0] : '') || '',
        selectedVariant: variant ? {
          id: variant.id,
          color: variant.color,
          colorHex: variant.colorHex,
          image: variant.image,
          price: variant.price,
          stock: variant.stock,
        } : null,
      }
    })

    const missingProducts = enrichedItems.filter((i) => i.productId && !productMap.has(i.productId))
    if (missingProducts.length > 0) {
      console.warn(`[orders] Missing products for IDs: ${missingProducts.map((i) => i.productId).join(', ')}`)
    }

    const stockOperations = []
    for (const item of finalItems) {
      if (!item.productId) continue
      const product = productMap.get(item.productId)
      if (!product) continue

      const qty = Number(item.quantity) || 1
      if (product.variants && item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId)
        if (variant && variant.stock >= qty) {
          stockOperations.push(
            prisma.productVariant.update({
              where: { id: variant.id },
              data: { stock: { decrement: qty } },
            })
          )
        }
      } else if (product.stock >= qty) {
        stockOperations.push(
          prisma.product.update({
            where: { id: product.id },
            data: { stock: { decrement: qty } },
          })
        )
      }
    }

    let created
    const order = await prisma.$transaction(async (tx) => {
      created = await tx.order.create({
        data: {
          ...data,
          items: JSON.stringify(finalItems),
        },
      })
      if (stockOperations.length) await tx.$transaction(stockOperations)
      return created
    })

    return parseOrder(created)
  } catch (err) {
    console.error('[orders] createOrder failed:', err)
    throw failure(500, err?.message || 'Failed to create order')
  }
}

async function getOrder(id) {
  const order = await prisma.order.findUnique({
    where: { id },
  })
  if (!order) throw failure(404, 'Order not found')
  return parseOrder(order)
}

async function getUserOrders(email) {
  const orders = await prisma.order.findMany({
    where: { email },
    orderBy: { createdAt: 'desc' },
  })
  return orders.map(parseOrder)
}

async function getAllOrders({ sort = '-createdAt', limit = 100 } = {}) {
  const orderBy = sort?.startsWith('-') ? { [sort.slice(1)]: 'desc' } : { createdAt: 'asc' }
  const orders = await prisma.order.findMany({
    orderBy,
    take: Number(limit) || 100,
  })
  return orders.map(parseOrder)
}

async function updateOrderStatus(id, status) {
  const order = await prisma.order.update({
    where: { id },
    data: { status },
  })
  return parseOrder(order)
}
