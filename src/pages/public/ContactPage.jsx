import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'
import { api } from '../../services/api'
import { toast } from 'react-hot-toast'
import { PageMeta } from '../../hooks/usePageMeta'
import ContactSection from '../../components/common/ContactSection'

export const ContactPage = () => {
  const [contactInfo, setContactInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const loadContact = async () => {
    try {
      const res = await api.get('/contact')
      setContactInfo(res.data)
    } catch {
      setContactInfo({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial data load is a standard pattern
    loadContact()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitStatus(null)
    try {
      await api.post('/contact', formData)
      setSubmitStatus('success')
      setFormData({ fullName: '', email: '', phone: '', subject: '', message: '' })
      toast.success('Message sent successfully!')
    } catch (err) {
      console.error('[CONTACT] Submission failed:', err)
      setSubmitStatus('error')
      toast.error('Failed to send message. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg)]">
        <section className="section-pad bg-[var(--bg)]">
          <div className="container-wide px-6 md:px-12 lg:px-20">
            <div className="max-w-3xl mx-auto">
              <div className="space-y-4">
                <div className="skeleton h-8 w-32" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-3/4" />
              </div>
              <div className="mt-12 grid gap-6 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3">
                    <div className="skeleton h-10 w-10 rounded-xl" />
                    <div className="skeleton h-4 w-24" />
                    <div className="skeleton h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  }

  const renderContactInfo = () => (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mb-16 md:mb-24">
      <ContactSection contactInfo={contactInfo} />
    </motion.div>
  )

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <PageMeta title="Contact Us — HOK Interior Designs" description="Get in touch with HOK Interior Designs for your next project." />
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden bg-[var(--primary)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] via-[var(--primary)]/80 to-[var(--primary)]/60" />
        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-3xl"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]/80 mb-4">Get In Touch</p>
            <h1 className="font-display text-5xl font-normal leading-tight text-white md:text-7xl lg:text-8xl">
              Contact Us
            </h1>
            <p className="mt-6 text-base md:text-lg text-white/60 leading-relaxed max-w-xl mx-auto">
              We&apos;d love to hear from you. Reach out and let&apos;s start a conversation about your project.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Information */}
      {renderContactInfo()}

      {/* Contact Form */}
          <div className="max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="mb-12 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Send a Message</p>
              <h2 className="font-display text-3xl md:text-4xl font-normal leading-tight text-[var(--primary)]">
                We&apos;re Here to Help
              </h2>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-3xl p-6 md:p-10 shadow-[0_10px_40px_rgba(42,36,31,0.06)]">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-[var(--primary)] mb-2">
                    Full Name <span className="text-[var(--accent)]">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-[var(--border)]/40 bg-white px-5 py-3.5 text-base text-[var(--primary)] placeholder:text-[var(--primary)]/30 outline-none transition-all duration-300 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[var(--primary)] mb-2">
                    Email Address <span className="text-[var(--accent)]">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-[var(--border)]/40 bg-white px-5 py-3.5 text-base text-[var(--primary)] placeholder:text-[var(--primary)]/30 outline-none transition-all duration-300 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[var(--primary)] mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[var(--border)]/40 bg-white px-5 py-3.5 text-base text-[var(--primary)] placeholder:text-[var(--primary)]/30 outline-none transition-all duration-300 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                    placeholder="+254 7XX XXX XXX"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-[var(--primary)] mb-2">
                    Subject <span className="text-[var(--accent)]">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-[var(--border)]/40 bg-white px-5 py-3.5 text-base text-[var(--primary)] placeholder:text-[var(--primary)]/30 outline-none transition-all duration-300 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                    placeholder="Project Inquiry"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-[var(--primary)] mb-2">
                  Message <span className="text-[var(--accent)]">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full rounded-xl border border-[var(--border)]/40 bg-white px-5 py-3.5 text-base text-[var(--primary)] placeholder:text-[var(--primary)]/30 outline-none transition-all duration-300 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 resize-none"
                  placeholder="Tell us about your project, ask a question, or share your vision..."
                />
              </div>

              {submitStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/20 text-[var(--success)] text-sm"
                >
                  Thank you! Your message has been sent. We&apos;ll get back to you within 24 hours.
                </motion.div>
              )}

              {submitStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] text-sm"
                >
                  Something went wrong. Please try again or contact us directly.
                </motion.div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-luxury-primary w-full md:w-auto px-10 py-4 text-[11px] rounded-xl flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <Send size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          </div>
    </main>
  )
}

export default ContactPage