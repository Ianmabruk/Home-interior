import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@services/api'
import { PageMeta } from '@hooks/usePageMeta'

const SITE_URL = 'https://hokinteriors.com'

export const WorkWithUsPage = () => {
  const [submitting, setSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    budget: '',
    startDate: '',
    timeline: '',
  })

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitStatus(null)
    try {
      await api.post('/work-with-us', formData)
      setSubmitStatus('success')
      setFormData({ fullName: '', phone: '', email: '', budget: '', startDate: '', timeline: '' })
    } catch (err) {
      setSubmitStatus('error')
      console.error('[WORK_WITH_US] Submit failed:', err)
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    const orgSchema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'HOK Interiors',
      description: 'Timeless luxury interior design, curated furniture, and premium virtual design services in Nairobi, Kenya.',
      url: SITE_URL,
      telephone: '+254115407200',
      email: 'info@hokinteriors.com',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Nairobi',
        addressCountry: 'KE',
        streetAddress: 'Westlands, Nairobi, Kenya',
      },
      sameAs: [
        'https://www.facebook.com/hokinteriors',
        'https://www.instagram.com/hokinteriors',
        'https://www.linkedin.com/company/hokinteriors',
      ],
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(orgSchema)
    script.setAttribute('data-structured-data', 'work-with-us-org')
    document.head.appendChild(script)

    const existing = document.querySelector('script[data-structured-data="work-with-us-org"]')
    if (existing && existing !== script) existing.remove()

    return () => {
      const el = document.querySelector('script[data-structured-data="work-with-us-org"]')
      if (el) el.remove()
    }
  }, [])

  return (
    <main>
      <PageMeta
        title="Work With Us — HOK Interior Designs"
        description="Start your project with HOK Interiors. Tell us about your dream space and we'll bring it to life."
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
            Work With Us
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-lg md:text-xl text-white/70 max-w-3xl mx-auto"
          >
            Tell us about your project and we'll design a space you'll love.
          </motion.p>
        </div>
      </section>

      <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-16 md:py-24">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="max-w-3xl mx-auto bg-white rounded-3xl border border-[var(--border)]/40 p-8 md:p-12"
          >
            <div className="text-center mb-10">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Start Your Project</p>
              <h3 className="font-display text-3xl md:text-4xl font-medium text-[var(--primary)]">Let's Build Together</h3>
              <p className="mt-2 text-[var(--primary)]/60">Fill out the form below and our team will get back to you shortly.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-[var(--primary)] mb-1">Full Name *</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="input-luxury"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[var(--primary)] mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="input-luxury"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div>
                  <label htmlFor="budget" className="block text-sm font-medium text-[var(--primary)] mb-1">Construction Budget</label>
                  <select
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    className="input-luxury"
                  >
                    <option value="">Select budget range</option>
                    <option value="under-5m">Under KES 5M</option>
                    <option value="5m-20m">KES 5M - 20M</option>
                    <option value="20m-50m">KES 20M - 50M</option>
                    <option value="50m-100m">KES 50M - 100M</option>
                    <option value="100m-plus">KES 100M+</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-[var(--primary)] mb-1">Preferred Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="input-luxury"
                  />
                </div>
                <div>
                  <label htmlFor="timeline" className="block text-sm font-medium text-[var(--primary)] mb-1">Time Limit / Project Timeline</label>
                  <select
                    id="timeline"
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleChange}
                    className="input-luxury"
                  >
                    <option value="">Select time frame</option>
                    <option value="asap">ASAP</option>
                    <option value="1-3-months">1-3 Months</option>
                    <option value="3-6-months">3-6 Months</option>
                    <option value="6-12-months">6-12 Months</option>
                    <option value="flexible">Flexible</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              {submitStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-[var(--success)]/10 text-[var(--success)]"
                >
                  <CheckCircle size={20} strokeWidth={2} />
                  <div>
                    <p className="font-medium">Application submitted successfully!</p>
                    <p className="text-sm">Thank you for your interest. We'll get back to you shortly.</p>
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
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <Send size={14} strokeWidth={1.5} className="ml-2" />
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* INTERNAL LINKS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center"
          >
            <p className="text-[var(--primary)]/60 mb-4">Prefer to explore first?</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/portfolio" className="btn-luxury-secondary">View Portfolio</Link>
              <Link to="/services" className="btn-luxury-secondary">Our Services</Link>
              <Link to="/about" className="btn-luxury-secondary">About Us</Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}

export default WorkWithUsPage
