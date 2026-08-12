import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Plus, Minus, ArrowLeft, ChevronRight, CheckCircle } from 'lucide-react'
import { useShop } from '@context/ShopContext'
import { useCurrency } from '@context/CurrencyContext'
import { useAdminDataChangedListener, ADMIN_EVENT_TYPES } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'

export const CartPage = () => {
  const { cart, removeFromCart, setCartQuantity, fetchCart } = useShop()
  const { formatPrice } = useCurrency()
  const [updating, setUpdating] = useState(null)
  const [orderPlaced, setOrderPlaced] = useState(false)

  useEffect(() => {
    try {
      const flag = localStorage.getItem('hok_order_placed')
      if (flag === '1') {
        setOrderPlaced(true)
        localStorage.removeItem('hok_order_placed')
        setTimeout(() => setOrderPlaced(false), 6000)
      }
    } catch {}

    return () => {
      try { localStorage.removeItem('hok_order_placed') } catch {}
    }
  }, [])

  useAdminDataChangedListener([ADMIN_EVENT_TYPES.ORDERS_CHANGED], () => {
    setOrderPlaced(true)
    setTimeout(() => setOrderPlaced(false), 6000)
  })

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const handleUpdateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) {
      await handleRemove(item)
      return
    }
    setUpdating(item._id)
    try {
      await setCartQuantity(item._id, newQuantity, item.selectedVariant)
    } finally {
      setUpdating(null)
    }
  }

  const handleRemove = async (item) => {
    setUpdating(item._id)
    try {
      await removeFromCart(item._id, item.selectedVariant)
    } finally {
      setUpdating(null)
    }
  }

  const subtotal = Array.isArray(cart) ? cart.reduce((sum, item) => sum + Number(item.selectedVariant?.price || item.discountPrice || item.price || 0) * item.quantity, 0) : 0

  return (
    <main className="min-h-screen bg-[var(--bg)] py-12 md:py-20">
      <PageMeta
        title="Shopping Cart — HOK Interior Designs"
        description="Review and manage your shopping cart."
      />
      <div className="container-wide px-6 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 md:mb-16"
        >
          <div className="flex items-center gap-4 mb-4">
            <Link to="/shop" className="p-2 rounded-full text-[var(--primary)]/50 hover:text-[var(--primary)] hover:bg-[var(--secondary)]/30 transition-colors">
              <ArrowLeft size={20} strokeWidth={1.5} />
            </Link>
            <h1 className="font-display text-4xl md:text-5xl font-semibold text-[var(--primary)]">Shopping Cart</h1>
          </div>
          <p className="text-[var(--primary)]/60">{cart?.length || 0} item{cart?.length !== 1 ? 's' : ''} in your cart</p>
        </motion.div>

        <AnimatePresence>
          {orderPlaced && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mb-8 flex items-center gap-3 p-4 rounded-2xl bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20"
            >
              <CheckCircle size={20} strokeWidth={2} />
              <span className="text-sm font-medium">Order received! Our team will review it and get back to you shortly.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {cart?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-[var(--secondary)]/30 text-[var(--primary)]/30">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <h2 className="font-display text-3xl font-medium text-[var(--primary)] mb-3">Your cart is empty</h2>
            <p className="text-[var(--primary)]/60 mb-8 max-w-md mx-auto">Looks like you haven&apos;t added anything to your cart yet.</p>
            <Link to="/shop" className="btn-luxury-primary inline-flex items-center gap-2">
              Continue Shopping
              <ChevronRight size={14} strokeWidth={1.5} />
            </Link>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-x-auto"
            >
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]/40">
                    <th className="text-left py-4 px-2 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Product</th>
                    <th className="text-center py-4 px-2 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Price</th>
                    <th className="text-center py-4 px-2 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Quantity</th>
                    <th className="text-right py-4 px-2 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Total</th>
                    <th className="text-right py-4 px-2 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, index) => (
                    <motion.tr
                      key={`${item._id}-${item.selectedVariant?.color || 'default'}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className="border-b border-[var(--border)]/40"
                    >
                      <td className="py-6 px-2">
                        <Link to={`/shop/${item._id}`} className="flex items-center gap-4">
                          <div className="h-20 w-20 rounded-xl overflow-hidden bg-[var(--secondary)]/30 flex-shrink-0">
                            {item.selectedVariant?.image || item.image || item.images?.[0]?.url ? (
                              <img src={item.selectedVariant?.image || item.image || item.images?.[0]?.url} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[var(--primary)]/30">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                  <circle cx="9" cy="9" r="2" />
                                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-display text-base font-medium text-[var(--primary)] hover:text-[var(--accent)] transition-colors">{item.name}</p>
                            {item.selectedVariant && (
                              <p className="text-sm text-[var(--primary)]/50">{item.selectedVariant.color}{item.selectedVariant.size && ` / ${item.selectedVariant.size}`}</p>
                            )}
                            <p className="text-sm text-[var(--primary)]/50">{item.category}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="py-6 px-2 text-center text-[var(--primary)]">{formatPrice(item.selectedVariant?.price || item.discountPrice || item.price || 0)}</td>
                      <td className="py-6 px-2 text-center">
                        <div className="inline-flex items-center rounded-full border border-[var(--border)]/40 bg-white">
                          <button
                            onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                            disabled={updating === item._id || item.quantity <= 1}
                            className="p-2 text-[var(--primary)]/50 hover:text-[var(--primary)] disabled:opacity-30"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={16} strokeWidth={1.5} />
                          </button>
                          <span className="min-w-10 text-center font-medium text-[var(--primary)]">{item.quantity}</span>
                           <button
                             onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                             disabled={updating === item._id || item.quantity >= (item.selectedVariant?.stock ?? item.stock ?? 99)}
                             className="p-2 text-[var(--primary)]/50 hover:text-[var(--primary)] disabled:opacity-30"
                             aria-label="Increase quantity"
                           >
                            <Plus size={16} strokeWidth={1.5} />
                          </button>
                        </div>
                      </td>
                      <td className="py-6 px-2 text-right font-semibold text-[var(--primary)]">{formatPrice(Number(item.selectedVariant?.price || item.discountPrice || item.price || 0) * item.quantity)}</td>
                      <td className="py-6 px-2 text-right">
                        <button
                          onClick={() => handleRemove(item)}
                          disabled={updating === item._id}
                          className="p-2 rounded-lg text-[var(--primary)]/40 hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors disabled:opacity-30"
                          aria-label="Remove from cart"
                        >
                          <Trash2 size={18} strokeWidth={1.5} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
            >
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--border)] bg-[var(--bg)] text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
              >
                <ArrowLeft size={14} strokeWidth={1.5} />
                Continue Shopping
              </Link>

              <div className="md:w-80 lg:w-96 mx-auto md:mx-0">
                <div className="bg-white rounded-3xl border border-[var(--border)]/40 p-6 md:p-8 shadow-[0_10px_40px_rgba(42,36,31,0.06)]">
                  <h3 className="font-display text-xl font-medium text-[var(--primary)] mb-6">Order Summary</h3>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--primary)]/55">Subtotal ({cart?.length || 0} items)</span>
                      <span className="font-medium text-[var(--primary)]">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--primary)]/55">Shipping</span>
                      <span className="font-medium text-[var(--primary)] text-green-600">Free</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--primary)]/55">Tax</span>
                      <span className="font-medium text-[var(--primary)]">Calculated at checkout</span>
                    </div>
                    <div className="border-t border-[var(--border)]/40 pt-4">
                      <div className="flex justify-between text-lg font-semibold text-[var(--primary)]">
                        <span>Total</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/checkout"
                    className="w-full btn-luxury-primary inline-flex items-center justify-center gap-2"
                  >
                    Proceed to Checkout
                    <ChevronRight size={14} strokeWidth={1.5} />
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </main>
  )
}

export default CartPage