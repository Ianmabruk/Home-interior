import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { api } from '@services/api'
import { getOptimizedUrl } from '@utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'

const SkeletonServices = () => (
  <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="mb-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">Services</p>
        <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
          What We Do
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="group flex flex-col items-center text-center">
            <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--secondary)]/60 text-[var(--primary)] skeleton" />
            <h3 className="font-display text-xl md:text-2xl font-medium text-[var(--primary)] leading-tight skeleton" />
            <p className="mt-2 text-sm text-[var(--primary)]/60 leading-relaxed skeleton" />
          </div>
        ))}
      </div>
    </div>
  </section>
)

export const ServicesPage = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', service: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const loadServices = useCallback(async () => {
    try {
      const res = await api.get('/services')
      setServices(res.data || [])
    } catch (err) {
      console.warn('[SERVICES] Failed to load:', err?.message)
      setServices([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadServices()
  }, [loadServices])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'services-changed') loadServices()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadServices])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitStatus(null)
    try {
      await api.post('/consultations', formData)
      setSubmitStatus('success')
      setFormData({ name: '', email: '', phone: '', service: '', message: '' })
      setTimeout(() => setInquiryOpen(false), 2000)
    } catch (err) {
      setSubmitStatus('error')
      console.error('[SERVICES] Inquiry failed:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  if (loading) {
    return <main><SkeletonServices /></main>
  }

  return (
    <main>
      <PageMeta
        title="Services — HOK Interior Designs"
        description="Comprehensive interior design services from concept to completion."
      />
      <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)] via-[var(--primary)]/80 to-[var(--bg)]" />
        <div className="relative z-10 container-wide px-6 md:px-12 lg:px-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl md:text-7xl lg:text-8xl font-semibold text-white leading-tight"
          >
            Services
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-lg md:text-xl text-white/70 max-w-3xl mx-auto"
          >
            Comprehensive interior design services tailored to elevate your space with timeless elegance and meticulous attention to detail.
          </motion.p>
        </div>
      </section>

      <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-20 md:py-32">
        <div className="container-wide">
          <div className="mb-16 md:mb-24 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">Services</p>
            <h2 className="font-display text-4xl font-medium leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
              What We Do
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
              Comprehensive interior design services tailored to elevate your space with timeless elegance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
            {services.map((service, index) => (
              <motion.article
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="group flex flex-col items-center text-center"
              >
                <div className="relative mb-8">
                  <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--secondary)]/60 text-[var(--primary)] group-hover:bg-[var(--accent)] group-hover:text-white transition-all duration-500">
                    {service.imageUrl || service.mediaUrl ? (
                      <img
                        src={getOptimizedUrl(service.imageUrl || service.mediaUrl, { width: 120, crop: 'limit' })}
                        alt={service.title}
                        className="h-full w-full object-cover rounded-3xl"
                      />
                    ) : (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3a6 6 0 0 0 9 4 9 9 0 1 1-9-9Z" />
                        <line x1="21" y1="9" x2="15.5" y2="14.5" />
                        <line x1="15" y1="15" x2="14" y2="16" />
                      </svg>
                    )}
                  </div>
                </div>
                <h3 className="font-display text-xl md:text-2xl font-medium text-[var(--primary)] leading-tight mb-3">
                  {service.title}
                </h3>
                <p className="text-base text-[var(--primary)]/60 leading-relaxed mb-6 max-w-xs">
                  {service.description || 'Premium interior design service tailored to your unique vision and requirements.'}
                </p>
                <button
                  onClick={() => setInquiryOpen(true)}
                  className="btn-luxury-primary group inline-flex items-center gap-2 w-full max-w-xs"
                >
                  Inquire Now
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </motion.article>
            ))}
          </div>

          {services.length === 0 && (
            <div className="text-center py-20">
              <p className="font-display text-xl text-[var(--primary)]/60">No services available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Inquiry Modal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inquiryOpen ? { opacity: 1 } : { opacity: 0 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--primary)]/40 backdrop-blur-sm ${inquiryOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        onClick={() => setInquiryOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-[0_30px_80px_rgba(0,0,0,0.15)]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setInquiryOpen(false)}
            className="absolute top-4 right-4 p-1 rounded-full text-[var(--primary)]/40 hover:text-[var(--primary)] hover:bg-[var(--secondary)]/30 transition-colors"
            aria-label="Close modal"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="text-center mb-8">
            <h3 className="font-display text-3xl font-medium text-[var(--primary)]">Request a Consultation</h3>
            <p className="mt-2 text-[var(--primary)]/60">Tell us about your project and we'll get back to you.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[var(--primary)] mb-1">Full Name *</label>
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
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--primary)] mb-1">Email *</label>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[var(--primary)] mb-1">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-luxury"
                />
              </div>
              <div>
                <label htmlFor="service" className="block text-sm font-medium text-[var(--primary)] mb-1">Service of Interest</label>
                <select
                  id="service"
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  className="input-luxury"
                >
                  <option value="">Select a service</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.title}>{s.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-[var(--primary)] mb-1">Project Details *</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={4}
                className="input-luxury resize-none min-h-[120px]"
              />
            </div>

            {submitStatus === 'success' && (
              <div className="p-3 rounded-xl bg-[var(--success)]/10 text-[var(--success)] text-sm">
                Thank you! Your inquiry has been submitted. We'll contact you within 24 hours.
              </div>
            )}
            {submitStatus === 'error' && (
              <div className="p-3 rounded-xl bg-[var(--error)]/10 text-[var(--error)] text-sm">
                Something went wrong. Please try again or contact us directly.
              </div>
            )}

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
                'Submit Inquiry'
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </main>
  )
}

export default ServicesPage