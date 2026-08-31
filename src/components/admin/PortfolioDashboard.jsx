import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import { UploadCloud, X, Edit, Trash2, Images, Eye, Plus, Loader2, Upload, Star, Check, RefreshCw, WifiOff, GripVertical, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { api } from '../../services/api'
import { dispatchAdminDataChanged } from '../../utils/adminEvents'
import { compressImages } from '../../utils/imageCompression'
import { uploadPortfolioImages, uploadSingleImage, validateImageFile } from '../../services/portfolioUploadService'
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
   const [uploadImageStates, setUploadImageStates] = useState([])
   const [isUploadingImages, setIsUploadingImages] = useState(false)
   const [uploadOverallProgress, setUploadOverallProgress] = useState(0)
   const [deleteId, setDeleteId] = useState(null)
   const [isDragOverMain, setIsDragOverMain] = useState(false)
   const [isDragOverBefore, setIsDragOverBefore] = useState(false)
   const [isDragOverAfter, setIsDragOverAfter] = useState(false)
   const [showForm, setShowForm] = useState(false)
   const [beforeOrderChanged, setBeforeOrderChanged] = useState(false)
   const [afterOrderChanged, setAfterOrderChanged] = useState(false)
    const [isReorderSaving, setIsReorderSaving] = useState(false)
    const [reorderDirty, setReorderDirty] = useState(false)
   const [isOffline, setIsOffline] = useState(!navigator.onLine)
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
    const goOnline = () => {
      setIsOffline(false)
      toast.success('Connection restored. Resuming uploads...')
    }
    const goOffline = () => {
      setIsOffline(true)
      toast.error('You are offline. Uploads are paused.')
    }
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('admin-data-changed', handler)
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [load])

  const handleReorder = useCallback((newOrder) => {
    setPortfolio(newOrder)
    setReorderDirty(true)
  }, [])

  const moveItem = useCallback((index, direction) => {
    setPortfolio((prev) => {
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(index, 1)
      next.splice(target, 0, moved)
      return next
    })
    setReorderDirty(true)
  }, [])

  const saveOrder = useCallback(async () => {
    if (isReorderSaving) return
    const snapshot = portfolio
    setIsReorderSaving(true)
    try {
      const payload = {
        projects: portfolio.map((p, i) => ({ id: p._id || p.id, displayOrder: i })),
      }
      const res = await api.put('/admin/portfolio/reorder', payload)
      if (res.data?.success || res.data) {
        setReorderDirty(false)
        toast.success('Order saved ✓')
        dispatchAdminDataChanged('portfolio-changed')
      }
      await load()
    } catch (err) {
      console.error('[portfolio] reorder save error:', err)
      toast.error(err?.message || 'Unable to save portfolio order. Your previous order has been restored.')
      // Restore the previous order from the server.
      setPortfolio(snapshot)
      await load()
    } finally {
      setIsReorderSaving(false)
    }
  }, [portfolio, isReorderSaving, load])

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
    // Count the images that already exist for this project (they are stored as
    // { id, url } objects, NOT File instances) so the remaining capacity is
    // calculated against the true current total.
    const existingCount = beforeFiles.filter((f) => !(f instanceof File)).length
    handleImageFiles(files, setBeforeFiles, setBeforePreviews, existingCount)
  }

  const handleAfterFiles = (files) => {
    const existingCount = afterFiles.filter((f) => !(f instanceof File)).length
    handleImageFiles(files, setAfterFiles, setAfterPreviews, existingCount)
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

    const beforePortfolioImages = (item.portfolioImages || []).filter((img) => img.imageType === 'before')
    setBeforeFiles(
      beforePortfolioImages.length > 0
        ? beforePortfolioImages.map((img) => ({ id: img.id, url: img.imageUrl }))
        : (item.beforeImages || []).map((url) => ({ url })),
    )
    setBeforePreviews(
      beforePortfolioImages.length > 0
        ? beforePortfolioImages.map((img) => img.imageUrl)
        : [...(item.beforeImages || [])],
    )

    const afterPortfolioImages = (item.portfolioImages || []).filter((img) => img.imageType === 'after')
    setAfterFiles(
      afterPortfolioImages.length > 0
        ? afterPortfolioImages.map((img) => ({ id: img.id, url: img.imageUrl }))
        : (item.afterImages || []).map((url) => ({ url })),
    )
    setAfterPreviews(
      afterPortfolioImages.length > 0
        ? afterPortfolioImages.map((img) => img.imageUrl)
        : [...(item.afterImages || [])],
    )

    setShowForm(true)
    setBeforeOrderChanged(false)
    setAfterOrderChanged(false)
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

  const updateUploadImageState = (id, updates) => {
    setUploadImageStates((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    )
  }

  const retryFailedImage = useCallback(async (imageState) => {
    const { file, id, imageType } = imageState
    const formData = new FormData()
    formData.append('media', file)
    formData.append('folder', `portfolio/${imageType}`)

    updateUploadImageState(id, { status: 'retrying', error: null, retries: (imageState.retries || 0) + 1 })

    try {
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
        onUploadProgress: (e) => {
          if (e.total > 0) {
            const percent = (e.loaded / e.total) * 100
            updateUploadImageState(id, { progress: percent })
          }
        },
      })

      const url = res.data?.url
      updateUploadImageState(id, { status: 'completed', progress: 100, url, error: null })
      toast.success(`Image "${file?.name}" uploaded successfully`)
      return url
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Upload failed'
      updateUploadImageState(id, { status: 'failed', error: errorMsg })
      toast.error(`Image "${file?.name}" failed: ${errorMsg}`)
      return null
    }
  }, [])

  const uploadWithProgress = async (files, imageType, overallStartPercent, overallEndPercent) => {
    if (files.length === 0) {
      return { successful: [], failed: [] }
    }

    const initialStates = files.map((file, idx) => ({
      id: `${imageType}-${Date.now()}-${idx}`,
      file,
      fileName: file.name,
      imageType,
      status: 'pending',
      progress: 0,
      error: null,
      url: null,
      retries: 0,
    }))
    setUploadImageStates((prev) => [...prev, ...initialStates])

    const results = await uploadPortfolioImages(files, imageType, {
      onImageProgress: (idx, percent, _fileName, status) => {
        if (idx !== null && initialStates[idx]) {
          updateUploadImageState(initialStates[idx].id, { progress: percent, status: status || 'uploading' })
        }
      },
      onOverallProgress: (percent) => {
        setUploadOverallProgress(overallStartPercent + (percent / 100) * (overallEndPercent - overallStartPercent))
      },
    })

    const successful = []
    const failed = []

    results.successful.forEach((result) => {
      successful.push(result)
      const idx = result.index
      updateUploadImageState(initialStates[idx]?.id, { status: 'completed', progress: 100, url: result.url })
    })

    results.failed.forEach((result) => {
      failed.push(result)
      const idx = result.index
      updateUploadImageState(initialStates[idx]?.id, { status: 'failed', error: result.error?.message || 'Upload failed' })
    })

    return { successful, failed }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (loading || isUploadingImages) return
    setLoading(true)
    setUploadOverallProgress(0)
    setUploadImageStates([])

    try {
      const newBeforeFiles = beforeFiles.filter((f) => f instanceof File)
      const newAfterFiles = afterFiles.filter((f) => f instanceof File)

      const totalNewFiles = newBeforeFiles.length + newAfterFiles.length

      if (totalNewFiles > 0) {
        setIsUploadingImages(true)

        const validationErrors = []
        newBeforeFiles.forEach((f, i) => {
          const errors = validateImageFile(f)
          if (errors.length > 0) validationErrors.push(`Before image ${i + 1} ("${f.name}"): ${errors.join(', ')}`)
        })
        newAfterFiles.forEach((f, i) => {
          const errors = validateImageFile(f)
          if (errors.length > 0) validationErrors.push(`After image ${i + 1} ("${f.name}"): ${errors.join(', ')}`)
        })
        if (validationErrors.length > 0) {
          validationErrors.forEach((err) => toast.error(err))
          throw new Error('Some images failed validation')
        }

        const compressedBefore = newBeforeFiles.length > 0
          ? await compressImages(newBeforeFiles, { maxWidth: 1920, maxHeight: 1920, quality: 0.82 })
          : []
        const compressedAfter = newAfterFiles.length > 0
          ? await compressImages(newAfterFiles, { maxWidth: 1920, maxHeight: 1920, quality: 0.82 })
          : []

        const beforeResult = await uploadWithProgress(
          compressedBefore,
          'before',
          0,
          totalNewFiles > 0 ? 50 : 0,
        )

        const afterResult = await uploadWithProgress(
          compressedAfter,
          'after',
          totalNewFiles > 0 ? 50 : 0,
          100,
        )

        const allSuccessful = [...beforeResult.successful, ...afterResult.successful]
        const allFailed = [...beforeResult.failed, ...afterResult.failed]

        if (allFailed.length > 0) {
          allFailed.forEach((f) => {
            const msg = f.error?.message || f.error || 'Upload failed'
            toast.error(`Failed: ${f.file?.name || 'unknown'} — ${msg}`)
          })
        }

        if (allSuccessful.length === 0 && allFailed.length > 0) {
          throw new Error(`Failed to upload ${allFailed.length} image(s). See details above.`)
        }

        const uploadedBeforeUrls = compressedBefore
          .map((f, idx) => {
            const res = beforeResult.successful.find((r) => r.index === idx)
            return res?.url
          })
          .filter(Boolean)
        const uploadedAfterUrls = compressedAfter
          .map((f, idx) => {
            const res = afterResult.successful.find((r) => r.index === idx)
            return res?.url
          })
          .filter(Boolean)

        const existingBeforeUrls = beforeFiles
          .filter((f) => !(f instanceof File))
          .map((f) => (typeof f === 'string' ? f : f?.url))
          .filter(Boolean)
        const existingAfterUrls = afterFiles
          .filter((f) => !(f instanceof File))
          .map((f) => (typeof f === 'string' ? f : f?.url))
          .filter(Boolean)

        const finalBeforeUrls = [...existingBeforeUrls, ...uploadedBeforeUrls]
        const finalAfterUrls = [...existingAfterUrls, ...uploadedAfterUrls]

        if (finalBeforeUrls.length > MAX_IMAGES) {
          throw new Error(`Before images exceed limit of ${MAX_IMAGES}`)
        }
        if (finalAfterUrls.length > MAX_IMAGES) {
          throw new Error(`After images exceed limit of ${MAX_IMAGES}`)
        }

        const payload = new FormData()
        payload.append('title', form.title)
        if (form.description) payload.append('description', form.description)
        if (form.category) payload.append('category', form.category)
        payload.append('featured', String(form.featured))
        payload.append('displayOrder', String(form.displayOrder || 0))
        payload.append('published', String(form.published))

        if (mainImageFile && mainImageFile instanceof File) {
          const mainUploaded = await uploadSingleImage(mainImageFile, 'portfolio', {
            signal: null,
            maxRetries: 3,
            onProgress: () => {
            },
            onStateChange: () => {
            },
          })
          payload.append('imageUrl', mainUploaded.url)
          payload.append('cloudinaryId', mainUploaded.path)
        } else if (mainImageFile?.url) {
          payload.append('imageUrl', mainImageFile.url)
        }

        if (finalBeforeUrls.length === 0) payload.append('beforeImages', '')
        else finalBeforeUrls.forEach((url) => payload.append('beforeImages', url))
        if (finalAfterUrls.length === 0) payload.append('afterImages', '')
        else finalAfterUrls.forEach((url) => payload.append('afterImages', url))

        const portfolioRes = editingId
          ? await api.patch(`/admin/portfolio/${editingId}`, payload)
          : await api.post('/admin/portfolio', payload)

        let orderSaved = false
        if (editingId && (beforeOrderChanged || afterOrderChanged)) {
          const freshItem = portfolioRes.data

          const newBeforeBlobUrls = beforePreviews.filter(
            (p) => typeof p === 'string' && p.startsWith('blob:'),
          )
          const newAfterBlobUrls = afterPreviews.filter(
            (p) => typeof p === 'string' && p.startsWith('blob:'),
          )

          const newBeforeCloudinaryUrls = (freshItem.beforeImages || []).slice(
            -newBeforeBlobUrls.length,
          )
          const newAfterCloudinaryUrls = (freshItem.afterImages || []).slice(
            -newAfterBlobUrls.length,
          )

          const blobToCloudinaryBefore = new Map()
          newBeforeBlobUrls.forEach((blobUrl, idx) => {
            if (newBeforeCloudinaryUrls[idx]) {
              blobToCloudinaryBefore.set(blobUrl, newBeforeCloudinaryUrls[idx])
            }
          })

          const blobToCloudinaryAfter = new Map()
          newAfterBlobUrls.forEach((blobUrl, idx) => {
            if (newAfterCloudinaryUrls[idx]) {
              blobToCloudinaryAfter.set(blobUrl, newAfterCloudinaryUrls[idx])
            }
          })

          const freshBeforeMap = new Map(
            (freshItem.portfolioImages || [])
              .filter((img) => img.imageType === 'before')
              .map((img) => [img.imageUrl, img]),
          )
          const freshAfterMap = new Map(
            (freshItem.portfolioImages || [])
              .filter((img) => img.imageType === 'after')
              .map((img) => [img.imageUrl, img]),
          )

          const buildOrderList = (previews, imageType, freshMap, blobMap) => {
            return previews.map((preview, idx) => {
              let url = typeof preview === 'string' ? preview : preview?.url
              if (!url) return null
              if (blobMap.has(url)) {
                url = blobMap.get(url)
              }
              const freshImg = freshMap.get(url)
              return {
                id: freshImg?.id,
                imageUrl: url,
                imageType,
                sortOrder: idx,
              }
            })
          }

          const beforeOrder = buildOrderList(beforePreviews, 'before', freshBeforeMap, blobToCloudinaryBefore)
          const afterOrder = buildOrderList(afterPreviews, 'after', freshAfterMap, blobToCloudinaryAfter)

          await saveImageOrder(beforeOrder, afterOrder)
          orderSaved = true
        }

        resetForm()
        load()
        dispatchAdminDataChanged('portfolio-changed')
        if (totalNewFiles > 0) {
          const successCount = allSuccessful.length
          const failCount = allFailed.length
          if (failCount > 0) {
            toast.success(`${successCount}/${totalNewFiles} images uploaded successfully. ${failCount} failed.`)
          } else {
            toast.success(`${successCount}/${totalNewFiles} images uploaded successfully`)
          }
        } else {
          toast.success(editingId ? 'Portfolio project updated successfully.' : 'Portfolio project created successfully.')
        }
        if (orderSaved) {
          toast.success('Image order saved')
        }
      } else {
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

        const existingBeforeUrls = beforeFiles
          .filter((f) => !(f instanceof File))
          .map((f) => (typeof f === 'string' ? f : f?.url))
          .filter(Boolean)
        const existingAfterUrls = afterFiles
          .filter((f) => !(f instanceof File))
          .map((f) => (typeof f === 'string' ? f : f?.url))
          .filter(Boolean)

        if (existingBeforeUrls.length === 0) payload.append('beforeImages', '')
        else existingBeforeUrls.forEach((url) => payload.append('beforeImages', url))
        if (existingAfterUrls.length === 0) payload.append('afterImages', '')
        else existingAfterUrls.forEach((url) => payload.append('afterImages', url))

        const portfolioRes = editingId
          ? await api.patch(`/admin/portfolio/${editingId}`, payload)
          : await api.post('/admin/portfolio', payload)

        if (editingId && (beforeOrderChanged || afterOrderChanged)) {
          const freshItem = portfolioRes.data
          const freshBeforeMap = new Map(
            (freshItem.portfolioImages || [])
              .filter((img) => img.imageType === 'before')
              .map((img) => [img.imageUrl, img]),
          )
          const freshAfterMap = new Map(
            (freshItem.portfolioImages || [])
              .filter((img) => img.imageType === 'after')
              .map((img) => [img.imageUrl, img]),
          )

          const buildOrderList = (previews, imageType, freshMap) => {
            return previews.map((preview, idx) => {
              const url = typeof preview === 'string' ? preview : preview?.url
              const freshImg = freshMap.get(url)
              return {
                id: freshImg?.id,
                imageUrl: url,
                imageType,
                sortOrder: idx,
              }
            })
          }

          const beforeOrder = buildOrderList(beforePreviews, 'before', freshBeforeMap)
          const afterOrder = buildOrderList(afterPreviews, 'after', freshAfterMap)

          await saveImageOrder(beforeOrder, afterOrder)
        }

        resetForm()
        load()
        dispatchAdminDataChanged('portfolio-changed')
        toast.success(editingId ? 'Portfolio project updated successfully.' : 'Portfolio project created successfully.')
      }
    } catch (err) {
      console.error('Submit error:', err)
      toast.error(err?.message || 'Failed to save portfolio project. Please try again.')
    } finally {
      setLoading(false)
      setIsUploadingImages(false)
      setUploadOverallProgress(0)
      setUploadImageStates([])
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

  const saveImageOrder = useCallback(async (newBeforeOrder, newAfterOrder) => {
    if (!editingId) return
    if (isReorderSaving) return
    setIsReorderSaving(true)
    try {
      const payload = {
        before: newBeforeOrder.map((item, idx) => ({
          id: item?.id || undefined,
          imageUrl: item?.imageUrl,
          imageType: 'before',
          sortOrder: idx,
        })),
        after: newAfterOrder.map((item, idx) => ({
          id: item?.id || undefined,
          imageUrl: item?.imageUrl,
          imageType: 'after',
          sortOrder: idx,
        })),
      }
      const res = await api.put(`/admin/portfolio/${editingId}/images/order`, payload)
      if (res.data?.success || res.data?.data) {
        const updated = res.data.data || res.data
        setBeforePreviews(updated.beforeImages || newBeforeOrder.map((f) => f?.imageUrl).filter(Boolean))
        setAfterPreviews(updated.afterImages || newAfterOrder.map((f) => f?.imageUrl).filter(Boolean))
        setBeforeOrderChanged(false)
        setAfterOrderChanged(false)
        toast.success('Image order saved')
        dispatchAdminDataChanged('portfolio-changed')
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to save image order')
      const savedBefore = portfolio.find((p) => (p._id || p.id) === editingId)
      if (savedBefore) {
        setBeforePreviews([...(savedBefore.beforeImages || [])])
        setAfterPreviews([...(savedBefore.afterImages || [])])
      }
      setBeforeOrderChanged(false)
      setAfterOrderChanged(false)
    } finally {
      setIsReorderSaving(false)
    }
  }, [editingId, isReorderSaving, portfolio])

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
    orderChanged,
    setOrderChanged,
  ) => (
    <div className="space-y-2">
      <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70 flex items-center gap-2">
        <Images size={14} strokeWidth={1.5} />
        {title} (<span className="text-[var(--accent)]">{previews.length}</span>/{MAX_IMAGES})
        <span className="text-[var(--primary)]/40">· {Math.max(0, MAX_IMAGES - previews.length)} slots remaining</span>
        {orderChanged && (
          <span className="text-[var(--accent)] text-[10px] font-medium">• Unsaved changes</span>
        )}
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
              <Reorder.Group
                axis="x"
                values={previews}
                onReorder={(newOrder) => {
                  setPreviews(newOrder)
                  setFiles((prev) => {
                    const fileObjs = prev.filter((f) => f instanceof File)
                    const urlObjs = newOrder.map((src) => {
                      if (typeof src === 'string') return { url: src }
                      return src
                    })
                    return [...fileObjs, ...urlObjs]
                  })
                  setOrderChanged(true)
                }}
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3"
            >
              {previews.map((src, i) => {
                return (
                  <Reorder.Item
                    key={`${src}-${i}`}
                    value={src}
                    as="div"
                  >
                    <div className="relative rounded-xl overflow-hidden group">
                      <img
                        src={src}
                        alt={`Preview ${i + 1}`}
                        className="h-20 w-full object-contain bg-[var(--secondary)]/10"
                        loading="lazy"
                      />
                      <div className="absolute top-1 left-1 bg-[var(--primary)]/90 backdrop-blur-sm text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                        <div className="flex flex-col gap-0.5">
                          <div className="w-3 h-0.5 bg-white rounded-full"></div>
                          <div className="w-3 h-0.5 bg-white rounded-full"></div>
                          <div className="w-3 h-0.5 bg-white rounded-full"></div>
                        </div>
                      </div>
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
                  </Reorder.Item>
                )
              })}
            </Reorder.Group>
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

      {reorderDirty && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[var(--accent)]/40 bg-[var(--accent)]/5 px-5 py-4"
        >
          <div className="flex items-center gap-2 text-sm text-[var(--primary)]">
            <RefreshCw size={16} className={isReorderSaving ? 'animate-spin text-[var(--accent)]' : 'text-[var(--accent)]'} />
            {isReorderSaving ? 'Saving order…' : 'Portfolio order changed. Save to apply everywhere.'}
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => { setReorderDirty(false); load() }}
              disabled={isReorderSaving}
              className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={saveOrder}
              disabled={isReorderSaving}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] text-white px-5 py-2 text-[11px] font-semibold uppercase tracking-widest transition hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isReorderSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {isReorderSaving ? 'Saving…' : 'Save Order'}
            </motion.button>
          </div>
        </motion.div>
      )}

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
              'Before Images (Optional)',
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
              beforeOrderChanged,
              setBeforeOrderChanged,
              'before',
            )}

            {renderImageSection(
              'After Images (Optional)',
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
              afterOrderChanged,
              setAfterOrderChanged,
              'after',
            )}

            {(beforeOrderChanged || afterOrderChanged) && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                disabled={isReorderSaving}
                onClick={() => {
                  const savedBefore = portfolio.find((p) => (p._id || p.id) === editingId)
                  const freshBeforeMap = new Map(
                    (savedBefore?.portfolioImages || [])
                      .filter((img) => img.imageType === 'before')
                      .map((img) => [img.imageUrl, img]),
                  )
                  const freshAfterMap = new Map(
                    (savedBefore?.portfolioImages || [])
                      .filter((img) => img.imageType === 'after')
                      .map((img) => [img.imageUrl, img]),
                  )

                  const buildOrderList = (previews, imageType, freshMap) => {
                    return previews.map((preview, idx) => {
                      const url = typeof preview === 'string' ? preview : preview?.url
                      const freshImg = freshMap.get(url)
                      return {
                        id: freshImg?.id,
                        imageUrl: url,
                        imageType,
                        sortOrder: idx,
                      }
                    })
                  }

                  saveImageOrder(
                    buildOrderList(beforePreviews, 'before', freshBeforeMap),
                    buildOrderList(afterPreviews, 'after', freshAfterMap),
                  )
                }}
                className="w-full rounded-full bg-[var(--accent)] text-white py-3 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isReorderSaving ? <Loader2 size={14} className="animate-spin" /> : null}
                Save Image Order
              </motion.button>
            )}

            {isUploadingImages && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--primary)] flex items-center gap-2">
                    <Upload size={14} className="animate-bounce" />
                    Uploading portfolio images...
                  </span>
                  <span className="text-xs text-[var(--primary)]/50">
                    {uploadImageStates.filter((s) => s.status === 'completed').length}
                    /{uploadImageStates.length} images uploaded
                  </span>
                </div>

                <div className="w-full bg-[var(--border)]/30 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="bg-[var(--accent)] h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadOverallProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {uploadImageStates.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-[var(--border)]/10"
                    >
                      <div className="flex-1 flex items-center gap-2">
                        <div className="w-6 flex-shrink-0 flex items-center justify-center">
                          {s.status === 'completed' && <Check size={14} className="text-green-500" />}
                          {s.status === 'uploading' && <Upload size={14} className="text-[var(--accent)] animate-pulse" />}
                          {s.status === 'retrying' && <RefreshCw size={14} className="text-orange-500 animate-spin" />}
                          {s.status === 'failed' && <X size={14} className="text-[var(--error)]" />}
                          {s.status === 'compressing' && <Loader2 size={14} className="text-[var(--accent)] animate-spin" />}
                          {(s.status === 'pending' || s.status === 'queued') && <div className="w-2 h-2 rounded-full bg-[var(--primary)]/30" />}
                        </div>
                        <span className="text-xs text-[var(--primary)]/70 truncate flex-1">
                          {s.fileName || 'unknown'}
                        </span>
                        {s.status === 'failed' && s.error && (
                          <span className="text-xs text-[var(--error)] truncate">
                            {s.error}
                          </span>
                        )}
                      </div>
                      <div className="w-16 text-right">
                        <span className="text-xs text-[var(--primary)]/50">
                          {s.status === 'pending' ? 'Pending' :
                           s.status === 'queuing' ? 'Queued' :
                           s.status === 'compressing' ? 'Compressing' :
                           s.status === 'uploading' ? `${Math.round(s.progress)}%` :
                           s.status === 'uploaded' ? 'Uploaded' :
                           s.status === 'retrying' ? 'Retrying' :
                           s.status === 'failed' ? 'Failed' :
                           s.status === 'completed' ? 'Done' : s.status}
                        </span>
                        {s.status === 'failed' && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={() => retryFailedImage(s)}
                            className="ml-2 text-xs text-[var(--accent)] hover:text-[var(--accent)]/80"
                          >
                            Retry
                          </motion.button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    toast('Upload cancelled. Failed images can be retried.', { icon: '⚠️' })
                  }}
                  className="text-xs text-[var(--primary)]/50 hover:text-[var(--error)] transition"
                >
                  Cancel all uploads
                </motion.button>
              </div>
            )}

            {!isUploadingImages && uploadImageStates.some((s) => s.status === 'failed') && (
              <div className="p-3 rounded-lg bg-[var(--error)]/10 text-[var(--error)] text-sm">
                <p className="font-medium mb-1">Some images failed to upload:</p>
                <ul className="list-disc list-inside text-xs">
                  {uploadImageStates.filter((s) => s.status === 'failed').map((s, i) => (
                    <li key={i}>{s.fileName}: {s.error}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs">You can retry failed images or try uploading again.</p>
              </div>
            )}

            {isOffline && (
              <div className="p-3 rounded-lg bg-orange-500/10 text-orange-600 text-sm flex items-center gap-2">
                <WifiOff size={14} />
                You are currently offline. Uploads will resume when connection is restored.
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
                disabled={loading || isUploadingImages || isOffline}
                type="submit"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {isUploadingImages ? 'Uploading images...' : (loading ? 'Saving...' : (editingId ? 'Update Project' : 'Upload Project'))}
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <Reorder.Group
        axis="y"
        values={portfolio}
        onReorder={handleReorder}
        as="div"
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {portfolio.map((item, i) => (
          <PortfolioCard
            key={item._id || item.id}
            item={item}
            index={i}
            total={portfolio.length}
            onEdit={startEdit}
            onDelete={(it) => setDeleteId(it._id || it.id)}
            onMoveUp={(idx) => moveItem(idx, -1)}
            onMoveDown={(idx) => moveItem(idx, 1)}
          />
        ))}
      </Reorder.Group>

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

const PortfolioCard = ({
  item,
  index,
  total,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const controls = useDragControls()
  const previewUrl = item.imageUrl || item.beforeImages?.[0] || item.afterImages?.[0] || null
  const imageCount = (item.beforeImages?.length || 0) + (item.afterImages?.length || 0)
  const isFirst = index === 0
  const isLast = index === total - 1

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      as="article"
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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

        {/* Position indicator + drag handle (always visible, mobile-friendly) */}
        <div className="absolute top-12 left-3 z-20 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--primary)] text-white text-[11px] font-bold tabular-nums shadow">
            {String(index + 1).padStart(2, '0')}
          </span>
          <button
            type="button"
            onPointerDown={(e) => controls.start(e)}
            className="cursor-grab active:cursor-grabbing p-1.5 rounded-full bg-[var(--primary)]/90 backdrop-blur-sm text-white hover:bg-[var(--primary)] shadow"
            aria-label="Drag to reorder"
            title="Drag to reorder"
          >
            <GripVertical size={16} />
          </button>
        </div>

        {/* Edit / Delete actions */}
        <div className="absolute top-12 right-3 z-20 flex gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEdit(item)}
            className="p-2.5 bg-[var(--primary)] rounded-xl text-white shadow-lg hover:bg-[var(--primary)]/90 transition-colors"
            aria-label="Edit project"
            title="Edit project"
          >
            <Edit size={16} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(item)}
            className="p-2.5 bg-[var(--error)] rounded-xl text-white shadow-lg hover:bg-[var(--error)]/90 transition-colors"
            aria-label="Delete project"
            title="Delete project"
          >
            <Trash2 size={16} />
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

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onMoveUp(index)}
            disabled={isFirst}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move up"
          >
            <ArrowUp size={14} /> Up
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(index)}
            disabled={isLast}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move down"
          >
            <ArrowDown size={14} /> Down
          </button>
        </div>
      </div>
    </Reorder.Item>
  )
}

