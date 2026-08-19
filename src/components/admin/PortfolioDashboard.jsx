import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, X, Edit, Trash2, Images, Eye, Plus, Loader2, Upload, Star } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { api } from '../../services/api'
import { dispatchAdminDataChanged } from '../../utils/adminEvents'
import { compressImages } from '../../utils/imageCompression'
import { Link } from 'react-router-dom'

const INITIAL_FORM = {
  title: '',
  description: '',
  category: 'General',
  featured: false,
  displayOrder: 0,
  published: true,
}

const MAX_IMAGES = 21

export const PortfolioDashboard = () => {
  const [portfolio, setPortfolio] = useState([])
  const [form, setForm] = useState(INITIAL_FORM)
  const [editingId, setEditingId] = useState(null)
  const [mainImageFile, setMainImageFile] = useState(null)
  const [mainImagePreview, setMainImagePreview] = useState(null)
  const [beforeFiles, setBeforeFiles] = useState([])
  const [beforePreviews, setBeforePreviews] = useState([])
  const [afterFiles, setAfterFiles] = useState([])
  const [afterPreviews, setAfterPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [isDragOverMain, setIsDragOverMain] = useState(false)
  const [isDragOverBefore, setIsDragOverBefore] = useState(false)
  const [isDragOverAfter, setIsDragOverAfter] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const mainFileRef = useRef(null)
  const beforeFileRef = useRef(null)
  const afterFileRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/portfolio')
      const data = Array.isArray(res.data) ? res.data : res.data?.items || []
      setPortfolio(data)
    } catch {
      setPortfolio([])
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const handler = () => { load() }
    window.addEventListener('admin-data-changed', handler)
    return () => window.removeEventListener('admin-data-changed', handler)
  }, [load])

  const resetPreviews = (previews) => {
    previews.forEach((p) => {
      if (p && typeof p === 'string' && p.startsWith('blob:')) {
        URL.revokeObjectURL(p)
      }
    })
  }

  const handleMainFiles = async (files) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (validFiles.length === 0) return
    const compressed = await compressImages([validFiles[0]], { maxWidth: 1920, maxHeight: 1920 })
    if (compressed.length > 0) {
      if (mainImagePreview && mainImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(mainImagePreview)
      }
      setMainImageFile(compressed[0])
      setMainImagePreview(URL.createObjectURL(compressed[0]))
    }
  }

  const handleImageFiles = async (files, setFiles, setPreviews, existingCount) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
    const totalAfter = existingCount + validFiles.length
    if (totalAfter > MAX_IMAGES) {
      const allowed = Math.max(0, MAX_IMAGES - existingCount)
      toast.error(`Maximum ${MAX_IMAGES} images allowed per section. You can add ${allowed} more.`)
      validFiles.splice(allowed)
    }
    if (validFiles.length === 0) return

    const compressed = await compressImages(validFiles, { maxWidth: 1600, maxHeight: 1600 })
    if (compressed.length === 0) return

    setFiles((prev) => {
      const newFiles = [...prev, ...compressed]
      setPreviews((prevPreviews) => {
        const newPreviews = [...prevPreviews]
        compressed.forEach((f) => newPreviews.push(URL.createObjectURL(f)))
        return newPreviews
      })
      return newFiles
    })
  }

  const handleBeforeFiles = (files) => {
    handleImageFiles(files, setBeforeFiles, setBeforePreviews, beforeFiles.filter((f) => f instanceof File).length)
  }

  const handleAfterFiles = (files) => {
    handleImageFiles(files, setAfterFiles, setAfterPreviews, afterFiles.filter((f) => f instanceof File).length)
  }

  const handleMainDrop = (e) => {
    e.preventDefault()
    setIsDragOverMain(false)
    handleMainFiles(e.dataTransfer.files)
  }

  const handleBeforeDrop = (e) => {
    e.preventDefault()
    setIsDragOverBefore(false)
    handleBeforeFiles(e.dataTransfer.files)
  }

  const handleAfterDrop = (e) => {
    e.preventDefault()
    setIsDragOverAfter(false)
    handleAfterFiles(e.dataTransfer.files)
  }

  const handleMainDragOver = (e) => { e.preventDefault(); setIsDragOverMain(true) }
  const handleBeforeDragOver = (e) => { e.preventDefault(); setIsDragOverBefore(true) }
  const handleAfterDragOver = (e) => { e.preventDefault(); setIsDragOverAfter(true) }

  const handleMainDragLeave = () => setIsDragOverMain(false)
  const handleBeforeDragLeave = () => setIsDragOverBefore(false)
  const handleAfterDragLeave = () => setIsDragOverAfter(false)

  const removeMainImage = () => {
    if (mainImagePreview && mainImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(mainImagePreview)
    }
    setMainImageFile(null)
    setMainImagePreview(null)
    if (mainFileRef.current) mainFileRef.current.value = ''
  }

  const removeFileImage = (index, setFiles, setPreviews) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => {
      const newPreviews = [...prev]
      if (newPreviews[index] && newPreviews[index].startsWith('blob:')) {
        URL.revokeObjectURL(newPreviews[index])
      }
      return newPreviews.filter((_, i) => i !== index)
    })
  }

  const removeBeforeImage = (index) => {
    removeFileImage(index, setBeforeFiles, setBeforePreviews)
  }

  const removeAfterImage = (index) => {
    removeFileImage(index, setAfterFiles, setAfterPreviews)
  }

  const startEdit = (item) => {
    setEditingId(item._id || item.id)
    setForm({
      title: item.title,
      description: item.description || '',
      category: item.category || 'General',
      featured: item.featured || false,
      displayOrder: item.displayOrder || 0,
      published: item.published !== undefined ? item.published : true,
    })
    setMainImageFile(item.imageUrl ? { url: item.imageUrl } : null)
    setMainImagePreview(item.imageUrl || null)
    setBeforeFiles(item.beforeImages ? item.beforeImages.map((url) => ({ url })) : [])
    setBeforePreviews(item.beforeImages ? [...item.beforeImages] : [])
    setAfterFiles(item.afterImages ? item.afterImages.map((url) => ({ url })) : [])
    setAfterPreviews(item.afterImages ? [...item.afterImages] : [])
    setShowForm(true)
  }

  const resetForm = () => {
    resetPreviews(beforePreviews)
    resetPreviews(afterPreviews)
    if (mainImagePreview && mainImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(mainImagePreview)
    }
    setEditingId(null)
    setForm(INITIAL_FORM)
    setMainImageFile(null)
    setMainImagePreview(null)
    setBeforeFiles([])
    setBeforePreviews([])
    setAfterFiles([])
    setAfterPreviews([])
    setShowForm(false)
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setUploadProgress(null)

    try {
      const newBeforeFiles = beforeFiles.filter((f) => f instanceof File)
      const newAfterFiles = afterFiles.filter((f) => f instanceof File)
      const totalNewFiles = newBeforeFiles.length + newAfterFiles.length
      let uploaded = 0
      let lastPercent = 0

      const updateProgress = () => {
        uploaded++
        if (totalNewFiles > 0) {
          const percent = Math.round((uploaded / totalNewFiles) * 100)
          if (percent > lastPercent || percent === 100) {
            lastPercent = percent
            setUploadProgress({
              current: uploaded,
              total: totalNewFiles,
              percent,
            })
          }
        }
      }

      const payload = new FormData()
      payload.append('title', form.title)
      if (form.description) payload.append('description', form.description)
      if (form.category) payload.append('category', form.category)
      payload.append('featured', String(form.featured))
      payload.append('displayOrder', String(form.displayOrder || 0))
      payload.append('published', String(form.published))

      if (mainImageFile && mainImageFile instanceof File) {
        payload.append('media', mainImageFile)
      } else if (mainImageFile?.url) {
        payload.append('imageUrl', mainImageFile.url)
      }

      newBeforeFiles.forEach((file) => {
        payload.append('before', file)
      })
      beforeFiles.filter((f) => !(f instanceof File)).forEach((f) => {
        if (f?.url) payload.append('beforeImages', f.url)
      })

      newAfterFiles.forEach((file) => {
        payload.append('after', file)
      })
      afterFiles.filter((f) => !(f instanceof File)).forEach((f) => {
        if (f?.url) payload.append('afterImages', f.url)
      })

      if (editingId) {
        await api.patch(`/admin/portfolio/${editingId}`, payload, {
          onUploadProgress: () => updateProgress(),
        })
      } else {
        await api.post('/admin/portfolio', payload, {
          onUploadProgress: () => updateProgress(),
        })
      }

      updateProgress()
      resetForm()
      load()
      dispatchAdminDataChanged('portfolio-changed')
      if (totalNewFiles > 0) {
        toast.success(`${uploaded}/${totalNewFiles} images uploaded successfully`)
      } else {
        toast.success(editingId ? 'Portfolio project updated successfully.' : 'Portfolio project uploaded successfully.')
      }
    } catch (err) {
      console.error('Submit error:', err)
      toast.error(err?.message || 'Failed to save portfolio project. Please try again.')
    } finally {
      setLoading(false)
      setUploadProgress(null)
    }
  }

  const deleteItem = async () => {
    if (!deleteId) return
    const id = deleteId
    setDeleteId(null)

    setPortfolio((prev) => prev.filter((item) => (item._id || item.id) !== id))

    try {
      await api.delete(`/admin/portfolio/${id}`)
      load()
      dispatchAdminDataChanged('portfolio-changed')
      toast.success('Portfolio project deleted successfully.')
    } catch (err) {
      console.error('Delete error:', err)
      load()
      toast.error(err?.message || 'Failed to delete portfolio project.')
    }
  }

  const renderMainImageSection = () => (
    <div className="space-y-2">
      <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70 flex items-center gap-2">
        <Images size={14} strokeWidth={1.5} />
        Main Project Image <span className="text-[var(--error)]">*</span>
      </label>
      <input ref={mainFileRef} type="file" accept="image/*" onChange={(e) => handleMainFiles(e.target.files)} className="hidden" />
      <motion.div
        whileHover={{ scale: 1.01 }}
        onDrop={handleMainDrop}
        onDragOver={handleMainDragOver}
        onDragLeave={handleMainDragLeave}
        onClick={() => mainFileRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 ${
          isDragOverMain ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] bg-[var(--bg)]/30'
        }`}
      >
        {mainImagePreview ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--primary)]">Main Image</p>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => mainFileRef.current?.click()}
                className="text-xs text-[var(--accent)] hover:text-[var(--primary)] font-medium"
              >
                Replace
              </motion.button>
            </div>
            <div className="relative rounded-xl overflow-hidden group">
              <img
                src={mainImagePreview}
                alt="Preview"
                className="h-40 w-full object-contain bg-[var(--secondary)]/10"
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={(e) => { e.stopPropagation(); removeMainImage() }}
                className="absolute top-2 right-2 bg-[var(--primary)]/90 backdrop-blur-sm text-white p-2 rounded-full hover:bg-[var(--primary)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-8">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent)]/10 to-[var(--secondary)]/10 flex items-center justify-center text-[var(--accent)]"
            >
              <UploadCloud size={28} />
            </motion.div>
            <div>
              <p className="text-sm font-medium text-[var(--primary)]">Drop image here or click to browse</p>
              <p className="text-[10px] text-[var(--primary)]/50 mt-1">PNG, JPG, WebP up to 10MB (exactly 1)</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )

  const renderImageSection = (
    title,
    files,
    previews,
    setFiles,
    setPreviews,
    handleFiles,
    removeFn,
    fileRef,
    isDragOver,
    setIsDragOver,
    dragOverHandler,
    dragLeaveHandler,
    dropHandler,
  ) => (
    <div className="space-y-2">
      <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70 flex items-center gap-2">
        <Images size={14} strokeWidth={1.5} />
        {title} (<span className="text-[var(--accent)]">{previews.length}</span>/{MAX_IMAGES})
      </label>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
      <motion.div
        whileHover={{ scale: 1.01 }}
        onDrop={dropHandler}
        onDragOver={dragOverHandler}
        onDragLeave={dragLeaveHandler}
        onClick={() => fileRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 ${
          isDragOver ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] bg-[var(--bg)]/30'
        }`}
      >
        {previews.length > 0 ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--primary)]">{previews.length} image{previews.length !== 1 ? 's' : ''} selected</p>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs text-[var(--accent)] hover:text-[var(--primary)] font-medium"
              >
                Add More
              </motion.button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {previews.map((src, i) => {
                return (
                  <div key={i} className="relative rounded-xl overflow-hidden group">
                    <img
                      src={src}
                      alt={`Preview ${i + 1}`}
                      className="h-20 w-full object-contain bg-[var(--secondary)]/10"
                      loading="lazy"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeFn(i) }}
                      className="absolute top-1 right-1 bg-[var(--primary)]/90 backdrop-blur-sm text-white p-1.5 rounded-full hover:bg-[var(--primary)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </motion.button>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-8">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent)]/10 to-[var(--secondary)]/10 flex items-center justify-center text-[var(--accent)]"
            >
              <UploadCloud size={28} />
            </motion.div>
            <div>
              <p className="text-sm font-medium text-[var(--primary)]">Drop images here or click to browse</p>
              <p className="text-[10px] text-[var(--primary)]/50 mt-1">PNG, JPG, WebP up to 10MB each (max {MAX_IMAGES})</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-3xl text-[var(--primary)]">Portfolio</h2>
          <p className="text-sm text-[var(--primary)]/50 mt-1">{portfolio.length} projects</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="btn-luxury-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={18} strokeWidth={2} />
          Add Portfolio Project
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
            className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)] space-y-5 mb-6 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl text-[var(--primary)]">
                  {editingId ? 'Edit' : 'Add'} Portfolio Project
                </h3>
                <p className="text-[10px] text-[var(--primary)]/50 mt-1">
                  {editingId ? 'Update project details' : 'Create a new portfolio project'}
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
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Project Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                placeholder="Project title"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
                placeholder="Describe this portfolio piece..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Category</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                  placeholder="e.g. Residential, Commercial"
                />
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
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-2"
                />
                <span className="text-sm text-[var(--primary)]">Featured in homepage hero</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-2"
                />
                <span className="text-sm text-[var(--primary)]">Published (visible on site)</span>
              </label>
            </div>

            {renderMainImageSection()}

            {renderImageSection(
              'Before Images',
              beforeFiles,
              beforePreviews,
              setBeforeFiles,
              setBeforePreviews,
              handleBeforeFiles,
              removeBeforeImage,
              beforeFileRef,
              isDragOverBefore,
              setIsDragOverBefore,
              handleBeforeDragOver,
              handleBeforeDragLeave,
              handleBeforeDrop,
            )}

            {renderImageSection(
              'After Images',
              afterFiles,
              afterPreviews,
              setAfterFiles,
              setAfterPreviews,
              handleAfterFiles,
              removeAfterImage,
              afterFileRef,
              isDragOverAfter,
              setIsDragOverAfter,
              handleAfterDragOver,
              handleAfterDragLeave,
              handleAfterDrop,
            )}

            {uploadProgress && uploadProgress.total > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--primary)]/70 flex items-center gap-2">
                    <Upload size={14} className="animate-bounce" />
                    Uploading {uploadProgress.current}/{uploadProgress.total} images
                  </span>
                  <span className="text-xs text-[var(--primary)]/50">{uploadProgress.percent}%</span>
                </div>
                <div className="w-full bg-[var(--border)]/30 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="bg-[var(--accent)] h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress.percent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

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
                className="flex-1 rounded-full bg-[var(--primary)] text-white py-3 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={loading}
                type="submit"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? 'Saving...' : editingId ? 'Update Project' : 'Upload Project'}
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
        {portfolio.map((item, i) => {
          const previewUrl = item.imageUrl || item.beforeImages?.[0] || item.afterImages?.[0] || null
          const imageCount = (item.beforeImages?.length || 0) + (item.afterImages?.length || 0)

          return (
            <motion.article
              layout
              key={item._id || item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="group bg-white rounded-3xl overflow-hidden shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={item.title}
                    className="h-full w-full object-contain transition duration-700 group-hover:scale-105 bg-[var(--secondary)]/10"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-[var(--bg)] to-[var(--secondary)]/30 flex items-center justify-center text-[var(--primary)]/30">
                    <Images size={40} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/85 via-[var(--primary)]/40 to-transparent opacity-100" />

                {item.featured && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-3 left-3 z-10"
                  >
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] text-white text-[10px] font-semibold uppercase tracking-widest rounded-full shadow-lg">
                      <Star size={10} strokeWidth={2} />
                      Featured
                    </span>
                  </motion.div>
                )}

                {imageCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-3 right-3 z-10"
                  >
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)]/90 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-widest rounded-full shadow-lg">
                      <Images size={10} strokeWidth={2} />
                      {imageCount} photos
                    </span>
                  </motion.div>
                )}

                <Link
                  to={`/portfolio/${item._id || item.id}`}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 btn-luxury-primary group flex items-center gap-2 text-[10px] px-5 py-2.5 rounded-full opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
                >
                  View Project
                  <Eye size={12} strokeWidth={1.5} className="transition-transform duration-300 group-hover:scale-110" />
                </Link>

                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => startEdit(item)}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-[var(--primary)] hover:bg-white shadow-lg"
                    aria-label="Edit project"
                  >
                    <Edit size={14} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setDeleteId(item._id || item.id)}
                    className="p-2 bg-[var(--error)]/90 backdrop-blur-sm rounded-xl text-white hover:bg-[var(--error)] shadow-lg"
                    aria-label="Delete project"
                  >
                    <Trash2 size={14} />
                  </motion.button>
                </div>
              </div>

              <div className="p-5 md:p-6 border-t border-[var(--border)]/40 bg-white">
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="font-display text-xl md:text-2xl font-normal text-[var(--primary)] leading-tight"
                >
                  {item.title}
                </motion.h3>
                {imageCount > 0 && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 }}
                    className="mt-2 text-sm leading-relaxed text-[var(--primary)]/60"
                  >
                    {imageCount} image{imageCount > 1 ? 's' : ''}
                  </motion.p>
                )}
              </div>
            </motion.article>
          )
        })}

        {portfolio.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full py-20 text-center"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[var(--secondary)]/30 to-[var(--accent)]/10 flex items-center justify-center mb-4 text-[var(--primary)]/30">
              <Images size={32} />
            </div>
            <p className="font-display text-xl text-[var(--primary)]/30">No portfolio projects yet</p>
            <p className="text-sm text-[var(--primary)]/40 mt-2">Click "Add Portfolio Project" to get started</p>
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
              <h3 className="font-display text-xl text-[var(--primary)] text-center mb-2">Delete this portfolio project?</h3>
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

export default PortfolioDashboard
