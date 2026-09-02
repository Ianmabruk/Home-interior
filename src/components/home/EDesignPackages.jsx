import { useState, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Loader2,
  Send,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Shield,
  Wifi,
} from 'lucide-react'
import { api } from '@services/api'
import { toast } from 'react-hot-toast'
import { dispatchAdminDataChanged } from '@utils/adminEvents'

const addOns = [
  { name: 'Virtual Styling Call (30 min)', price: '3,500' },
  { name: 'Thrift & Local Sourcing Guide', price: '2,500' },
  { name: 'Rush 5-Day Delivery', price: '5,000' },
]

const faqs = [
  {
    q: 'How does online interior design work?',
    a: 'We work entirely online. After booking, you share photos and measurements of your space. Our designers create a custom plan with moodboards, layouts, and a shoppable product list. You get everything digitally, and we support you through purchasing and styling.',
  },
  {
    q: 'Can I use my existing furniture?',
    a: 'Absolutely. Our designs incorporate your existing pieces whenever possible. We build around what you already own and only recommend new items that truly enhance your space.',
  },
  {
    q: 'Are the recommendations renter-safe?',
    a: 'Yes. We specialize in renter-friendly solutions: peel-and-stick wallpaper, command hooks, modular furniture, and no-drill installations. Nothing damages walls or floors, and you can take it all with you.',
  },
  {
    q: 'How long does each package take?',
    a: 'Mini Refresh is delivered in 7 days, Signature in 14 days, and Whole Home in 21 days. Rush delivery is available as an add-on for 5-day turnaround.',
  },
  {
    q: 'What if I need changes?',
    a: 'Each package includes revisions (1, 2, or 3 depending on the tier). We refine the design until you love it. Additional revisions can be purchased if needed.',
  },
  {
    q: 'Do I have to buy from your recommended stores?',
    a: 'No. Our shopping lists include links to various retailers, but you are free to purchase from anywhere. We provide options across budgets so you can shop your way.',
  },
]

const trustIndicators = [
  { icon: Wifi, label: '100% Online' },
  { icon: Sparkles, label: 'Personalized Design' },
  { icon: Shield, label: 'Renter-Friendly Solutions' },
  { icon: Check, label: 'Secure Booking' },
]

function mapPackage(item) {
  const price = item.price || 0
  const priceMax = item.priceMax || price
  const currency = item.currency || 'KES'
  const features = Array.isArray(item.features) ? item.features : []
  return {
    id: item.id,
    name: item.title || 'Untitled Package',
    tagline: item.tagline || '',
    price: String(Number(price).toLocaleString()),
    priceMax: String(Number(priceMax).toLocaleString()),
    currency,
    features,
    buttonText: item.ctaText || 'Book',
    popular: Boolean(item.featured),
    rawPrice: price,
    rawPriceMax: priceMax,
    rawName: item.title,
  }
}

