import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Mail, MapPin, Phone, Loader2, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '@services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'

export const ContactPage = () => {
  const [contactInfo, setContactInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const loadContact = useCallback(async () => {
    try {
      const res = await api.get('/contact')
      setContactInfo(res.data || null)
    } catch {
      setContactInfo(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadContact()
  }, [loadContact])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'contact-changed') loadContact()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadContact])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitStatus(null)
    try {
      await api.post('/contact', formData)
      setSubmitStatus('success')
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (err) {
      setSubmitStatus('error')
      console.error('[CONTACT] Submit failed:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  if (loading) {
    return (
      <main>
        <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-20 md:py-32">
          <div className="container-wide">
            <div className="mb-16 text-center animate-fade-up">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Contact Us</p>
              <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl skeleton" />
            </div>
            <div className="grid gap-8 md:grid-cols-3 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="skeleton h-10 w-10 rounded-xl" />
                  <div className="skeleton h-4 w-24" />
                  <div className="skeleton h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main>
      <PageMeta
        title="Contact Us — HOK Interior Designs"
        description="Get in touch with HOK Interior Designs for your next project."
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
            Contact Us
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-lg md:text-xl text-white/70 max-w-3xl mx-auto"
          >
            Have a project in mind? We&apos;d love to hear from you. Send us a message and we&apos;ll get back to you within 24 hours.
          </motion.p>
        </div>
      </section>

      <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-16 md:py-24">
        <div className="container-wide">
          <div className="grid gap-12 md:grid-cols-3 mb-16 md:mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center p-6"
            >
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--secondary)]/30 text-[var(--accent)]">
                <MapPin size={24} strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-xl font-medium text-[var(--primary)] mb-2">Visit Our Studio</h3>
              <p className="text-[var(--primary)]/60">{contactInfo?.address || 'Westlands, Nairobi, Kenya'}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center p-6"
            >
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--secondary)]/30 text-[var(--accent)]">
                <Phone size={24} strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-xl font-medium text-[var(--primary)] mb-2">Call Us</h3>
              <p className="text-[var(--primary)]/60">
                <a href="tel:+254700000000" className="hover:text-[var(--accent)] transition-colors">+254 700 000 000</a>
              </p>
              <p className="text-[var(--primary)]/60">
                <a href="tel:+254711111111" className="hover:text-[var(--accent)] transition-colors">+254 711 111 111</a>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center p-6"
            >
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--secondary)]/30 text-[var(--accent)]">
                <Mail size={24} strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-xl font-medium text-[var(--primary)] mb-2">Email Us</h3>
              <p className="text-[var(--primary)]/60">
                <a href="mailto:info@hokinteriors.com" className="hover:text-[var(--accent)] transition-colors">info@hokinteriors.com</a>
              </p>
              <p className="text-[var(--primary)]/60">
                <a href="mailto:projects@hokinteriors.com" className="hover:text-[var(--accent)] transition-colors">projects@hokinteriors.com</a>
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="max-w-3xl mx-auto bg-white rounded-3xl border border-[var(--border)]/40 p-8 md:p-12"
          >
            <div className="text-center mb-10">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Send a Message</p>
              <h3 className="font-display text-3xl md:text-4xl font-medium text-[var(--primary)]">Get In Touch</h3>
              <p className="mt-2 text-[var(--primary)]/60">Fill out the form below and our team will get back to you shortly.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <label htmlFor="email" className="block text-sm font-medium text-[var(--primary)] mb-1">Email Address *</label>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[var(--primary)] mb-1">Phone Number</label>
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
                  <label htmlFor="subject" className="block text-sm font-medium text-[var(--primary)] mb-1">Subject *</label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="input-luxury"
                  >
                    <option value="">Select a subject</option>
                    <option value="residential">Residential Design</option>
                    <option value="commercial">Commercial Design</option>
                    <option value="virtual">Virtual Design</option>
                    <option value="furniture">Furniture Curation</option>
                    <option value="consultation">Design Consultation</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-[var(--primary)] mb-1">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="input-luxury resize-none min-h-[140px]"
                />
              </div>

              {submitStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-[var(--success)]/10 text-[var(--success)]"
                >
                  <CheckCircle size={20} strokeWidth={2} />
                  <div>
                    <p className="font-medium">Message sent successfully!</p>
                    <p className="text-sm">Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
                  </div>
                </motion.div>
              )}
              {submitStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-[var(--error)]/10 text-[var(--error)]"
                >
                  <AlertCircle size={20} strokeWidth={2} />
                  <div>
                    <p className="font-medium">Something went wrong</p>
                    <p className="text-sm">Please try again or contact us directly at info@hokinteriors.com</p>
                  </div>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-luxury-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <Send size={14} strokeWidth={1.5} className="ml-2" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </main>
  )
}

export default ContactPage