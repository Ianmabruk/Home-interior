import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Edit,
  Trash2,
  Video,
  Plus,
  Image,
  Star,
} from 'lucide-react'
import { api } from '../../services/api'
import { emitAdminDataChanged } from '../../utils/adminEvents'
import { getOptimizedVideoUrl, getVideoPosterUrl, getOptimizedUrl } from '../../utils/cloudinaryHelpers'

const INITIAL_FORM = {
  title: '',
  description: '',
  mediaType: 'image',
  featured: false,
}

export const VirtualInteriorDashboard = () => {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(INITIAL_FORM)
  const [editingId, setEditingId] = useState(null)
  const [mediaFiles, setMediaFiles] = useState([])
  const [mediaPreviews, setMediaPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const fileRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/content/virtual-design')
        const data = Array.isArray(res.data) ? res.data : res.data?.items || []
        setItems(data)
      } catch {
        setItems([])
      }
    }
    load()
  }, [])

  const handleFiles = (files, setter, previewSetter) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
    setter(prev => [...prev, ...validFiles].slice(0, 1))
    validFiles.forEach(f => previewSetter(prev => [...prev, URL.createObjectURL(f)]))
  }

  const removeMedia = (index, filesSetter, previewsSetter) => {
    filesSetter(prev => prev.filter((_, i) => i !== index))
    previewsSetter(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setForm({
      title: item.title,
      description: item.description || '',
      mediaType: item.mediaType || 'image',
      featured: item.featured || false,
    })
    setMediaFiles(item.mediaUrl ? [{ url: item.mediaUrl, type: item.mediaType }] : [])
    setMediaPreviews(item.mediaUrl ? [item.mediaUrl] : [])
    setShowForm(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(INITIAL_FORM)
    setMediaFiles([])
    setMediaPreviews([])
    setShowForm(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e, setter, previewSetter) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFiles(e.dataTransfer.files, setter, previewSetter)
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = new FormData()
      payload.append('title', form.title)
      if (form.description) payload.append('description', form.description)
      payload.append('mediaType', form.mediaType)
      payload.append('featured', String(form.featured))

      const file = mediaFiles[0]
      if (file && file instanceof File) {
        payload.append('media', file)
      }

      if (editingId) {
        await api.patch(`/content/virtual-design/${editingId}`, payload)
      } else {
        await api.post('/content/virtual-design', payload)
      }
      resetForm()
      const res = await api.get('/content/virtual-design')
      setItems(Array.isArray(res.data) ? res.data : res.data?.items || [])
      emitAdminDataChanged({ type: 'virtual-changed' })
    } catch (err) {
      console.error('Submit error:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteItem = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/content/virtual-design/${deleteId}`)
      setDeleteId(null)
      const res = await api.get('/content/virtual-design')
      setItems(Array.isArray(res.data) ? res.data : res.data?.items || [])
      emitAdminDataChanged({ type: 'virtual-changed' })
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const handleImageClick = useCallback(() => {
    fileRef.current?.click()
  }, [])

  const handleVideoClick = useCallback(() => {
    videoRef.current?.click()
  }, [])

  const renderMediaUpload = ({ label, accept, previews, isDragOver, setFiles, setPreviews, onFileClick }) => (
    <button
      type="button"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, setFiles, setPreviews)}
      onClick={onFileClick}
      className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 w-full focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 ${
        isDragOver ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] bg-[var(--bg)]/30'
      }`}
      style={{ padding: 0 }}
    >
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="w-full h-full"
      >
      {previews.length > 0 ? (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[var(--primary)]">{label} (1 max)</p>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={onFileClick}
              className="text-xs text-[var(--accent)] hover:text-[var(--primary)] font-medium"
            >
              Replace
            </motion.button>
          </div>
          <div className="relative rounded-xl overflow-hidden group">
            {previews[0] && (
              <>
                {accept === 'video/*' ? (
                  <video src={previews[0]} className="h-40 w-full object-cover" autoPlay muted loop controls />
                ) : (
                  <img src={previews[0]} alt={`${label} preview`} className="h-40 w-full object-cover" />
                )}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeMedia(0, setFiles, setPreviews) }}
                  className="absolute top-2 right-2 bg-[var(--primary)]/90 backdrop-blur-sm text-white p-2 rounded-full hover:bg-[var(--primary)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </motion.button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-8">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent)]/10 to-[var(--secondary)]/10 flex items-center justify-center text-[var(--accent)]"
          >
            {accept === 'video/*' ? <Video size={28} /> : <Image size={28} />}
          </motion.div>
          <div>
            <p className="text-sm font-medium text-[var(--primary)]">Drop {accept === 'video/*' ? 'video' : 'image'} here or click to browse</p>
            <p className="text-[10px] text-[var(--primary)]/50 mt-1">{accept === 'video/*' ? 'MP4, MOV, WebM up to 50MB' : 'PNG, JPG, WebP up to 10MB'}</p>
          </div>
        </div>
      )}
      </motion.div>
    </button>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4"
      >
        <div>
          <h2 className="font-display text-3xl text-[var(--primary)]">Virtual Interior Design</h2>
          <p className="text-sm text-[var(--primary)]/50 mt-1">Manage virtual design projects - images and videos</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setEditingId(null); setForm(INITIAL_FORM); setMediaFiles([]); setMediaPreviews([]); setShowForm(true) }}
          className="btn-luxury-primary flex items-center gap-2"
        >
          <Plus size={18} strokeWidth={2} />
          Add Virtual Design Project
        </motion.button>
      </motion.div>

      {/* Upload Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onSubmit={submit}
            className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)] space-y-5 mb-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl text-[var(--primary)]">
                  {editingId ? 'Edit' : 'Add'} Virtual Design Project
                </h3>
                <p className="text-[10px] text-[var(--primary)]/50 mt-1">
                  {editingId ? 'Update project details' : 'Create a new virtual design project'}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={resetForm}
                className="p-2 rounded-xl text-[var(--primary)]/50 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)] transition"
              >
                <X size={20} strokeWidth={1.5} />
              </motion.button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                placeholder="Project Title"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
                placeholder="Describe this virtual design project..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Media Type</label>
                <select
                  value={form.mediaType}
                  onChange={(e) => setForm((f) => ({ ...f, mediaType: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Featured</label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                    className="w-5 h-5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-2"
                  />
                  <span className="text-sm text-[var(--primary)]">Show in featured section</span>
                </label>
              </div>
            </div>

            {/* Media Upload */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70 flex items-center gap-2">
                <Image size={14} strokeWidth={1.5} />
                Project Image
              </label>
              <input ref={fileRef} type="file" accept="image/*" onChange={(e) => handleFiles(e.target.files, setMediaFiles, setMediaPreviews)} className="hidden" />
              {/* eslint-disable-next-line react-hooks/refs -- false positive: handleImageClick only accesses ref in event handler */}
              {renderMediaUpload({
                label: 'Project Image',
                accept: 'image/*',
                previews: mediaPreviews,
                onFileClick: handleImageClick,
                isDragOver,
                setFiles: setMediaFiles,
                setPreviews: setMediaPreviews,
              })}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70 flex items-center gap-2">
                <Video size={14} strokeWidth={1.5} />
                Project Video
              </label>
              <input ref={videoRef} type="file" accept="video/*" onChange={(e) => handleFiles(e.target.files, setMediaFiles, setMediaPreviews)} className="hidden" />
              {/* eslint-disable-next-line react-hooks/refs -- false positive: handleVideoClick only accesses ref in event handler */}
              {renderMediaUpload({
                label: 'Project Video',
                accept: 'video/*',
                previews: mediaPreviews,
                onFileClick: handleVideoClick,
                isDragOver,
                setFiles: setMediaFiles,
                setPreviews: setMediaPreviews,
              })}
            </div>

            <div className="flex gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={resetForm}
                className="flex-1 rounded-full border border-[var(--border)] bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 rounded-full bg-[var(--primary)] text-white py-3 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-lg"
                disabled={loading}
              >
                {loading ? 'Saving...' : editingId ? 'Update Project' : 'Upload Project'}
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Items Grid */}
      <div className="grid gap-5 sm:grid-cols-2">
        {items.map((item, i) => (
          <motion.div
            layout
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)] overflow-hidden group"
          >
            <div className="relative">
              {item.mediaUrl && item.mediaType === 'video' ? (
                <video
                  src={getOptimizedVideoUrl(item.mediaUrl, { width: 480 })}
                  poster={getVideoPosterUrl(item.mediaUrl, { width: 480 })}
                  className="h-44 w-full object-cover"
                  autoPlay
                  muted
                  loop
                />
              ) : item.mediaUrl && item.mediaType === 'image' ? (
                <img
                  src={getOptimizedUrl(item.mediaUrl, { width: 480 })}
                  alt={item.title}
                  className="h-44 w-full object-cover"
                />
              ) : (
                <div className="h-44 w-full bg-[var(--secondary)]/60 flex items-center justify-center text-[var(--primary)]/30">
                  <Video size={40} />
                </div>
              )}
              <div className="absolute inset-0 bg-[var(--primary)]/0 transition-all duration-300 group-hover:bg-[var(--primary)]/30" />
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => startEdit(item)}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-[var(--primary)] hover:bg-white shadow-lg"
                >
                  <Edit size={14} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setDeleteId(item.id)}
                  className="p-2 bg-[var(--error)]/90 backdrop-blur-sm rounded-xl text-white hover:bg-[var(--error)] shadow-lg"
                >
                  <Trash2 size={14} />
                </motion.button>
              </div>
              {item.mediaType && (
                <div className={`absolute top-3 left-3 px-2 py-1 rounded text-[10px] font-medium uppercase ${
                  item.mediaType === 'video' ? 'bg-blue-500/90 text-white' : 'bg-green-500/90 text-white'
                }`}>
                  {item.mediaType}
                </div>
              )}
            </div>
            <div className="p-5">
              <h3 className="font-display text-lg text-[var(--primary)]">{item.title}</h3>
              <p className="text-xs text-[var(--primary)]/50 mt-1.5 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
              {item.featured && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] text-white text-[10px] font-semibold uppercase tracking-widest rounded-full shadow-lg">
                  <Star size={10} strokeWidth={2} />
                  Featured
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {items.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full py-20 text-center"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[var(--secondary)]/30 to-[var(--accent)]/10 flex items-center justify-center mb-4 text-[var(--primary)]/30">
              <Video size={32} />
            </div>
            <p className="font-display text-xl text-[var(--primary)]/30">No projects yet</p>
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-[var(--primary)]/40 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--error)]/10 flex items-center justify-center text-[var(--error)]">
                <Trash2 size={24} />
              </div>
              <h3 className="font-display text-xl text-[var(--primary)] text-center mb-2">Confirm Delete</h3>
              <p className="text-sm text-[var(--primary)]/50 text-center mb-6">Are you sure? This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteId(null)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={deleteItem}
                  className="rounded-full bg-[var(--error)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-white transition hover:bg-[var(--error)] hover:shadow-lg"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}