import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Package, Eye, X, Search, ChevronDown } from 'lucide-react'
import { api } from '../../services/api'

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped: 'bg-purple-100 text-purple-700 border-purple-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

export const OrderDashboard = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewOrder, setViewOrder] = useState(null)

  const loadOrders = async () => {
    setLoading(true)
    try {
      const res = await api.get('/orders', { params: { sort: '-createdAt', limit: 100 } })
      setOrders(res.data || [])
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial data load is a standard pattern
    loadOrders()
  }, [])

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus })
      setOrders((prev) => prev.map((o) => (o._id === orderId || o.id === orderId ? { ...o, status: newStatus } : o)))
      if (viewOrder && (viewOrder._id === orderId || viewOrder.id === orderId)) {
        setViewOrder((prev) => ({ ...prev, status: newStatus }))
      }
    } catch (err) {
      window.alert(err?.message || 'Failed to update status')
    }
  }

  const filtered = orders.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        o.name?.toLowerCase().includes(q) ||
        o.email?.toLowerCase().includes(q) ||
        o._id?.toLowerCase().includes(q) ||
        o.id?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const parseItems = (items) => {
    if (!items) return []
    if (Array.isArray(items)) return items
    try {
      return JSON.parse(items)
    } catch {
      return []
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-3xl text-[var(--primary)]">Orders</h2>
          <p className="text-sm text-[var(--primary)]/50 mt-1">{filtered.length} orders</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary)]/50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition pl-9"
              placeholder="Search orders..."
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition cursor-pointer appearance-none pr-8"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--primary)]/40 pointer-events-none" />
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/60 border border-[var(--border)]/60 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 text-[var(--primary)]/40">
          <Package size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">No orders found</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order, i) => (
            <motion.div
              key={order._id || order.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)]"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-display text-lg font-medium text-[var(--primary)] truncate">
                      {order.name || 'Guest'}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-medium border ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      {order.status || 'pending'}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--primary)]/60">{order.email}</p>
                  {order.phone && <p className="text-sm text-[var(--primary)]/60">{order.phone}</p>}
                  <p className="text-2xs text-[var(--primary)]/40 mt-1">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-xl font-medium text-[var(--primary)]">
                    ${Number(order.total || 0).toFixed(2)}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewOrder(order)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    <Eye size={12} />
                    View
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {viewOrder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setViewOrder(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-white/90 backdrop-blur-xl px-6 py-4">
              <h3 className="font-display text-xl font-medium text-[var(--primary)]">Order Details</h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setViewOrder(null)}
                className="p-1.5 rounded-lg text-[var(--primary)]/40 hover:text-[var(--accent)] transition"
              >
                <X size={18} strokeWidth={1.5} />
              </motion.button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Customer</p>
                  <p className="mt-1 text-sm font-medium text-[var(--primary)]">{viewOrder.name || 'Guest'}</p>
                  <p className="text-sm text-[var(--primary)]/60">{viewOrder.email}</p>
                  {viewOrder.phone && <p className="text-sm text-[var(--primary)]/60">{viewOrder.phone}</p>}
                </div>
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Order ID</p>
                  <p className="mt-1 text-sm font-mono text-[var(--primary)]">{viewOrder._id || viewOrder.id}</p>
                  <p className="text-sm text-[var(--primary)]/60">{formatDate(viewOrder.createdAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-3">Items</p>
                <div className="space-y-2">
                  {parseItems(viewOrder.items).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--primary)] truncate">{item.name || item.productName || 'Product'}</p>
                        <p className="text-2xs text-[var(--primary)]/50">Qty: {item.quantity || 1}</p>
                        {item.selectedVariant && (
                          <p className="text-2xs text-[var(--primary)]/50">
                            {item.selectedVariant.color || item.selectedVariant.colorName || ''}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-medium text-[var(--primary)]">
                        ${Number(item.price || item.discountPrice || item.total || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-3">Shipping Address</p>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4">
                  {(() => {
                    let address = {}
                    try { address = typeof viewOrder.shippingAddress === 'string' ? JSON.parse(viewOrder.shippingAddress) : viewOrder.shippingAddress } catch { /* ignore */ }
                    return (
                      <div className="text-sm text-[var(--primary)]/70 space-y-1">
                        {address.fullName && <p>{address.fullName}</p>}
                        {address.address && <p>{address.address}</p>}
                        {address.city && <p>{address.city}, {address.state} {address.zipCode}</p>}
                        {address.country && <p>{address.country}</p>}
                        {!address.fullName && viewOrder.shippingAddress && <p>{viewOrder.shippingAddress}</p>}
                      </div>
                    )
                  })()}
                </div>
              </div>

              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-3">Payment</p>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4">
                  <p className="text-sm font-medium text-[var(--primary)] capitalize">{viewOrder.paymentMethod}</p>
                  {viewOrder.shippingMethod && (
                    <p className="text-2xs text-[var(--primary)]/50 mt-1 capitalize">Shipping: {viewOrder.shippingMethod}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
                <span className="text-sm font-medium text-[var(--primary)]">Total</span>
                <span className="font-display text-2xl font-medium text-[var(--primary)]">${Number(viewOrder.total || 0).toFixed(2)}</span>
              </div>

              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50 mb-3">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <motion.button
                      key={s}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => updateStatus(viewOrder._id || viewOrder.id, s)}
                      className={`rounded-full border px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider transition ${
                        viewOrder.status === s
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                          : 'bg-white text-[var(--primary)]/70 border-[var(--border)] hover:border-[var(--accent)]'
                      }`}
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
