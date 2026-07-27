import { useState, useCallback, useRef } from 'react'
import { X, UploadCloud, Image as ImageIcon, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../services/api'
import { toast } from 'react-hot-toast'

const EMPTY_FORM = { name: '', email: '', phone: '', message: '', budget: '', timeline: '', projectType: '' }

export const ConsultationModal = ({ isOpen, onClose }) => {
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const fileRef = useRef(null)

  const reset = useCallback(() => {
    setForm(EMPTY_FORM)
    setStatus('')
    setImageFiles([])
    setImagePreviews([])
    if (fileRef.current) fileRef.current.value = ''
  }, [])

  const handleImageFiles = (files) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    const newFiles = [...imageFiles, ...validFiles].slice(0, 10)
    setImageFiles(newFiles)
    validFiles.forEach(f => setImagePreviews(prev => [...prev, URL.createObjectURL(f)]))
  }

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleImageDrop = (e) => {
    e.preventDefault()
    handleImageFiles(e.dataTransfer.files)
  }

  const handleImageDragOver = (e) => {
    e.preventDefault()
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus('')
    try {
      const payload = new FormData()
      payload.append('name', form.name)
      payload.append('email', form.email)
      payload.append('phone', form.phone)
      payload.append('message', form.message)
      payload.append('budget', form.budget)
      payload.append('timeline', form.timeline)
      payload.append('projectType', form.projectType)

      imageFiles.forEach((file) => {
        payload.append('images', file)
      })

      await api.post('/consultations', payload)
      setStatus('success')
      setTimeout(() => { onClose(); reset() }, 3000)
    } catch {
      setStatus('error')
      toast.error('Failed to submit consultation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-charcoal/60 backdrop-blur-md"
            onClick={() => { reset(); onClose() }}
          />
          <motion.div
            key={isOpen ? 'open' : 'closed'}
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[560px] bg-white rounded-[28px] p-8 md:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-full text-charcoal/40 transition-colors duration-300 hover:text-charcoal hover:bg-secondary/60"
            >
              <X size={20} strokeWidth={1.5} />
            </button>

            <div className="text-center mb-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze mb-3">Get In Touch</p>
              <h3 className="font-['Playfair_Display'] text-3xl md:text-4xl text-charcoal mb-3">Book a Consultation</h3>
              <p className="text-sm text-textSecondary leading-relaxed max-w-sm mx-auto">
                Tell us about your project and we will get back to you within 24 hours.
              </p>
            </div>

            <AnimatePresence>
              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 rounded-2xl bg-success/10 p-5 text-sm text-success text-center border border-success/20"
                >
                  Thank you! We will be in touch soon.
                </motion.div>
              )}
              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 rounded-2xl bg-error/10 p-5 text-sm text-error text-center border border-error/20"
                >
                  Something went wrong. Please try again.
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={submit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-secondary/30 px-5 py-4 text-sm text-charcoal placeholder:text-charcoal/40 outline-none transition-all duration-300 focus:border-bronze focus:bg-white"
                  placeholder="Full Name"
                  required
                />
                <input
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  type="email"
                  className="w-full rounded-xl border border-border bg-secondary/30 px-5 py-4 text-sm text-charcoal placeholder:text-charcoal/40 outline-none transition-all duration-300 focus:border-bronze focus:bg-white"
                  placeholder="Email Address"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-secondary/30 px-5 py-4 text-sm text-charcoal placeholder:text-charcoal/40 outline-none transition-all duration-300 focus:border-bronze focus:bg-white"
                  placeholder="Phone Number"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Budget</label>
                  <input
                    value={form.budget}
                    onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/40 outline-none transition-all duration-300 focus:border-bronze focus:bg-white"
                    placeholder="e.g. $5,000"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Timeline</label>
                  <input
                    value={form.timeline}
                    onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/40 outline-none transition-all duration-300 focus:border-bronze focus:bg-white"
                    placeholder="e.g. 3 months"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Project Type</label>
                  <input
                    value={form.projectType}
                    onChange={(e) => setForm((f) => ({ ...f, projectType: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/40 outline-none transition-all duration-300 focus:border-bronze focus:bg-white"
                    placeholder="e.g. Renovation"
                  />
                </div>
              </div>

              <textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="w-full rounded-xl border border-border bg-secondary/30 px-5 py-4 text-sm text-charcoal placeholder:text-charcoal/40 outline-none transition-all duration-300 focus:border-bronze focus:bg-white resize-none"
                placeholder="Tell us about your project..."
                rows={4}
                required
              />

              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70 flex items-center gap-1.5">
                  <ImageIcon size={12} />
                  Project Images (optional, up to 10)
                </label>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => handleImageFiles(e.target.files)} className="hidden" />
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  onDrop={handleImageDrop}
                  onDragOver={handleImageDragOver}
                  onClick={() => fileRef.current?.click()}
                  className="relative border-2 border-dashed rounded-2xl transition-all duration-300 border-border bg-secondary/30 hover:border-bronze/50 cursor-pointer"
                >
                  {imagePreviews.length > 0 ? (
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-[var(--primary)]">Uploaded Images ({imagePreviews.length}/10)</p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
                          className="text-xs text-bronze hover:text-forest font-medium"
                        >
                          Add More
                        </motion.button>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {imagePreviews.map((src, i) => (
                          <div key={i} className="relative rounded-lg overflow-hidden group">
                            <img src={src} alt="" className="h-20 w-full object-cover" />
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeImage(i) }}
                              className="absolute top-1 right-1 bg-charcoal/80 backdrop-blur-sm text-white p-1 rounded-full"
                            >
                              <Trash2 size={10} />
                            </motion.button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-6">
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-12 h-12 rounded-xl bg-bronze/10 flex items-center justify-center text-bronze"
                      >
                        <UploadCloud size={24} />
                      </motion.div>
                      <p className="text-sm text-charcoal/60">Drop images here or click to browse</p>
                      <p className="text-[10px] text-charcoal/40">PNG, JPG up to 10MB each (max 10)</p>
                    </div>
                  )}
                </motion.div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-forest py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-all duration-300 hover:bg-forestDark hover:shadow-[0_10px_40px_rgba(31,77,58,0.15)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ height: '52px' }}
              >
                {loading ? 'Sending…' : 'Book Consultation'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}