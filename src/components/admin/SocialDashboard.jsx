import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Edit,
  Trash2,
  Plus,
  GripVertical,
  Image as ImageIcon,
  Save,
  ArrowUp,
  ArrowDown,
  Globe,
  Link as LinkIcon,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { api } from '../../services/api'
import { dispatchAdminDataChanged } from '../../utils/adminEvents'

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', color: '#E4405F' },
  { key: 'facebook', label: 'Facebook', color: '#1877F2' },
  { key: 'tiktok', label: 'TikTok', color: '#000000' },
  { key: 'pinterest', label: 'Pinterest', color: '#BD081C' },
  { key: 'youtube', label: 'YouTube', color: '#FF0000' },
  { key: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
  { key: 'whatsapp', label: 'WhatsApp', color: '#25D366' },
  { key: 'x', label: 'X (Twitter)', color: '#000000' },
  { key: 'threads', label: 'Threads', color: '#000000' },
  { key: 'custom', label: 'Custom', color: '#666666' },
]

const INITIAL_ITEM = {
  name: '',
  platform: 'instagram',
  link: '',
  displayOrder: 0,
  isActive: true,
}

export const SocialDashboard = () => {
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(INITIAL_ITEM)
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [dragId, setDragId] = useState(null)
  const fileRef = useRef(null)

  const loadItems = useCallback(async () => {
    try {
      const res = await api.get('/admin/socials')
      setItems(Array.isArray(res.data) ? res.data : [])
    } catch {
      setItems([])
    }
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  useEffect(() => {
    const handler = () => { loadItems() }
    window.addEventListener('admin-data-changed', handler)
    return () => window.removeEventListener('admin-data-changed', handler)
  }, [loadItems])

  const resetForm = () => {
    setEditingId(null)
    setForm(INITIAL_ITEM)
    setPreview(null)
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const openAdd = () => {
    resetForm()
    setForm((f) => ({ ...f, displayOrder: items.length }))
    setShowForm(true)
  }

  const openEdit = (item) => {
    setEditingId(item.id)
    setForm({
      name: item.name || '',
      platform: item.platform || 'instagram',
      link: item.link || '',
      displayOrder: item.displayOrder || 0,
      isActive: item.isActive !== false,
    })
    setPreview(item.imageUrl || null)
    setFile(null)
    setShowForm(true)
  }

  const handleFile = (e) => {
    const f = e.target.files?.[0] || null
    setFile(f)
    if (f?.type?.startsWith('image/')) {
      setPreview(URL.createObjectURL(f))
    } else {
      setPreview(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.link) {
      toast.error('Name and link are required.')
      return
    }
    try {
      new URL(form.link)
    } catch {
      toast.error('Please enter a valid URL (including https://).')
      return
    }
    setSubmitting(true)
    try {
      const payload = new FormData()
      payload.append('name', form.name)
      payload.append('platform', form.platform)
      payload.append('link', form.link)
      payload.append('displayOrder', String(form.displayOrder || 0))
      payload.append('isActive', String(form.isActive))
      if (file) payload.append('image', file)

      if (editingId) {
        await api.patch(`/admin/socials/${editingId}`, payload)
        toast.success('Social item updated successfully.')
      } else {
        await api.post('/admin/socials', payload)
        toast.success('Social item created successfully.')
      }
      resetForm()
      setShowForm(false)
      await loadItems()
      dispatchAdminDataChanged('socials-changed')
    } catch (err) {
      toast.error(err?.message || 'Failed to save social item.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/socials/${id}`)
      await loadItems()
      dispatchAdminDataChanged('socials-changed')
      toast.success('Social item deleted successfully.')
    } catch (err) {
      toast.error(err?.message || 'Failed to delete social item.')
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
    const draggedIndex = items.findIndex((item) => item.id === dragId)
    const targetIndex = items.findIndex((item) => item.id === targetId)
    if (draggedIndex === -1 || targetIndex === -1) {
      setDragId(null)
      return
    }
    const newItems = [...items]
    const [dragged] = newItems.splice(draggedIndex, 1)
    newItems.splice(targetIndex, 0, dragged)
    const orders = newItems.map((item, idx) => ({ id: item.id, displayOrder: idx }))
    try {
      await api.patch('/admin/socials/reorder', { orders })
      await loadItems()
      dispatchAdminDataChanged('socials-changed')
      toast.success('Social items reordered successfully.')
    } catch (err) {
      toast.error(err?.message || 'Failed to reorder social items.')
    }
    setDragId(null)
  }

  const moveItem = async (index, direction) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= items.length) return
    const updated = [...items]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    const orders = updated.map((item, i) => ({ id: item.id, displayOrder: i }))
    try {
      await api.patch('/admin/socials/reorder', { orders })
      await loadItems()
      dispatchAdminDataChanged('socials-changed')
      toast.success('Order updated.')
    } catch (err) {
      toast.error(err?.message || 'Failed to reorder.')
    }
  }

  const platformLabel = (key) => PLATFORMS.find((p) => p.key === key)?.label || key
  const platformColor = (key) => PLATFORMS.find((p) => p.key === key)?.color || '#666666'

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-3xl text-[var(--primary)]">Social Dashboard</h2>
          <p className="text-sm text-[var(--primary)]/50 mt-1">Manage social media items for homepage and footer</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openAdd}
          className="btn-luxury-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={18} strokeWidth={2} />
          Add Social Item
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)]"
      >
        {items.length === 0 ? (
          <div className="py-20 text-center">
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--secondary)]/40 to-[var(--accent)]/10 animate-pulse" />
              <div className="relative w-full h-full flex items-center justify-center">
                <Globe size={32} className="text-[var(--primary)]/40" />
              </div>
            </div>
            <p className="font-display text-xl text-[var(--primary)]/30 mb-1">No social items yet</p>
            <p className="text-sm text-[var(--primary)]/40">Click "Add Social Item" to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, item.id)}
                  className={`relative group rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-move ${
                    dragId === item.id ? 'border-[var(--accent)] opacity-50' : 'border-[var(--border)]'
                  } ${!item.isActive ? 'opacity-60' : ''}`}
                >
                  <div className="aspect-square relative bg-[var(--bg)]">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <div
                          className="w-20 h-20 rounded-full flex items-center justify-center text-white font-display text-2xl font-semibold"
                          style={{ backgroundColor: platformColor(item.platform) }}
                        >
                          {item.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      </div>
                    )}
                    {!item.isActive && (
                      <div className="absolute inset-0 bg-[var(--primary)]/40 flex items-center justify-center">
                        <span className="text-white text-[10px] font-semibold uppercase tracking-widest">Inactive</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-white">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-display text-lg text-[var(--primary)] truncate">{item.name}</h4>
                      <span
                        className="text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${platformColor(item.platform)}15`,
                          color: platformColor(item.platform),
                        }}
                      >
                        {platformLabel(item.platform)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--primary)]/50 truncate flex items-center gap-1">
                      <LinkIcon size={10} />
                      {item.link}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveItem(index, -1)}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30 disabled:opacity-30"
                          aria-label="Move up"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(index, 1)}
                          disabled={index === items.length - 1}
                          className="p-1.5 rounded-lg text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30 disabled:opacity-30"
                          aria-label="Move down"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded-lg text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)]"
                          aria-label="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg text-[var(--error)]/70 hover:bg-[var(--error)]/10"
                          aria-label="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical size={16} className="text-white/80 drop-shadow" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-[var(--primary)]/40 backdrop-blur-sm" onClick={() => { setShowForm(false); resetForm() }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-[0_30px_80px_rgba(0,0,0,0.2)] max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-display text-xl text-[var(--primary)]">
                    {editingId ? 'Edit Social Item' : 'Add Social Item'}
                  </h3>
                  <p className="text-[10px] text-[var(--primary)]/50 mt-1">
                    {editingId ? 'Update social media item details' : 'Create a new social media item'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm() }}
                  className="p-2 rounded-xl text-[var(--primary)]/50 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)] transition"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                    placeholder="Instagram"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Platform</label>
                  <select
                    value={form.platform}
                    onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12 cursor-pointer"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p.key} value={p.key}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Link URL</label>
                  <input
                    value={form.link}
                    onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                    placeholder="https://instagram.com/yourhandle"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Image / Icon Upload</label>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                  {preview ? (
                    <div className="relative rounded-xl overflow-hidden">
                      <img src={preview} alt="Preview" className="h-40 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = '' }}
                        className="absolute top-2 right-2 bg-[var(--primary)]/90 backdrop-blur-sm text-white p-2 rounded-full hover:bg-[var(--primary)] shadow-lg"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-[var(--border)] rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[var(--accent)] transition-colors h-40"
                    >
                      <ImageIcon size={28} className="text-[var(--primary)]/30" />
                      <p className="text-xs text-[var(--primary)]/50">Click to upload image</p>
                    </motion.div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Display Order</label>
                    <input
                      type="number"
                      value={form.displayOrder}
                      onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) || 0 }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Active</label>
                    <label className="flex items-center gap-2 cursor-pointer h-12">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                        className="w-5 h-5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-2"
                      />
                      <span className="text-sm text-[var(--primary)]">Visible on site</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => { setShowForm(false); resetForm() }}
                    className="flex-1 rounded-full border border-[var(--border)] bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-full bg-[var(--primary)] text-white py-3 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting && <Save size={14} className="animate-pulse" />}
                    {submitting ? 'Saving...' : editingId ? 'Update Item' : 'Add Item'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SocialDashboard
