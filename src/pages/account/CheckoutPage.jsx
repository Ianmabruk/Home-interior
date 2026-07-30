import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle, CheckCircle, ChevronRight, MapPin, CreditCard, Truck, Shield, Mail, Lock, ShoppingBag } from 'lucide-react'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useShop } from '../../context/ShopContext'
import { useCurrency } from '../../context/CurrencyContext'
import { PageMeta } from '../../hooks/usePageMeta'

export const CheckoutPage = () => {
  const { user, isAuthenticated } = useAuth()
  const { cart, clearCart } = useShop()
  const { formatPrice } = useCurrency()
  const navigate = useNavigate()
  const [step] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.fullName?.split(' ')[0] || '',
    lastName: user?.fullName?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    county: '',
    country: 'Kenya',
    paymentMethod: 'card',
    mpesaPhone: '',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
  })

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  if (!cart?.length) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[var(--secondary)]/30 text-[var(--primary)]/30">
            <Truck size={48} strokeWidth={1} />
          </div>
          <h1 className="font-display text-3xl font-semibold text-[var(--primary)] mb-3">Cart is Empty</h1>
          <p className="text-[var(--primary)]/60 mb-6">Add items to your cart before proceeding to checkout.</p>
          <Link to="/shop" className="btn-luxury-primary inline-flex items-center gap-2">
            <ShoppingBag size={14} strokeWidth={1.5} />
            Continue Shopping
          </Link>
        </div>
      </main>
    )
  }

  const subtotal = Array.isArray(cart) ? cart.reduce((sum, item) => sum + Number(item.selectedVariant?.price || item.discountPrice || item.price || 0) * item.quantity, 0) : 0
  const shipping = 0
  const tax = subtotal * 0.16
  const total = subtotal + shipping + tax

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const paymentDetails = formData.paymentMethod === 'mpesa'
        ? { mpesaPhone: formData.mpesaPhone }
        : { cardNumber: formData.cardNumber, cardName: formData.cardName, expiry: formData.cardExpiry }

      const orderData = {
        items: cart.map(item => ({
          productId: item._id,
          variantId: item.selectedVariant?._id,
          quantity: item.quantity,
          price: item.selectedVariant?.price || item.discountPrice || item.price,
        })),
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          county: formData.county,
          country: formData.country,
        },
        paymentMethod: formData.paymentMethod,
        paymentDetails,
        total,
      }
      const res = await api.post('/orders', orderData)
      await clearCart()
      const orderId = res.data?._id || res.data?.id
      setSuccess(true)
      if (orderId) {
        setTimeout(() => navigate(`/account/orders/${orderId}`), 2500)
      } else {
        setTimeout(() => navigate('/account/orders'), 2500)
      }
    } catch (err) {
      setError(err?.message || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const steps = [
    { number: 1, title: 'Shipping', desc: 'Delivery & payment' },
    { number: 2, title: 'Review', desc: 'Confirm order' },
  ]

  return (
    <main className="min-h-screen bg-[var(--bg)] py-12 md:py-16">
      <PageMeta
        title="Checkout — HOK Interior Designs"
        description="Complete your purchase securely."
      />
      <div className="container-wide px-6 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s.number} className="flex flex-col items-center relative">
                <div className={`relative flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${step >= s.number ? 'bg-[var(--accent)] text-white' : 'bg-[var(--secondary)]/30 text-[var(--primary)]/40'}`}>
                  {step > s.number ? <CheckCircle size={20} strokeWidth={2} /> : s.number}
                </div>
                {i < steps.length - 1 && (
                  <div className={`absolute top-6 left-[calc(50%+6px)] right-[calc(50%+6px)] h-1 transition-colors duration-300 ${step > s.number ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
                )}
                <p className="mt-2 text-center text-xs font-medium text-[var(--primary)]/60">{s.title}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center gap-3 p-4 rounded-xl bg-[var(--error)]/10 text-[var(--error)]"
          >
            <AlertCircle size={20} strokeWidth={2} />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-[var(--success)]/20 p-12 md:p-16 shadow-[0_10px_40px_rgba(42,36,31,0.06)] text-center"
          >
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[var(--success)]/10 text-[var(--success)]">
              <CheckCircle size={48} strokeWidth={1.5} />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-medium text-[var(--primary)] mb-4">Order Confirmed!</h1>
            <p className="text-[var(--primary)]/60 mb-8 max-w-md mx-auto">Thank you for your order. You&apos;ll receive a confirmation email shortly.</p>
             <Link to="/orders" className="btn-luxury-primary inline-flex items-center gap-2">
               View Orders
               <ChevronRight size={14} strokeWidth={1.5} />
             </Link>
          </motion.div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="space-y-8"
              >
                <section>
                  <h2 className="font-display text-xl font-medium text-[var(--primary)] mb-6 flex items-center gap-3">
                    <MapPin className="h-6 w-6 text-[var(--accent)]" />
                    Shipping Information
                  </h2>
                   <div className="grid gap-6 md:grid-cols-2">
                     <div>
                       <label htmlFor="firstName" className="block text-sm font-medium text-[var(--primary)] mb-1">First Name</label>
                       <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required className="input-luxury" />
                     </div>
                     <div>
                       <label htmlFor="lastName" className="block text-sm font-medium text-[var(--primary)] mb-1">Last Name</label>
                       <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required className="input-luxury" />
                     </div>
                     <div>
                       <label htmlFor="email" className="block text-sm font-medium text-[var(--primary)] mb-1">Email</label>
                       <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="input-luxury" />
                     </div>
                     <div>
                       <label htmlFor="phone" className="block text-sm font-medium text-[var(--primary)] mb-1">Phone</label>
                       <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required className="input-luxury" />
                     </div>
                     <div className="md:col-span-2">
                       <label htmlFor="address" className="block text-sm font-medium text-[var(--primary)] mb-1">Delivery Address</label>
                       <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} required className="input-luxury" placeholder="Street address, apartment, suite, etc." />
                     </div>
                     <div>
                       <label htmlFor="city" className="block text-sm font-medium text-[var(--primary)] mb-1">City</label>
                       <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} required className="input-luxury" />
                     </div>
                     <div>
                       <label htmlFor="county" className="block text-sm font-medium text-[var(--primary)] mb-1">County</label>
                       <input type="text" id="county" name="county" value={formData.county} onChange={handleChange} required className="input-luxury" />
                     </div>
                     <div>
                       <label htmlFor="country" className="block text-sm font-medium text-[var(--primary)] mb-1">Country</label>
                       <select id="country" name="country" value={formData.country} onChange={handleChange} required className="input-luxury">
                         <option value="Kenya">Kenya</option>
                         <option value="Uganda">Uganda</option>
                         <option value="Tanzania">Tanzania</option>
                         <option value="Rwanda">Rwanda</option>
                       </select>
                     </div>
                   </div>
                 </section>

                 <section>
                   <h2 className="font-display text-xl font-medium text-[var(--primary)] mb-6 flex items-center gap-3">
                     <CreditCard className="h-6 w-6 text-[var(--accent)]" />
                     Payment Method
                   </h2>
                   <div className="space-y-4">
                     <label className="flex items-center gap-4 p-4 rounded-2xl border border-[var(--border)]/40 hover:border-[var(--accent)]/40 cursor-pointer transition-colors">
                       <input type="radio" name="paymentMethod" value="card" checked={formData.paymentMethod === 'card'} onChange={handleChange} className="sr-only" />
                       <div className={`h-5 w-5 rounded border-2 flex items-center justify-center text-[var(--accent)] transition-colors ${formData.paymentMethod === 'card' ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border)]'}`}>
                         {formData.paymentMethod === 'card' && <CheckCircle size={12} strokeWidth={2} />}
                       </div>
                       <div className="flex-1">
                         <p className="font-medium text-[var(--primary)]">Credit / Debit Card</p>
                         <p className="text-sm text-[var(--primary)]/50">Pay securely with Visa, Mastercard, or Amex</p>
                       </div>
                     </label>
                     <label className="flex items-center gap-4 p-4 rounded-2xl border border-[var(--border)]/40 hover:border-[var(--accent)]/40 cursor-pointer transition-colors">
                       <input type="radio" name="paymentMethod" value="mpesa" checked={formData.paymentMethod === 'mpesa'} onChange={handleChange} className="sr-only" />
                       <div className={`h-5 w-5 rounded border-2 flex items-center justify-center text-[var(--accent)] transition-colors ${formData.paymentMethod === 'mpesa' ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border)]'}`}>
                         {formData.paymentMethod === 'mpesa' && <CheckCircle size={12} strokeWidth={2} />}
                       </div>
                       <div className="flex-1">
                         <p className="font-medium text-[var(--primary)]">M-Pesa</p>
                         <p className="text-sm text-[var(--primary)]/50">Pay via M-Pesa mobile money</p>
                       </div>
                     </label>
                   </div>

                   {formData.paymentMethod === 'mpesa' && (
                     <div className="mt-6">
                       <label htmlFor="mpesaPhone" className="block text-sm font-medium text-[var(--primary)] mb-1">M-Pesa Phone Number</label>
                       <input type="tel" id="mpesaPhone" name="mpesaPhone" value={formData.mpesaPhone} onChange={handleChange} placeholder="e.g. 254712345678" className="input-luxury" />
                     </div>
                   )}

                   {formData.paymentMethod === 'card' && (
                     <div className="mt-6 space-y-4">
                       <div>
                         <label htmlFor="cardNumber" className="block text-sm font-medium text-[var(--primary)] mb-1">Card Number</label>
                         <input type="text" id="cardNumber" name="cardNumber" value={formData.cardNumber} onChange={handleChange} placeholder="1234 5678 9012 3456" className="input-luxury" />
                       </div>
                       <div>
                         <label htmlFor="cardName" className="block text-sm font-medium text-[var(--primary)] mb-1">Cardholder Name</label>
                         <input type="text" id="cardName" name="cardName" value={formData.cardName} onChange={handleChange} className="input-luxury" />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <label htmlFor="cardExpiry" className="block text-sm font-medium text-[var(--primary)] mb-1">Expiry Date</label>
                           <input type="text" id="cardExpiry" name="cardExpiry" value={formData.cardExpiry} onChange={handleChange} placeholder="MM/YY" className="input-luxury" />
                         </div>
                         <div>
                           <label htmlFor="cardCvv" className="block text-sm font-medium text-[var(--primary)] mb-1">CVV</label>
                           <input type="text" id="cardCvv" name="cardCvv" value={formData.cardCvv} onChange={handleChange} className="input-luxury" />
                         </div>
                       </div>
                     </div>
                   )}
                 </section>

                <section>
                  <h2 className="font-display text-xl font-medium text-[var(--primary)] mb-6 flex items-center gap-3">
                    <Shield className="h-6 w-6 text-[var(--accent)]" />
                    Secure Checkout
                  </h2>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-sm text-[var(--primary)]/60"><Lock size={16} strokeWidth={1.5} /> SSL Encrypted</div>
                    <div className="flex items-center gap-2 text-sm text-[var(--primary)]/60"><Shield size={16} strokeWidth={1.5} /> Secure Payment</div>
                    <div className="flex items-center gap-2 text-sm text-[var(--primary)]/60"><Truck size={16} strokeWidth={1.5} /> Free Shipping</div>
                    <div className="flex items-center gap-2 text-sm text-[var(--primary)]/60"><Mail size={16} strokeWidth={1.5} /> Email Confirmation</div>
                  </div>
                </section>
              </motion.form>
            </div>

            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-24"
              >
                <div className="bg-white rounded-3xl border border-[var(--border)]/40 p-6 md:p-8 shadow-[0_10px_40px_rgba(42,36,31,0.06)]">
                  <h3 className="font-display text-xl font-medium text-[var(--primary)] mb-6">Order Summary</h3>
                  <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                    {cart.map((item) => (
                      <div key={`${item._id}-${item.selectedVariant?.color || 'default'}`} className="flex gap-3">
                        <div className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--secondary)]/30">
                          <img
                            src={item.selectedVariant?.image || item.image || item.images?.[0]?.url}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-2xs font-medium uppercase tracking-widest text-[var(--accent)]">{item.category}</p>
                          <h4 className="font-display text-sm font-medium text-[var(--primary)] truncate">{item.name}</h4>
                          {item.selectedVariant && (
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <span className="h-2.5 w-2.5 rounded-full border border-[var(--primary)]/10" style={{ backgroundColor: item.selectedVariant.colorHex || '#ccc' }} />
                              <span className="text-xs text-[var(--primary)]/60">{item.selectedVariant.color}</span>
                            </div>
                          )}
                          <p className="mt-1 text-sm font-medium text-[var(--primary)]">{formatPrice(Number(item.selectedVariant?.price || item.discountPrice || item.price || 0))} × {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[var(--border)]/40 pt-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--primary)]/55">Subtotal ({cart?.length || 0} items)</span>
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
                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={loading}
                    className="w-full btn-luxury-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Place Order
                        <ChevronRight size={14} strokeWidth={1.5} />
                      </>
                    )}
                  </button>
                  <p className="mt-4 text-center text-xs text-[var(--primary)]/50">By placing your order, you agree to our Terms of Service and Privacy Policy.</p>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default CheckoutPage