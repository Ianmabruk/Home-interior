import { prisma } from '../config/database.js'
import { failure } from '../utils/response.js'

export const orderService = {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
}

async function createOrder(data) {
  const order = await prisma.order.create({ data })
  return {
    _id: order.id,
    id: order.id,
    email: order.email,
    name: order.name,
    phone: order.phone,
    items: order.items,
    shippingAddress: order.shippingAddress,
    shippingMethod: order.shippingMethod,
    paymentMethod: order.paymentMethod,
    paymentDetails: order.paymentDetails,
    total: order.total,
    status: order.status,
    createdAt: order.createdAt,
  }
}

async function getOrder(id) {
  const order = await prisma.order.findUnique({
    where: { id },
  })
  if (!order) throw failure(404, 'Order not found')
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

async function getUserOrders(email) {
  const orders = await prisma.order.findMany({
    where: { email },
    orderBy: { createdAt: 'desc' },
  })
  return orders.map((o) => ({
    _id: o.id,
    id: o.id,
    email: o.email,
    name: o.name,
    phone: o.phone,
    items: typeof o.items === 'string' ? (() => { try { return JSON.parse(o.items) } catch { return [] } })() : (o.items || []),
    shippingAddress: typeof o.shippingAddress === 'string' ? (() => { try { return JSON.parse(o.shippingAddress) } catch { return {} } })() : (o.shippingAddress || {}),
    shippingMethod: o.shippingMethod,
    paymentMethod: o.paymentMethod,
    paymentDetails: typeof o.paymentDetails === 'string' ? (() => { try { return JSON.parse(o.paymentDetails) } catch { return {} } })() : (o.paymentDetails || {}),
    total: o.total,
    status: o.status,
    createdAt: o.createdAt,
  }))
}

async function getAllOrders({ sort = '-createdAt', limit = 100 } = {}) {
  const orderBy = sort?.startsWith('-') ? { [sort.slice(1)]: 'desc' } : { createdAt: 'asc' }
  const orders = await prisma.order.findMany({
    orderBy,
    take: Number(limit) || 100,
  })
  return orders.map((o) => ({
    _id: o.id,
    id: o.id,
    email: o.email,
    name: o.name,
    phone: o.phone,
    items: o.items,
    total: o.total,
    status: o.status,
    createdAt: o.createdAt,
  }))
}

async function updateOrderStatus(id, status) {
  const order = await prisma.order.update({
    where: { id },
    data: { status },
  })
  return {
    _id: order.id,
    id: order.id,
    email: order.email,
    name: order.name,
    phone: order.phone,
    items: order.items,
    total: order.total,
    status: order.status,
    createdAt: order.createdAt,
  }
}
