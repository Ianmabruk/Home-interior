import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UploadCloud,
  Edit,
  Trash2,
  Plus,
  Sparkles,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Image as ImageIcon,
  Save,
  Heart,
  Award,
  MapPin,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { api } from '../../services/api'
import { dispatchAdminDataChanged } from '../../utils/adminEvents'

const INITIAL_FORM = {
  title: 'About Us',
  subtitle: '',
  description: '',
  story: '',
  mission: '',
  vision: '',
  experience: '',
  values: '',
  buttonText: '',
  buttonUrl: '',
  projectsCompleted: '0',
  happyClients: '0',
  yearsExperience: '0',
  countriesServed: '0',
}

export const AboutDashboard = () => {
  const [form, setForm] = useState(INITIAL_FORM)
  const [aboutImages, setAboutImages] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [dragId, setDragId] = useState(null)
  const [editingImageId, setEditingImageId] = useState(null)
  const [imageForm, setImageForm] = useState({ displayOrder: 0, isActive: true })
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [originalImageOrder, setOriginalImageOrder] = useState(null)
  const fileRef = useRef(null)
  const editFileRef = useRef(null)

  const loadAbout = useCallback(async () => {
    try {
      const [aboutRes, imagesRes] = await Promise.all([
        api.get('/admin/about'),
        api.get('/admin/about/images'),
      ])
      if (aboutRes.data) {
        const d = aboutRes.data
        setForm({
          title: d?.title || 'About Us',
          subtitle: d?.subtitle || '',
          description: d?.description || '',
          story: d?.story || '',
          mission: d?.mission || '',
          vision: d?.vision || '',
          experience: d?.experience || '',
          values: d?.values || '',
          buttonText: d?.buttonText || '',
          buttonUrl: d?.buttonUrl || '',
          projectsCompleted: String(d?.projectsCompleted ?? 0),
          happyClients: String(d?.happyClients ?? 0),
          yearsExperience: String(d?.yearsExperience ?? 0),
          countriesServed: String(d?.countriesServed ?? 0),
        })
      }
      if (imagesRes.data) {
        setAboutImages(Array.isArray(imagesRes.data) ? imagesRes.data : [])
      }
    } catch {
      setForm(INITIAL_FORM)
      setAboutImages([])
    }
  }, [])

  useEffect(() => {
    loadAbout()
  }, [loadAbout])

  useEffect(() => {
    const handler = () => { loadAbout() }
    window.addEventListener('admin-data-changed', handler)
    return () => window.removeEventListener('admin-data-changed', handler)
  }, [loadAbout])

  const handleContentSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = new FormData()
      payload.append('title', form.title || 'About Us')
      payload.append('subtitle', form.subtitle || '')
      payload.append('description', form.description || '')
      payload.append('story', form.story || '')
      payload.append('mission', form.mission || '')
      payload.append('vision', form.vision || '')
      payload.append('experience', form.experience || '')
      payload.append('values', form.values || '')
      payload.append('buttonText', form.buttonText || '')
      payload.append('buttonUrl', form.buttonUrl || '')
      payload.append('projectsCompleted', form.projectsCompleted || '0')
      payload.append('happyClients', form.happyClients || '0')
      payload.append('yearsExperience', form.yearsExperience || '0')
      payload.append('countriesServed', form.countriesServed || '0')
      await api.put('/admin/about', payload)
      dispatchAdminDataChanged('about-changed')
      toast.success('About content saved successfully.')
    } catch (err) {
      setError(err?.message || 'Failed to save about content. Please try again.')
      toast.error(err?.message || 'Failed to save about content.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleImageUpload = async (e) => {
    e.preventDefault()
    if (!imageFile) {
      toast.error('Please select an image to upload.')
      return
    }
    setSubmitting(true)
    try {
      const payload = new FormData()
      payload.append('image', imageFile)
      payload.append('displayOrder', String(imageForm.displayOrder || aboutImages.length))
      payload.append('isActive', String(imageForm.isActive))
      await api.post('/admin/about/images', payload)
      setImageFile(null)
      if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
      setImagePreview(null)
      setImageForm({ displayOrder: 0, isActive: true })
      setOriginalImageOrder(null)
      if (fileRef.current) fileRef.current.value = ''
      if (editFileRef.current) editFileRef.current.value = ''
      await loadAbout()
      dispatchAdminDataChanged('about-changed')
      toast.success('Image uploaded successfully.')
    } catch (err) {
      toast.error(err?.message || 'Failed to upload image.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleImageEdit = async (e) => {
    e.preventDefault()
    if (!editingImageId) return
    setSubmitting(true)
    try {
      const payload = new FormData()
      if (imageForm.displayOrder !== undefined) payload.append('displayOrder', String(imageForm.displayOrder))
      if (imageForm.isActive !== undefined) payload.append('isActive', String(imageForm.isActive))
      if (imageFile) payload.append('image', imageFile)
      await api.patch(`/admin/about/images/${editingImageId}`, payload)
      setEditingImageId(null)
      setImageFile(null)
      if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
      setImagePreview(null)
      setImageForm({ displayOrder: 0, isActive: true })
      setOriginalImageOrder(null)
      if (editFileRef.current) editFileRef.current.value = ''
      await loadAbout()
      dispatchAdminDataChanged('about-changed')
      toast.success('Image updated successfully.')
    } catch (err) {
      toast.error(err?.message || 'Failed to update image.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteImage = async (id) => {
    try {
      await api.delete(`/admin/about/images/${id}`)
      await loadAbout()
      dispatchAdminDataChanged('about-changed')
      toast.success('Image deleted successfully.')
    } catch (err) {
      toast.error(err?.message || 'Failed to delete image.')
    }
  }

  const handleDragStart = (e, id) => {
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, targetId) => {
    e.preventDefault()
    if (!dragId || dragId === targetId) {
      setDragId(null)
      return
    }
    const draggedIndex = aboutImages.findIndex((img) => img.id === dragId)
    const targetIndex = aboutImages.findIndex((img) => img.id === targetId)
    if (draggedIndex === -1 || targetIndex === -1) {
      setDragId(null)
      return
    }
    const newImages = [...aboutImages]
    const [dragged] = newImages.splice(draggedIndex, 1)
    newImages.splice(targetIndex, 0, dragged)
    const orders = newImages.map((img, idx) => ({ id: img.id, displayOrder: idx }))
    try {
      await api.patch('/admin/about/images/reorder', { orders })
      await loadAbout()
      dispatchAdminDataChanged('about-changed')
      toast.success('Images reordered successfully.')
    } catch (err) {
      toast.error(err?.message || 'Failed to reorder images.')
    }
    setDragId(null)
  }

  const startEditImage = (img) => {
    setEditingImageId(img.id)
    setImageForm({
      displayOrder: img.displayOrder || 0,
      isActive: img.isActive !== false,
    })
    setImagePreview(img.imageUrl || null)
    setImageFile(null)
    setOriginalImageOrder(img.displayOrder || 0)
  }

  const cancelEditImage = () => {
    setEditingImageId(null)
    setImageForm({ displayOrder: originalImageOrder ?? 0, isActive: true })
    setImagePreview(null)
    setImageFile(null)
    setOriginalImageOrder(null)
    if (editFileRef.current) editFileRef.current.value = ''
    if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
  }

  const handleEditFileChange = (e) => {
    const f = e.target.files?.[0] || null
    setImageFile(f)
    if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
    if (f?.type?.startsWith('image/')) {
      setImagePreview(URL.createObjectURL(f))
    } else {
      setImagePreview(null)
    }
  }

  const moveImage = async (index, direction) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= aboutImages.length) return
    const updated = [...aboutImages]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    const orders = updated.map((img, i) => ({ id: img.id, displayOrder: i }))
    try {
      await api.patch('/admin/about/images/reorder', { orders })
      await loadAbout()
      dispatchAdminDataChanged('about-changed')
      toast.success('Image order updated.')
    } catch (err) {
      toast.error(err?.message || 'Failed to reorder image.')
    }
  }

  const statsFields = [
    { key: 'projectsCompleted', label: 'Projects Completed', icon: Award, placeholder: '150+' },
    { key: 'happyClients', label: 'Happy Clients', icon: Heart, placeholder: '500+' },
    { key: 'yearsExperience', label: 'Years Experience', icon: Award, placeholder: '15+' },
    { key: 'countriesServed', label: 'Countries Served', icon: MapPin, placeholder: '12' },
  ]

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-3xl text-[var(--primary)]">About Dashboard</h2>
          <p className="text-sm text-[var(--primary)]/50 mt-1">Manage about page content, images, and statistics</p>
        </div>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onSubmit={handleContentSubmit}
        className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)] space-y-5"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-[var(--accent)]" />
          <h3 className="font-display text-2xl text-[var(--primary)]">About Content</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Main Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
              placeholder="About Us"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Subtitle</label>
            <input
              value={form.subtitle}
              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
              placeholder="Designing Spaces, Creating Memories"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Short Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
            placeholder="Brief description for the about section..."
            rows={3}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Our Story</label>
          <textarea
            value={form.story}
            onChange={(e) => setForm((f) => ({ ...f, story: e.target.value }))}
            className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
            placeholder="Share your journey and philosophy..."
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Mission</label>
            <textarea
              value={form.mission}
              onChange={(e) => setForm((f) => ({ ...f, mission: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
              placeholder="Our mission..."
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Vision</label>
            <textarea
              value={form.vision}
              onChange={(e) => setForm((f) => ({ ...f, vision: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
              placeholder="Our vision..."
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Experience</label>
          <textarea
            value={form.experience}
            onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
            className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
            placeholder="Years of experience, team size, awards, etc..."
            rows={3}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Core Values (one per line, format: Title: Description)</label>
          <textarea
            value={form.values}
            onChange={(e) => setForm((f) => ({ ...f, values: e.target.value }))}
            className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none font-mono text-xs"
            placeholder="Excellence: Crafting spaces that inspire.\nSustainability: Committed to eco-friendly design."
            rows={4}
          />
        </div>

        <div className="border-t border-[var(--border)] pt-5">
          <div className="flex items-center gap-2 mb-4">
            <Award size={18} className="text-[var(--accent)]" />
            <h3 className="font-display text-xl text-[var(--primary)]">Statistics</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsFields.map((stat) => (
              <div key={stat.key} className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70 flex items-center gap-1">
                  <stat.icon size={12} />
                  {stat.label}
                </label>
                <input
                  value={form[stat.key]}
                  onChange={(e) => setForm((f) => ({ ...f, [stat.key]: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                  placeholder={stat.placeholder}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-5">
          <div className="flex items-center gap-2 mb-4">
            <ExternalLink size={18} className="text-[var(--accent)]" />
            <h3 className="font-display text-xl text-[var(--primary)]">Call to Action</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Button Text</label>
              <input
                value={form.buttonText}
                onChange={(e) => setForm((f) => ({ ...f, buttonText: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                placeholder="Request Consultation"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Button Link</label>
              <input
                value={form.buttonUrl}
                onChange={(e) => setForm((f) => ({ ...f, buttonUrl: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                placeholder="/consultation"
              />
            </div>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-[var(--error)]/30 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]"
          >
            {error}
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full rounded-full bg-[var(--primary)] text-white py-3 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={submitting}
        >
          {submitting && <Save size={14} className="animate-pulse" />}
          {submitting ? 'Saving...' : 'Save About Content'}
        </motion.button>
      </motion.form>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)]"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ImageIcon size={20} className="text-[var(--accent)]" />
            <h3 className="font-display text-2xl text-[var(--primary)]">About Images</h3>
          </div>
          <p className="text-[10px] text-[var(--primary)]/50">First image = homepage circular About image</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <AnimatePresence>
            {aboutImages.map((img, index) => (
              <motion.div
                key={img.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                draggable
                onDragStart={(e) => handleDragStart(e, img.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, img.id)}
                className={`relative group rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-move ${
                  dragId === img.id ? 'border-[var(--accent)] opacity-50' : 'border-[var(--border)]'
                } ${index === 0 && aboutImages.length > 0 ? 'ring-2 ring-[var(--accent)]/40' : ''}`}
              >
                <div className="aspect-[4/5] relative">
                  <img
                    src={img.imageUrl}
                    alt={`About image ${index + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  {index === 0 && aboutImages.length > 0 && (
                    <div className="absolute top-2 left-2 bg-[var(--accent)] text-white text-[9px] font-semibold uppercase tracking-widest px-2 py-1 rounded-full">
                      Homepage Circle
                    </div>
                  )}
                  {!img.isActive && (
                    <div className="absolute inset-0 bg-[var(--primary)]/40 flex items-center justify-center">
                      <span className="text-white text-[10px] font-semibold uppercase tracking-widest">Inactive</span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveImage(index, -1)}
                      disabled={index === 0}
                      className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-[var(--primary)] hover:bg-white disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(index, 1)}
                      disabled={index === aboutImages.length - 1}
                      className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-[var(--primary)] hover:bg-white disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEditImage(img)}
                      className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-[var(--primary)] hover:bg-white"
                      aria-label="Edit image"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      className="p-1.5 bg-[var(--error)]/90 backdrop-blur-sm rounded-lg text-white hover:bg-[var(--error)]"
                      aria-label="Delete image"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical size={16} className="text-white/80" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-[var(--border)] rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[var(--accent)] transition-colors min-h-[200px]"
          >
            <UploadCloud size={32} className="text-[var(--primary)]/30" />
            <p className="text-xs font-medium text-[var(--primary)]/50">Upload Image</p>
          </motion.div>
        </div>

        <input ref={fileRef} type="file" accept="image/*" onChange={(e) => {
          const f = e.target.files?.[0] || null
          if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
          setImageFile(f)
          setImagePreview(f ? URL.createObjectURL(f) : null)
          setEditingImageId(null)
          setImageForm({ displayOrder: aboutImages.length, isActive: true })
          setOriginalImageOrder(null)
        }} className="hidden" />

        {(imagePreview || imageFile) && !editingImageId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-[var(--border)] pt-5 space-y-4"
          >
            <h4 className="font-display text-lg text-[var(--primary)]">Upload New Image</h4>
            {imagePreview && (
              <div className="relative rounded-xl overflow-hidden max-w-xs">
                <img src={imagePreview} alt="Preview" className="h-48 w-full object-cover" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Display Order</label>
                <input
                  type="number"
                  value={imageForm.displayOrder}
                  onChange={(e) => setImageForm((f) => ({ ...f, displayOrder: Number(e.target.value) || 0 }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Active</label>
                <label className="flex items-center gap-2 cursor-pointer h-12">
                  <input
                    type="checkbox"
                    checked={imageForm.isActive}
                    onChange={(e) => setImageForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="w-5 h-5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-2"
                  />
                  <span className="text-sm text-[var(--primary)]">Visible on site</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => { 
                  if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
                  setImageFile(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = '' }}
                className="flex-1 rounded-full border border-[var(--border)] bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleImageUpload}
                disabled={submitting}
                className="flex-1 rounded-full bg-[var(--primary)] text-white py-3 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-lg disabled:opacity-50"
              >
                {submitting ? 'Uploading...' : 'Upload Image'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {editingImageId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-[var(--border)] pt-5 space-y-4"
          >
            <h4 className="font-display text-lg text-[var(--primary)]">Edit Image</h4>
            {imagePreview && (
              <div className="relative rounded-xl overflow-hidden max-w-xs">
                <img src={imagePreview} alt="Preview" className="h-48 w-full object-cover" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Replace Image</label>
                <label className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-white/50 px-4 py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--primary)]/70 hover:text-[var(--accent)] hover:border-[var(--accent)] hover:bg-white transition-all duration-200 cursor-pointer">
                  <Plus size={14} />
                  Choose File
                  <input ref={editFileRef} type="file" accept="image/*" onChange={handleEditFileChange} className="hidden" />
                </label>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Display Order</label>
                <input
                  type="number"
                  value={imageForm.displayOrder}
                  onChange={(e) => setImageForm((f) => ({ ...f, displayOrder: Number(e.target.value) || 0 }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Active</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={imageForm.isActive}
                  onChange={(e) => setImageForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="w-5 h-5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-2"
                />
                <span className="text-sm text-[var(--primary)]">Visible on site</span>
              </label>
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={cancelEditImage}
                className="flex-1 rounded-full border border-[var(--border)] bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleImageEdit}
                disabled={submitting}
                className="flex-1 rounded-full bg-[var(--primary)] text-white py-3 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-lg disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Update Image'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default AboutDashboard
