import { useState, useRef } from 'react'
import { Upload, X, Send, Brush, MonitorSmartphone, Armchair, Search, Sparkles, Hammer, Palette, Wrench } from 'lucide-react'
import { api } from '../../services/api'
import { toast } from 'react-hot-toast'
import { PageMeta } from '../../hooks/usePageMeta'

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
    <div className="flex-1 min-w-0">
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
            <p className="text-xs text-[var(--primary)]/50">Max 5MB \u2022 JPG, PNG, WebP</p>
            <p className="text-[10px] text-[var(--primary)]/40">Drag & drop or click to browse</p>
          </div>
        </div>
      )}
    </div>
  )
}

const SERVICE_CARDS = [
  { title: 'Interior Design', icon: Brush, description: 'Full-service interior design from concept to completion, tailored to your lifestyle and aesthetic.' },
  { title: 'Virtual Design', icon: MonitorSmartphone, description: 'Immersive 3D renderings and virtual walkthroughs to visualize your space before construction.' },
  { title: 'Space Planning', icon: Search, description: 'Optimize your layout for flow, function, and beauty with expert spatial planning.' },
  { title: 'Furniture Selection', icon: Armchair, description: 'Curated furniture sourcing and specification for every room and budget.' },
  { title: 'Styling & Décor', icon: Sparkles, description: 'Artful styling with accessories, textiles, and finishing touches that elevate your space.' },
  { title: 'Renovation Consultation', icon: Hammer, description: 'Expert guidance through renovations, from structural changes to material selection.' },
  { title: 'Material & Finish Selection', icon: Palette, description: 'Curated palettes of finishes, surfaces, and materials for cohesive, lasting beauty.' },
  { title: 'Custom Interior Solutions', icon: Wrench, description: 'Bespoke design solutions for unique challenges and one-of-a-kind spaces.' },
]

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
      <PageMeta title="Services — HOK Interior Designs" description="Comprehensive interior design services from concept to completion." />
      <section className="py-16 md:py-24 px-6 md:px-12 lg:px-20">
        <div className="container-wide text-center">
          <div className="mb-12 md:mb-16 flex flex-col items-center">
            <div className="relative w-32 h-32 md:w-36 md:h-36 mx-auto mb-8">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[var(--accent)]/10 to-[var(--secondary)]/30 border-4 border-white flex items-center justify-center">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--accent)]" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-normal text-[var(--primary)] leading-tight mb-4">
              Hello, Welcome 👋
            </h1>
            <p className="text-base md:text-lg text-[var(--primary)]/60 max-w-2xl mx-auto leading-relaxed">
              Tell us about your project below and we'll be in touch.
            </p>
          </div>
        </div>
      </section>

      {/* Services Cards Section */}
      <section className="bg-[var(--bg)] py-16 md:py-24 px-6 md:px-12 lg:px-20">
        <div className="container-wide">
          <div className="mb-16 md:mb-24 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">Our Services</p>
            <h2 className="font-display text-4xl font-medium leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
              What We Do
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
              Comprehensive interior design services tailored to elevate your space with timeless elegance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto mb-20">
            {SERVICE_CARDS.map((service) => (
              <div key={service.title} className="group bg-white rounded-3xl p-6 md:p-8 border border-[var(--border)]/40 hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] mb-6 transition-all duration-300 group-hover:bg-[var(--accent)] group-hover:text-white">
                  <service.icon size={28} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <h3 className="font-display text-xl font-medium text-[var(--primary)] mb-3">
                  {service.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--primary)]/60">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-[var(--bg)] pt-8">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <div className="max-w-3xl mx-auto">
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
                  Reference Images (Optional) <span className="text-[var(--primary)]/50 font-normal">\u2014 Up to 3 images</span>
                </label>
                <p className="text-sm text-[var(--primary)]/50 mb-4">
                  Upload inspiration photos, floor plans, or current space photos to help us understand your vision.
                </p>
                <div className="grid gap-4 grid-cols-3">
                  {[0, 1, 2].map((i) => (
                    <ImageUpload
                      key={i}
                      index={i}
                      previews={previews}
                      setPreviews={setPreviews}
                      onRemove={() => {}}
                    />
                  ))}
                </div>
              </div>

              {submitStatus === 'success' && (
                <div className="p-4 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/20 text-[var(--success)] text-sm">
                  Thank you! Your inquiry has been submitted. We\u2019ll contact you within 24 hours.
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="p-4 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] text-sm">
                  Something went wrong. Please try again or contact us directly.
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
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
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ServicesPage