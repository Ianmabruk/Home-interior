import { useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { api } from '@services/api'

export const ConsultationModal = memo(({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email) {
      setError('Name and email are required')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/consultations', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        service: formData.service || undefined,
        projectType: formData.service || undefined,
        message: formData.message || undefined,
        type: 'consultation',
      })
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setFormData({ name: '', email: '', phone: '', service: '', message: '' })
        onClose()
      }, 2000)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--primary)]/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-3xl p-8 md:p-12 shadow-[0_30px_80px_rgba(0,0,0,0.15)]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-[var(--primary)]/40 hover:text-[var(--primary)] hover:bg-[var(--secondary)]/30 transition-colors"
            aria-label="Close modal"
          >
            <X size={24} strokeWidth={1.5} />
          </button>

          {success ? (
            <div className="text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success)]/10 text-[var(--success)]">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="font-display text-2xl font-medium text-[var(--primary)] mb-2">Request Sent!</h3>
              <p className="text-[var(--primary)]/60">We&apos;ll contact you within 24 hours to schedule your consultation.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="font-display text-2xl md:text-3xl font-medium text-[var(--primary)] mb-2">Book a Consultation</h3>
                <p className="text-[var(--primary)]/60">Let&apos;s discuss your project and bring your vision to life.</p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-xl bg-[var(--error)]/10 p-3 text-sm text-[var(--error)]"
                >
                  {error}
                </motion.div>
              )}

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
                    <option value="residential">Residential Design</option>
                    <option value="commercial">Commercial Design</option>
                    <option value="virtual">Virtual Design</option>
                    <option value="furniture">Furniture Curation</option>
                    <option value="consultation">Design Consultation</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-[var(--primary)] mb-1">Project Details</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="input-luxury resize-none min-h-[120px]"
                  placeholder="Tell us about your project, timeline, and budget..."
                />
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
                  'Request Consultation'
                )}
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
})

export default ConsultationModal