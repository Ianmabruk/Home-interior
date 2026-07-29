import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, X, Edit, Trash2, Video, Image, ToggleLeft } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { api } from '../../services/api'
import { dispatchAdminDataChanged } from '../../utils/adminEvents'

const INITIAL_FORM = {
  title: '',
  description: '',
  published: false,
  featured: false,
  displayOrder: 0,
}

export const BlogDashboard = () => {
  const [blogs, setBlogs] = useState([])
  const [form, setForm] = useState(INITIAL_FORM)
  const [editingId, setEditingId] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [videoPreview, setVideoPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const imageRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/admin/blog')
        setBlogs(Array.isArray(res.data) ? res.data : [])
      } catch {
        setBlogs([])
      }
    }
    load()
  }, [])

  useEffect(() => {
    const handler = () => {
      api.get('/admin/blog')
        .then((res) => setBlogs(Array.isArray(res.data) ? res.data : []))
        .catch(() => {})
    }
    window.addEventListener('admin-data-changed', handler)
    return () => window.removeEventListener('admin-data-changed', handler)
  }, [])

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoFile(file)
    setVideoPreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (imageRef.current) imageRef.current.value = ''
  }

  const removeVideo = () => {
    setVideoFile(null)
    setVideoPreview(null)
    if (videoRef.current) videoRef.current.value = ''
  }

  const startEdit = (item) => {
    setEditingId(item._id || item.id)
    setForm({
      title: item.title || '',
      description: item.description || '',
      published: item.published !== false,
      featured: item.featured || false,
      displayOrder: item.displayOrder || 0,
    })
    setImageFile(null)
    setVideoFile(null)
    setImagePreview(item.imageUrl || null)
    setVideoPreview(item.video || null)
    setShowForm(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(INITIAL_FORM)
    setImageFile(null)
    setVideoFile(null)
    setImagePreview(null)
    setVideoPreview(null)
    setShowForm(false)
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = new FormData()
      payload.append('title', form.title)
      if (form.description) payload.append('description', form.description)
      payload.append('published', String(form.published))
      payload.append('featured', String(form.featured))
      payload.append('displayOrder', String(form.displayOrder || 0))
      if (imageFile) payload.append('image', imageFile)
      if (videoFile) payload.append('video', videoFile)

      if (editingId) {
        await api.patch(`/admin/blog/${editingId}`, payload)
      } else {
        await api.post('/admin/blog', payload)
      }
      resetForm()
      const res = await api.get('/admin/blog')
      setBlogs(Array.isArray(res.data) ? res.data : [])
      dispatchAdminDataChanged('blog-changed')
    } catch (err) {
      console.error('Submit error:', err)
      toast.error(err?.message || 'Failed to save blog. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const deleteItem = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/admin/blog/${deleteId}`)
      setDeleteId(null)
      const res = await api.get('/admin/blog')
      setBlogs(Array.isArray(res.data) ? res.data : [])
      dispatchAdminDataChanged('blog-changed')
      toast.success('Blog deleted successfully.')
    } catch (err) {
      console.error('Delete error:', err)
      toast.error(err?.message || 'Failed to delete blog.')
    }
  }

  const togglePublished = async (item) => {
    try {
      await api.patch(`/admin/blog/${item.id}`, { published: !item.published })
      setBlogs(blogs.map((b) => (b.id === item.id ? { ...b, published: !b.published } : b)))
      dispatchAdminDataChanged('blog-changed')
    } catch (err) {
      console.error('Toggle published error:', err)
      toast.error(err?.message || 'Failed to update blog status.')
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-3xl text-[var(--primary)]">Blog</h2>
          <p className="text-sm text-[var(--primary)]/50 mt-1">{blogs.length} blog posts</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setEditingId(null); setForm(INITIAL_FORM); setImageFile(null); setVideoFile(null); setImagePreview(null); setVideoPreview(null); setShowForm(true) }}
          className="btn-luxury-primary flex items-center gap-2 whitespace-nowrap"
        >
          <UploadCloud size={18} strokeWidth={2} />
          Add Blog Post
        </motion.button>
      </motion.div>

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
                  {editingId ? 'Edit' : 'Add'} Blog Post
                </h3>
                <p className="text-[10px] text-[var(--primary)]/50 mt-1">
                  {editingId ? 'Update blog details' : 'Create a new blog post'}
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
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Blog Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                placeholder="Blog title"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
                placeholder="Describe this blog post..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Featured</label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                    className="w-5 h-5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-2"
                  />
                  <span className="text-sm text-[var(--primary)]">Featured post</span>
                </label>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Published</label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                    className="w-5 h-5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-2"
                  />
                  <span className="text-sm text-[var(--primary)]">Published</span>
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Display Order</label>
              <input
                value={form.displayOrder}
                onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) || 0 }))}
                type="number"
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                placeholder="0"
              />
            </div>

            <input ref={imageRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            <input ref={videoRef} type="file" accept="video/*" onChange={handleVideoChange} className="hidden" />

            <div className="grid grid-cols-2 gap-3">
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => imageRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 ${
                  imagePreview ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] bg-[var(--bg)]/30'
                }`}
              >
                {imagePreview ? (
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[var(--primary)]">Blog Image</p>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage() }}
                        className="p-1.5 rounded-lg text-[var(--primary)]/50 hover:bg-[var(--error)]/10 hover:text-[var(--error)] transition"
                      >
                        <X size={14} strokeWidth={1.5} />
                      </motion.button>
                    </div>
                    <img src={imagePreview} alt="Blog preview" className="h-32 w-full object-cover rounded-xl" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <Image size={28} className="text-[var(--accent)]" />
                    <div>
                      <p className="text-sm font-medium text-[var(--primary)]">Click to add image</p>
                      <p className="text-[10px] text-[var(--primary)]/50 mt-1">PNG, JPG, WEBP up to 10MB</p>
                    </div>
                  </div>
                )}
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => videoRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 ${
                  videoPreview ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] bg-[var(--bg)]/30'
                }`}
              >
                {videoPreview ? (
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[var(--primary)]">Blog Video</p>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeVideo() }}
                        className="p-1.5 rounded-lg text-[var(--primary)]/50 hover:bg-[var(--error)]/10 hover:text-[var(--error)] transition"
                      >
                        <X size={14} strokeWidth={1.5} />
                      </motion.button>
                    </div>
                    <video src={videoPreview} className="h-32 w-full object-cover rounded-xl" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <Video size={28} className="text-[var(--accent)]" />
                    <div>
                      <p className="text-sm font-medium text-[var(--primary)]">Click to add video</p>
                      <p className="text-[10px] text-[var(--primary)]/50 mt-1">MP4, WEBM up to 50MB</p>
                    </div>
                  </div>
                )}
              </motion.div>
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
                {loading ? 'Saving...' : editingId ? 'Update Blog' : 'Create Blog'}
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {blogs.map((item, i) => (
          <motion.article
            layout
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="group bg-white rounded-3xl overflow-hidden shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-[var(--bg)] to-[var(--secondary)]/30 flex items-center justify-center text-[var(--primary)]/30">
                  <Image size={40} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/85 via-[var(--primary)]/40 to-transparent opacity-100" />

              {/* Published Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-3 left-3 z-10"
              >
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-widest shadow-lg ${
                  item.published ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'
                }`}>
                  {item.published ? 'Published' : 'Draft'}
                </span>
              </motion.div>

              {/* Quick Actions */}
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => togglePublished(item)}
                  className={`p-2 backdrop-blur-sm rounded-xl shadow-lg ${item.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                  aria-label={item.published ? 'Unpublish blog' : 'Publish blog'}
                  title={item.published ? 'Unpublish' : 'Publish'}
                >
                  <ToggleLeft size={14} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => startEdit(item)}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-[var(--primary)] hover:bg-white shadow-lg"
                  aria-label="Edit blog"
                >
                  <Edit size={14} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setDeleteId(item._id || item.id)}
                  className="p-2 bg-[var(--error)]/90 backdrop-blur-sm rounded-xl text-white hover:bg-[var(--error)] shadow-lg"
                  aria-label="Delete blog"
                >
                  <Trash2 size={14} />
                </motion.button>
              </div>
            </div>

            <div className="p-5 md:p-6 border-t border-[var(--border)]/40 bg-white">
              <h3 className="font-display text-lg text-[var(--primary)] leading-tight line-clamp-1">
                {item.title}
              </h3>
              {item.description && (
                <p className="mt-2 text-sm leading-relaxed text-[var(--primary)]/60 line-clamp-2">
                  {item.description}
                </p>
              )}
              <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest">
                <span className="text-[var(--accent)]">Order: {item.displayOrder}</span>
              </div>
            </div>
          </motion.article>
        ))}

        {blogs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full py-20 text-center"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[var(--secondary)]/30 to-[var(--accent)]/10 flex items-center justify-center mb-4 text-[var(--primary)]/30">
              <UploadCloud size={32} />
            </div>
            <p className="font-display text-xl text-[var(--primary)]/30">No blog posts yet</p>
            <p className="text-sm text-[var(--primary)]/40 mt-2">Click "Add Blog Post" to get started</p>
          </motion.div>
        )}
      </motion.div>

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
              <h3 className="font-display text-xl text-[var(--primary)] text-center mb-2">Delete this blog post?</h3>
              <p className="text-sm text-[var(--primary)]/50 text-center mb-6">This action cannot be undone.</p>
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

export default BlogDashboard