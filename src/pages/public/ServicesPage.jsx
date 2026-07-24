import { motion } from 'framer-motion'
import { useState } from 'react'
import { Upload, X, Image as ImageIcon, Send } from 'lucide-react'
import { api } from '../../services/api'
import { toast } from 'react-hot-toast'

const uploadVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
}

const ImageUpload = ({ index, onRemove, previews, setPreviews }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFile(file)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFile(file)
    }
  }

  const handleFile = (file) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    const newPreviews = [...previews]
    newPreviews[index] = { file, url }
    setPreviews(newPreviews)
  }

  const removeImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    const newPreviews = [...previews]
    newPreviews[index] = null
    setPreviews(newPreviews)
    onRemove(index)
  }

  const uploadAreaClass = `relative rounded-2xl border-2 border-dashed transition-all duration-300 ${
    isDragging ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)]/60 hover:border-[var(--accent)]/50'
  }`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex-1 min-w-0"
    >
      {previewUrl ? (
        <div className="relative aspect-square rounded-2xl overflow-hidden border border-[var(--border)]/40 bg-white">
          <img
            src={previewUrl}
            alt={`Upload preview ${index + 1}`}
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-[var(--primary)]/80 text-white hover:bg-[var(--accent)] transition-colors shadow-md"
            aria-label={`Remove image ${index + 1}`}
          >
            <X size={16} strokeWidth={2} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
            <p className="text-xs text-white/80 truncate">{previews[index]?.file?.name || 'Image'}</p>
          </div>
        </div>
      ) : (
        <div
          className={`${uploadAreaClass} aspect-square flex flex-col items-center justify-center p-6 text-center cursor-pointer`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            aria-label={`Upload image ${index + 1}`}
          />
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--secondary)]/50 text-[var(--accent)]">
              <Upload size={28} strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-[var(--primary)]">Upload Image {index + 1}</p>
            <p className="text-xs text-[var(--primary)]/50">Max 5MB • JPG, PNG, WebP</p>
            <p className="text-[10px] text-[var(--primary)]/40">Drag & drop or click to browse</p>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export const ServicesPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    projectSummary: '',
  })
  const [previews, setPreviews] = useState([null, null, null])
  const [submitting, setSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitStatus(null)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('fullName', formData.fullName)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('phone', formData.phone)
      formDataToSend.append('projectSummary', formData.projectSummary)

      previews.forEach((preview, index) => {
        if (preview?.file) {
          formDataToSend.append(`image${index + 1}`, preview.file)
        }
      })

      await api.post('/contact/inquiry', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setSubmitStatus('success')
      setFormData({ fullName: '', email: '', phone: '', projectSummary: '' })
      setPreviews([null, null, null])
      toast.success('Inquiry submitted successfully!')
    } catch (err) {
      console.error('[SERVICES] Submission failed:', err)
      setSubmitStatus('error')
      toast.error('Failed to submit inquiry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] via-[var(--primary)]/80 to-[var(--primary)]/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,154,67,0.15),transparent_50%)]" />
        <div className="relative z-10 container-wide px-6 md:px-12 lg:px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]/80 mb-4">Project Inquiry</p>
            <h1 className="font-display text-5xl font-normal leading-tight text-white md:text-7xl lg:text-8xl">
              Tell Us About Your Project
            </h1>
            <p className="mt-6 max-w-xl text-base text-white/60 leading-relaxed">
              Share your vision and we&apos;ll get back to you with a personalized proposal.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-pad bg-[var(--bg)] pt-12">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <form onSubmit={handleSubmit} className="space-y-8">
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
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-[var(--primary)] mb-2">
                      Phone Number <span className="text-[var(--accent)]">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-[var(--border)]/40 bg-white px-5 py-3.5 text-base text-[var(--primary)] placeholder:text-[var(--primary)]/30 outline-none transition-all duration-300 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                      placeholder="+254 7XX XXX XXX"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="projectSummary" className="block text-sm font-medium text-[var(--primary)] mb-2">
                    Project Summary <span className="text-[var(--accent)]">*</span>
                  </label>
                  <textarea
                    id="projectSummary"
                    name="projectSummary"
                    value={formData.projectSummary}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full rounded-xl border border-[var(--border)]/40 bg-white px-5 py-3.5 text-base text-[var(--primary)] placeholder:text-[var(--primary)]/30 outline-none transition-all duration-300 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 resize-none"
                    placeholder="Tell us about your project: type of space, style preferences, timeline, budget range, and any specific requirements..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--primary)] mb-4">
                    Reference Images (Optional) <span className="text-[var(--primary)]/50 font-normal">— Up to 3 images</span>
                  </label>
                  <p className="text-sm text-[var(--primary)]/50 mb-4">
                    Upload inspiration photos, floor plans, or current space photos to help us understand your vision.
                  </p>
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
                    className="grid gap-4 grid-cols-3"
                  >
                    {[0, 1, 2].map((i) => (
                      <ImageUpload
                        key={i}
                        index={i}
                        previews={previews}
                        setPreviews={setPreviews}
                        onRemove={() => {}}
                      />
                    ))}
                  </motion.div>
                </div>

                {submitStatus === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/20 text-[var(--success)] text-sm"
                  >
                    Thank you! Your inquiry has been submitted. We&apos;ll contact you within 24 hours.
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

                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-luxury-primary w-full md:w-auto px-10 py-4 text-[11px] rounded-xl flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Inquiry
                      <Send size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section-pad bg-[var(--primary)]">
        <div className="container-wide px-6 md:px-12 lg:px-20 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--secondary)]/50 mb-4">Prefer Direct Contact?</p>
          <h2 className="font-display text-4xl font-normal text-white md:text-5xl lg:text-6xl leading-[1.05] mb-6">
            Let&apos;s Talk
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-base text-white/50 leading-relaxed mb-10">
            Call or email us directly for immediate assistance.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="tel:+254700000000"
              className="btn-luxury-primary group px-8 py-4 text-[11px] rounded-xl"
            >
              Call Us
            </a>
            <a
              href="mailto:info@hokinteriors.com"
              className="group btn-luxury-secondary px-8 py-4 text-[11px] rounded-xl"
            >
              Email Us
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}