export const EDesignPackages = memo(({ packages: propPackages }) => {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState('')
  const [selectedPackagePrice, setSelectedPackagePrice] = useState('')
  const [showComparison, setShowComparison] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: '',
    preferredDate: '',
    preferredTime: '',
  })

  useEffect(() => {
    if (propPackages && propPackages.length > 0) {
      const mapped = propPackages.map(mapPackage)
      setPackages(mapped)
      return
    }
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.get('/virtual-design')
        const items = Array.isArray(res.data) ? res.data : []
        const mapped = items.map(mapPackage)
        if (!cancelled) setPackages(mapped)
      } catch {
        if (!cancelled) setPackages([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [propPackages])

  const openBooking = (pkg) => {
    setSelectedPackage(pkg.rawName || pkg.name)
    setSelectedPackagePrice(`${pkg.currency} ${pkg.price}${pkg.priceMax !== pkg.price ? ' - ' + pkg.priceMax : ''}`)
    setFormData((prev) => ({ ...prev, service: pkg.rawName || pkg.name }))
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = new FormData()
      payload.append('name', formData.name)
      payload.append('email', formData.email)
      payload.append('phone', formData.phone)
      payload.append('message', formData.message)
      payload.append('projectType', formData.service || 'e-design')
      payload.append('type', 'e-design')
      payload.append('packageName', selectedPackage)
      payload.append('packagePrice', selectedPackagePrice || '0')
      payload.append('paymentStatus', 'pending')
      payload.append('preferredDate', formData.preferredDate || '')
      payload.append('preferredTime', formData.preferredTime || '')

      await api.post('/consultations', payload)
      toast.success('E-design package request submitted successfully!')
      setModalOpen(false)
      setFormData({ name: '', email: '', phone: '', service: '', message: '', preferredDate: '', preferredTime: '' })
      dispatchAdminDataChanged('consultations-changed')
    } catch (err) {
      toast.error(err?.message || 'Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  if (loading) {
    return (
      <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-20 md:py-32" id="e-design">
        <div className="container-wide">
          <div className="mb-16 md:mb-24 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">
              E-Design Packages
            </p>
            <h2 className="font-display text-4xl font-medium leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
              Design Without Drilling
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl border border-[var(--border)] bg-white p-6 md:p-8">
                <div className="skeleton h-6 w-32 mx-auto mb-4" />
                <div className="skeleton h-4 w-48 mx-auto mb-6" />
                <div className="skeleton h-10 w-24 mx-auto mb-8" />
                <div className="skeleton h-3 w-full mb-2" />
                <div className="skeleton h-3 w-full mb-2" />
                <div className="skeleton h-3 w-3/4 mb-8" />
                <div className="skeleton h-12 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (packages.length === 0) {
    return null
  }

  return (
    <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-20 md:py-32" id="e-design">
      <div className="container-wide">
        {/* Header */}
        <div className="mb-16 md:mb-24 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">
            E-Design Packages
          </p>
          <h2 className="font-display text-4xl font-medium leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
            Design Without Drilling
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
            Find the perfect design package for your rental or home. Every package is delivered online with a personalized shopping plan and expert guidance.
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mb-16">
          {trustIndicators.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm text-[var(--primary)]/70">
              <item.icon size={18} strokeWidth={1.5} className="text-[var(--accent)]" />
              <span className="font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={`relative flex flex-col rounded-3xl border transition-all duration-500 hover:-translate-y-2 hover:shadow-lift ${
                pkg.popular
                  ? 'bg-white border-[var(--accent)]/30 shadow-[0_20px_60px_rgba(232,154,67,0.12)]'
                  : 'bg-white border-[var(--border)] shadow-card hover:border-[var(--accent)]/20'
              }`}
            >
              {/* Popular Badge */}
              {pkg.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-lg">
                    <Sparkles size={12} strokeWidth={2} />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-6 md:p-8 flex-1 flex flex-col">
                {/* Package Header */}
                <div className="text-center mb-6 pt-2">
                  <h3 className="font-display text-2xl font-medium text-[var(--primary)] mb-2">
                    {pkg.name}
                  </h3>
                  {pkg.tagline && (
                    <p className="text-sm text-[var(--primary)]/60 leading-relaxed">
                      {pkg.tagline}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-sm font-medium text-[var(--primary)]/50">{pkg.currency}</span>
                    <span className="font-display text-4xl font-medium text-[var(--primary)]">
                      {pkg.price}
                    </span>
                    {pkg.priceMax !== pkg.price && (
                      <>
                        <span className="text-sm text-[var(--primary)]/40">-</span>
                        <span className="font-display text-2xl text-[var(--primary)]/60">
                          {pkg.priceMax}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="luxury-divider mb-6" />

                {/* Features */}
                <ul className="space-y-3.5 mb-8 flex-1">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[var(--primary)]/75">
                      <Check size={16} strokeWidth={2} className="mt-0.5 flex-shrink-0 text-[var(--accent)]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => openBooking(pkg)}
                  className={`w-full btn-luxury-primary ${
                    pkg.popular ? '' : 'bg-[var(--primary)] hover:bg-[var(--primary)]/90'
                  }`}
                >
                  {pkg.buttonText}
                  <Send size={14} strokeWidth={1.5} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Add-Ons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl border border-[var(--border)] shadow-card p-6 md:p-10 mb-16"
        >
          <h3 className="font-display text-2xl font-medium text-[var(--primary)] text-center mb-8">
            Add-On Services
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {addOns.map((addon) => (
              <div
                key={addon.name}
                className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg)]/50 p-5"
              >
                <span className="text-sm font-medium text-[var(--primary)]">{addon.name}</span>
                <span className="text-sm font-semibold text-[var(--accent)]">KES {addon.price}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Comparison Toggle */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:text-[var(--primary)] transition-colors"
          >
            {showComparison ? 'Hide' : 'Compare'} all packages
            {showComparison ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        <AnimatePresence>
          {showComparison && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden mb-16"
            >
              <div className="bg-white rounded-3xl border border-[var(--border)] shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="text-left px-6 py-4 font-medium text-[var(--primary)]/60 w-1/4">
                          Feature
                        </th>
                        {packages.map((pkg) => (
                          <th
                            key={pkg.id}
                            className={`text-center px-6 py-4 font-display text-lg font-medium w-1/4 ${
                              pkg.popular ? 'text-[var(--accent)]' : 'text-[var(--primary)]'
                            }`}
                          >
                            {pkg.name}
                          {pkg.popular && (
                            <span className="block text-[10px] font-sans font-semibold uppercase tracking-widest mt-1">
                              Most Popular
                            </span>
                          )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        'Timeline',
                        'Revisions',
                        '2D Layout',
                        '3D Render',
                        'Shopping Lists',
                        'Design Concepts',
                        'Room Limit',
                      ].map((feature) => (
                        <tr key={feature} className="border-b border-[var(--border)]/60">
                          <td className="px-6 py-3.5 text-[var(--primary)]/70">{feature}</td>
                          {packages.map((pkg) => {
                            const values = {
                              'Timeline': ['7 days', '14 days', '21 days'],
                              'Revisions': ['1 revision', '2 revisions', '3 revisions'],
                              '2D Layout': ['Included', 'Included', 'Included'],
                              '3D Render': ['—', 'Included', 'Included'],
                              'Shopping Lists': ['Budget', 'Budget + Elevated', 'Budget + Elevated'],
                              'Design Concepts': ['1 concept', '2 concepts', '2 concepts'],
                              'Room Limit': ['1 room', '1 room', 'Up to 3 rooms'],
                            }
                            const idx = packages.findIndex((p) => p.id === pkg.id)
                            const included = values[feature][idx] !== '—'
                            return (
                              <td
                                key={pkg.id}
                                className={`px-6 py-3.5 text-center ${
                                  included ? 'text-[var(--primary)]' : 'text-[var(--primary)]/30'
                                }`}
                              >
                                {values[feature][idx]}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-16">
          <h3 className="font-display text-3xl font-medium text-[var(--primary)] text-center mb-10">
            Frequently Asked Questions
          </h3>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                  aria-expanded={openFaq === i}
                >
                  <span className="text-sm font-medium text-[var(--primary)] pr-4">
                    {faq.q}
                  </span>
                  {openFaq === i ? (
                    <ChevronUp size={18} className="text-[var(--accent)] flex-shrink-0" />
                  ) : (
                    <ChevronDown size={18} className="text-[var(--primary)]/30 flex-shrink-0" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="px-6 pb-5 text-sm text-[var(--primary)]/65 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Modal */}
        <AnimatePresence>
          {modalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--primary)]/40 backdrop-blur-sm"
              onClick={() => setModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-3xl p-8 md:p-12 shadow-[0_30px_80px_rgba(0,0,0,0.15)] max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setModalOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-full text-[var(--primary)]/40 hover:text-[var(--primary)] hover:bg-[var(--secondary)]/30 transition-colors"
                  aria-label="Close modal"
                >
                  <X size={24} strokeWidth={1.5} />
                </button>

                <div className="text-center mb-8">
                  <h3 className="font-display text-2xl md:text-3xl font-medium text-[var(--primary)] mb-2">
                    Book a Consultation
                  </h3>
                  <p className="text-[var(--primary)]/60">
                    {selectedPackage ? `Interested in ${selectedPackage}? Tell us about your project.` : 'Tell us about your project and we will get back to you within 24 hours.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-[var(--primary)] mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="input-luxury"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-[var(--primary)] mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="input-luxury"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-[var(--primary)] mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="input-luxury"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="service" className="block text-sm font-medium text-[var(--primary)] mb-1">
                      Package of Interest
                    </label>
                    <select
                      id="service"
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      className="input-luxury"
                    >
                      <option value="">Select a package</option>
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.rawName || pkg.name}>
                          {pkg.name} - {pkg.currency} {pkg.price}
                          {pkg.priceMax !== pkg.price ? ` to ${pkg.priceMax}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-[var(--primary)] mb-1">
                      Project Details
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                      className="input-luxury resize-none min-h-[120px]"
                      placeholder="Tell us about your space, timeline, and budget..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="preferredDate" className="block text-sm font-medium text-[var(--primary)] mb-1">
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        id="preferredDate"
                        name="preferredDate"
                        value={formData.preferredDate}
                        onChange={handleChange}
                        className="input-luxury"
                      />
                    </div>
                    <div>
                      <label htmlFor="preferredTime" className="block text-sm font-medium text-[var(--primary)] mb-1">
                        Preferred Time
                      </label>
                      <input
                        type="time"
                        id="preferredTime"
                        name="preferredTime"
                        value={formData.preferredTime}
                        onChange={handleChange}
                        className="input-luxury"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full btn-luxury-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Request Consultation
                        <Send size={14} strokeWidth={1.5} />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
})

export default EDesignPackages
