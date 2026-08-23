import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Package, ChevronRight, Copy, Search, Mail } from 'lucide-react'
import { api } from '../../services/api'
import { PageMeta } from '../../hooks/usePageMeta'
import { useCurrency } from '../../context/CurrencyContext'

export const OrderConfirmationPage = () => {
  const { id } = useParams()
  const { formatPrice } = useCurrency()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get(`/orders/${id}`)
        setOrder(res.data?.data || res.data)
      } catch {
        setError('Order not found')
      } finally {
        setLoading(false)
      }
    }
    if (id) loadOrder()
  }, [id])

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] mx-auto mb-4" />
          <p className="text-[var(--primary)]/60">Loading order details...</p>
        </div>
      </main>
    )
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Package size={48} className="mx-auto text-[var(--primary)]/30 mb-4" />
          <h1 className="font-display text-3xl font-semibold text-[var(--primary)] mb-3">Order Not Found</h1>
          <p className="text-[var(--primary)]/60 mb-6">We couldn't find this order. It may have been removed or the link is invalid.</p>
          <Link to="/account/orders" className="btn-luxury-primary inline-flex items-center gap-2">
            View All Orders
            <ChevronRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
      </main>
    )
  }

  const items = Array.isArray(order.items) ? order.items : []
  const subtotal = items.reduce((sum, item) => sum + Number(item.price || item.discountPrice || 0) * (item.quantity || 1), 0)
  const shipping = 0
  const tax = subtotal * 0.16
  const total = Number(order.total || subtotal + shipping + tax)

  const handleCopyTracking = async () => {
    if (order.trackingNumber) {
      await navigator.clipboard.writeText(order.trackingNumber)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] py-12 md:py-16">
      <PageMeta
        title={`Order Confirmed ${order.trackingNumber ? `— ${order.trackingNumber}` : ''} — HOK Interior Designs`}
        description="Thank you for your order."
      />
      <div className="container-wide px-6 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-10">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[var(--success)]/10 text-[var(--success)] mb-4">
              <CheckCircle size={48} strokeWidth={1.5} />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-medium text-[var(--primary)] mb-2">Order Confirmed!</h1>
            <p className="text-[var(--primary)]/60">Thank you for your purchase. Your order has been received.</p>
            {order.trackingNumber && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[var(--border)]/40">
                <span className="text-xs font-medium text-[var(--primary)]/60">Tracking Number:</span>
                <span className="text-sm font-semibold text-[var(--primary)]">{order.trackingNumber}</span>
                <button
                  onClick={handleCopyTracking}
                  className="p-1 rounded hover:bg-[var(--secondary)]/20 transition-colors"
                  aria-label="Copy tracking number"
                >
                  <Copy size={12} strokeWidth={1.5} />
                </button>
              </div>
            )}
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-sm">
                <Mail size={14} strokeWidth={1.5} />
                <span>Please check your email for order confirmation and payment details.</span>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[var(--border)]/40">
                <Phone size={14} strokeWidth={1.5} className="text-[var(--primary)]/50" />
                <span className="text-xs font-medium text-[var(--primary)]/60">Payment Number:</span>
                <span className="text-sm font-semibold text-[var(--primary)]">0723057487</span>
                <button
                  onClick={() => navigator.clipboard.writeText('0723057487')}
                  className="p-1 rounded hover:bg-[var(--secondary)]/20 transition-colors"
                  aria-label="Copy payment number"
                >
                  <Copy size={12} strokeWidth={1.5} />
                </button>
              </div>
            <div className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[var(--border)]/40">
              <span className="text-xs font-medium text-[var(--primary)]/60">Order ID:</span>
              <span className="text-sm font-semibold text-[var(--primary)]">
                #{String(order._id || order.id || '').slice(-8).toUpperCase()}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(String(order._id || order.id || ''))}
                className="p-1 rounded hover:bg-[var(--secondary)]/20 transition-colors"
                aria-label="Copy order ID"
              >
                <Copy size={12} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[var(--border)]/40 p-6 md:p-8 shadow-[0_10px_40px_rgba(42,36,31,0.06)] mb-6">
            <h2 className="font-display text-xl font-medium text-[var(--primary)] mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--secondary)]/30">
                    {item.image && (
                      <img src={item.image} alt={item.name || 'Product'} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--primary)] truncate">{item.name || item.productName || 'Product'}</p>
                    <p className="text-2xs text-[var(--primary)]/50">Qty: {item.quantity || 1}</p>
                    {item.selectedVariant && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="h-2.5 w-2.5 rounded-full border border-[var(--primary)]/10" style={{ backgroundColor: item.selectedVariant.colorHex || '#ccc' }} />
                        <span className="text-2xs text-[var(--primary)]/60">{item.selectedVariant.color || item.selectedVariant.colorName || ''}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[var(--primary)]">{formatPrice(Number(item.price || item.discountPrice || item.total || 0) * (item.quantity || 1))}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--border)]/40 pt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--primary)]/55">Subtotal</span>
                <span className="font-medium text-[var(--primary)]">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--primary)]/55">Shipping</span>
                <span className="font-medium text-[var(--primary)] text-green-600">Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--primary)]/55">Estimated Tax (16%)</span>
                <span className="font-medium text-[var(--primary)]">{formatPrice(tax)}</span>
              </div>
              <div className="border-t border-[var(--border)]/40 pt-4">
                <div className="flex justify-between text-lg font-semibold text-[var(--primary)]">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[var(--border)]/40 p-6 md:p-8 shadow-[0_10px_40px_rgba(42,36,31,0.06)] mb-6">
            <h2 className="font-display text-xl font-medium text-[var(--primary)] mb-4">Shipping Information</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Name</p>
                <p className="text-sm text-[var(--primary)] mt-1">{order.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Email</p>
                <p className="text-sm text-[var(--primary)] mt-1">{order.email || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Phone</p>
                <p className="text-sm text-[var(--primary)] mt-1">{order.phone || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Address</p>
                <p className="text-sm text-[var(--primary)] mt-1">
                  {typeof order.shippingAddress === 'string' ? order.shippingAddress : (order.shippingAddress?.address || order.shippingAddress?.fullAddress || JSON.stringify(order.shippingAddress || {}))}
                </p>
              </div>
              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Payment</p>
                <p className="text-sm text-[var(--primary)] mt-1 capitalize">{order.paymentMethod || 'N/A'}</p>
              </div>
              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Status</p>
                <p className="text-sm text-[var(--primary)] mt-1 capitalize">{order.status || 'Pending'}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/orders"
              className="btn-luxury-primary inline-flex items-center gap-2"
            >
              <Package size={14} strokeWidth={1.5} />
              View All Orders
            </Link>
            {order.trackingNumber && (
              <Link
                to={`/track-order?tracking=${order.trackingNumber}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--border)] bg-white text-xs font-semibold uppercase tracking-widest text-[var(--primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
              >
                <Search size={14} strokeWidth={1.5} />
                Track Your Order
              </Link>
            )}
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--border)] bg-white text-xs font-semibold uppercase tracking-widest text-[var(--primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
            >
              Continue Shopping
              <ChevronRight size={14} strokeWidth={1.5} />
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
}

export default OrderConfirmationPage
