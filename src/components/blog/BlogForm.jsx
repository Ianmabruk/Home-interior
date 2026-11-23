import { useState, useRef, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { UploadCloud, X, Trash2, Video } from 'lucide-react'
import { api } from '../../services/api'
import { createBlogUploadId, uploadBlogMediaFile } from '../../services/blogMediaUploadService'
import { dispatchAdminDataChanged } from '../../utils/adminEvents'
import { slugify, getReadingTime } from '../../utils/blogHelpers'
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '../../utils/uploadConfig'
import { compressVideoInWorker } from '../../services/videoCompressionService'
import { uploadOptimizedVideo } from '../../services/cloudinaryVideoService'

const FORMAT_COMMANDS = [
  { tag: 'h2', label: 'H2', title: 'Heading 2' },
  { tag: 'h3', label: 'H3', title: 'Heading 3' },
  { tag: 'strong', label: 'B', title: 'Bold' },
  { tag: 'em', label: 'I', title: 'Italic' },
  { tag: 'u', label: 'U', title: 'Underline' },
  { tag: 'code', label: '<>', title: 'Code' },
]

const PREDEFINED_CATEGORIES = [
  'Interior Design', 'Architecture', 'Furniture', 'Lighting',
  'Color', 'Materials', 'Trends', 'DIY', 'Sustainability', 'Virtual Design',
]

const isContentVideo = (file) => file.type.startsWith('video/') || /\.(mp4|mov|m4v|webm|avi|mkv|3gp|ogv|ogg)$/i.test(file.name)
const isVideoUrl = (url) => typeof url === 'string' && url.includes('/video/upload/')
const isSupportedContentMedia = (file) => (
  file.type.startsWith('image/')
  || isContentVideo(file)
  || /\.(jpe?g|png|webp|gif|avif)$/i.test(file.name)
)

const INITIAL_FORM = {
  title: '',
  subtitle: '',
  slug: '',
  description: '',
  content: '',
  category: '',
  tags: '',
  author: '',
  metaDescription: '',
  published: false,
  featured: false,
  displayOrder: 0,
  publishDate: '',
}

export const BlogForm = ({ blog, onSaved, onCancel }) => {
  const isEdit = Boolean(blog)
  const [form, setForm] = useState(() => {
    const base = { ...INITIAL_FORM }
    if (blog) {
      const entries = {
        title: blog.title || '',
        subtitle: blog.subtitle || '',
        slug: blog.slug || '',
        description: blog.description || '',
        content: blog.content || '',
        category: blog.category || '',
        tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : (blog.tags || ''),
        author: blog.author || '',
        metaDescription: blog.metaDescription || '',
        published: blog.published || false,
        featured: blog.featured || false,
        displayOrder: blog.displayOrder || 0,
        publishDate: blog.publishDate ? new Date(blog.publishDate).toISOString().split('T')[0] : '',
      }
      Object.assign(base, entries)
    }
    return base
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(blog?.image || null)
  const [videoFile, setVideoFile] = useState(null)
  const [videoPreview, setVideoPreview] = useState(blog?.video || null)
  const [videoPreviewError, setVideoPreviewError] = useState(false)
  const [removeVideo, setRemoveVideo] = useState(false)
  const [videoAsset, setVideoAsset] = useState(null)
  const [videoPhase, setVideoPhase] = useState('')
  const [videoPhaseProgress, setVideoPhaseProgress] = useState(0)
  const [videoOriginalBytes, setVideoOriginalBytes] = useState(0)
  const [videoCompressedBytes, setVideoCompressedBytes] = useState(0)
  const [videoError, setVideoError] = useState(null)
  const cancelCompressionRef = useRef(null)
  const cancelUploadRef = useRef(null)
  const [contentFiles, setContentFiles] = useState([])
  const [existingContentImages, setExistingContentImages] = useState(blog?.mediaUrls ? [...blog.mediaUrls] : [])
  const [removeMediaUrls, setRemoveMediaUrls] = useState([])
  const [imageUploadId, setImageUploadId] = useState(null)
  const [imageAsset, setImageAsset] = useState(null)
  const [imageUploadError, setImageUploadError] = useState(null)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const imageInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const contentInputRef = useRef(null)
  const submissionLockRef = useRef(false)
  const contentFilesRef = useRef(contentFiles)

  useEffect(() => {
    contentFilesRef.current = contentFiles
  }, [contentFiles])
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
      if (videoPreview && videoPreview.startsWith('blob:')) URL.revokeObjectURL(videoPreview)
    }
  }, [imagePreview, videoPreview])

  useEffect(() => () => {
    contentFilesRef.current.forEach(({ preview }) => {
      if (preview.startsWith('blob:')) URL.revokeObjectURL(preview)
    })
  }, [])

  const handleFileChange = (e, field) => {
    const file = e.target.files?.[0] || null
    if (!file) return

    const maxVideoBytes = 500 * 1024 * 1024
    if (field === 'video' ? file.size > maxVideoBytes : file.size > MAX_FILE_SIZE_BYTES) {
      if (field === 'video') {
        toast.error('Video exceeds the 500 MB processing limit')
        e.target.value = ''
        return
      }
      toast.error(`File exceeds the maximum allowed size of ${MAX_FILE_SIZE_MB} MB`)
      e.target.value = ''
      return
    }
    if (file.size === 0) {
      toast.error('The selected file is empty')
      e.target.value = ''
      return
    }

    if (field === 'image') {
      if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif|avif)$/i.test(file.name)) {
        toast.error('Please select a valid image file')
        e.target.value = ''
        return
      }
      setImageFile(file)
      setImageAsset(null)
      setImageUploadId(createBlogUploadId())
      setImageUploadError(null)
      const url = URL.createObjectURL(file)
      setImagePreview(url)
    } else if (field === 'video') {
      if (!file.type.startsWith('video/') && !/\.(mp4|mov|m4v|webm|avi|mkv|3gp)$/i.test(file.name)) {
        toast.error('Please select a valid video file (MP4, MOV, WebM, AVI, MKV)')
        return
      }
      processSelectedVideo(file)
    }
    e.target.value = ''
  }

  const handleContentImagesChange = (e) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length === 0) return
    const emptyFile = selected.find((file) => file.size === 0)
    if (emptyFile) {
      toast.error(`File "${emptyFile.name}" is empty`)
      e.target.value = ''
      return
    }
    const invalidType = selected.find((file) => !isSupportedContentMedia(file))
    if (invalidType) {
      toast.error(`"${invalidType.name}" is not a supported image or video file`)
      e.target.value = ''
      return
    }
    const oversized = selected.find((file) => file.size > MAX_FILE_SIZE_BYTES)
    if (oversized) {
      toast.error(`File "${oversized.name}" exceeds the ${MAX_FILE_SIZE_MB} MB content media limit`)
      e.target.value = ''
      return
    }
    setContentFiles((prev) => [
      ...prev,
      ...selected.map((file) => ({
        id: createBlogUploadId(),
        file,
        preview: URL.createObjectURL(file),
        uploadId: createBlogUploadId(),
        asset: null,
        status: 'pending',
        error: null,
      })),
    ])
    e.target.value = ''
  }

  const handleRemoveContentImage = (index) => {
    const item = contentFiles[index]
    if (item?.preview.startsWith('blob:')) URL.revokeObjectURL(item.preview)
    setContentFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExistingContentImage = (url) => {
    setExistingContentImages((prev) => prev.filter((u) => u !== url))
    setRemoveMediaUrls((prev) => {
      if (prev.includes(url)) return prev
      return [...prev, url]
    })
  }

  const handleRemovePreview = (field) => {
    if (field === 'image') {
      setImageFile(null)
      setImageAsset(null)
      setImageUploadId(null)
      setImageUploadError(null)
      if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
      setImagePreview(null)
    } else if (field === 'video') {
      cancelUploadRef.current?.()
      cancelCompressionRef.current?.()
      cancelUploadRef.current = null
      cancelCompressionRef.current = null
      setVideoFile(null)
      setVideoAsset(null)
      setVideoPhase('')
      setVideoPhaseProgress(0)
      setVideoOriginalBytes(0)
      setVideoCompressedBytes(0)
      setVideoError(null)
      if (videoPreview && videoPreview.startsWith('blob:')) URL.revokeObjectURL(videoPreview)
      setVideoPreview(null)
      setVideoPreviewError(false)
      setRemoveVideo(true)
    }
  }

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'title' && !form.slug && !isEdit) {
      setForm((prev) => ({ ...prev, slug: slugify(value) }))
    }
  }

  const applyFormat = (tag) => {
    const textarea = document.getElementById('blog-content-editor')
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = textarea.value.substring(start, end)
    if (!selected) return

    const replacement = `<${tag}>${selected}</${tag}>`
    const newValue = textarea.value.substring(0, start) + replacement + textarea.value.substring(end)
    setForm((prev) => ({ ...prev, content: newValue }))
    setTimeout(() => {
      textarea.setSelectionRange(start + replacement.length, start + replacement.length)
      textarea.focus()
    }, 0)
  }

  const processSelectedVideo = async (file) => {
    if (videoPreview && videoPreview.startsWith('blob:')) URL.revokeObjectURL(videoPreview)
    setVideoFile(file)
    setVideoAsset(null)
    setVideoError(null)
    setRemoveVideo(false)
    setVideoPreviewError(false)
    setVideoOriginalBytes(file.size)
    setVideoCompressedBytes(0)
    setVideoPreview(URL.createObjectURL(file))

    try {
      setVideoPhase('preparing')
      setVideoPhaseProgress(5)
      const result = await compressVideoInWorker(file, {
        setCancel: (cancel) => { cancelCompressionRef.current = cancel },
        onProgress: ({ phase, progress, originalBytes }) => {
          setVideoPhase(phase)
          setVideoPhaseProgress(progress)
          if (originalBytes) setVideoOriginalBytes(originalBytes)
        },
      })
      cancelCompressionRef.current = null
      setVideoCompressedBytes(result.compressedBytes)
      setVideoPhase('uploading')
      setVideoPhaseProgress(0)

      const optimizedUrl = URL.createObjectURL(result.file)
      if (videoPreview && videoPreview.startsWith('blob:')) URL.revokeObjectURL(videoPreview)
      setVideoPreview(optimizedUrl)

      const asset = await uploadOptimizedVideo(result.file, result.contentHash, {
        setCancel: (cancel) => { cancelUploadRef.current = cancel },
        onUploadProgress: (progress) => setVideoPhaseProgress(progress),
      })
      cancelUploadRef.current = null
      setVideoAsset({ ...asset, originalName: file.name })
      setVideoPhase('completed')
      setVideoPhaseProgress(100)
      toast.success('Video optimized and uploaded successfully')
    } catch (err) {
      cancelCompressionRef.current = null
      cancelUploadRef.current = null
      const msg = err?.message || 'Video processing failed'
      setVideoError(msg)
      setVideoPhase('error')
      setVideoPhaseProgress(0)
      toast.error(msg)
    }
  }

  const cancelVideoProcessing = () => {
    cancelUploadRef.current?.()
    cancelCompressionRef.current?.()
    cancelUploadRef.current = null
    cancelCompressionRef.current = null
    setVideoPhase('cancelled')
    setVideoError('Video processing cancelled')
  }

  const uploadPendingMedia = async () => {
    const pending = []
    let uploadedImageAsset = imageAsset
    const uploadedContentAssets = new Map()
    const failed = []

    if (imageFile && !imageAsset) {
      pending.push({
        id: 'featured-image',
        file: imageFile,
        uploadId: imageUploadId,
        type: 'featured',
      })
    }
    contentFiles.forEach((item) => {
      if (item.asset) uploadedContentAssets.set(item.id, item.asset)
      else pending.push({ ...item, type: 'content' })
    })

    if (pending.length === 0) {
      return {
        imageAsset: uploadedImageAsset,
        mediaAssets: contentFiles.map((item) => item.asset).filter(Boolean),
        failed,
      }
    }

    setUploadingMedia(true)
    let cursor = 0
    const worker = async () => {
      while (cursor < pending.length) {
        const item = pending[cursor]
        cursor += 1
        if (item.type === 'featured') setImageUploadError(null)
        else {
          setContentFiles((prev) => prev.map((entry) => (
            entry.id === item.id ? { ...entry, status: 'uploading', error: null } : entry
          )))
        }

        try {
          const asset = await uploadBlogMediaFile(item.file, item.uploadId)
          if (item.type === 'featured') {
            uploadedImageAsset = asset
            setImageAsset(asset)
          } else {
            uploadedContentAssets.set(item.id, asset)
            setContentFiles((prev) => prev.map((entry) => (
              entry.id === item.id ? { ...entry, asset, status: 'uploaded', error: null } : entry
            )))
          }
        } catch (uploadError) {
          const message = uploadError?.message || 'Upload failed'
          failed.push({ fileName: item.file.name, message })
          if (item.type === 'featured') setImageUploadError(message)
          else {
            setContentFiles((prev) => prev.map((entry) => (
              entry.id === item.id ? { ...entry, status: 'failed', error: message } : entry
            )))
          }
        }
      }
    }

    try {
      await Promise.all(Array.from({ length: Math.min(3, pending.length) }, worker))
    } finally {
      setUploadingMedia(false)
    }

    return {
      imageAsset: uploadedImageAsset,
      mediaAssets: contentFiles.map((item) => uploadedContentAssets.get(item.id) || item.asset).filter(Boolean),
      failed,
    }
  }

  const retryContentUpload = async (itemId) => {
    const item = contentFiles.find((entry) => entry.id === itemId)
    if (!item || uploadingMedia || submitting) return
    setUploadingMedia(true)
    setContentFiles((prev) => prev.map((entry) => (
      entry.id === itemId ? { ...entry, status: 'uploading', error: null } : entry
    )))
    try {
      const asset = await uploadBlogMediaFile(item.file, item.uploadId)
      setContentFiles((prev) => prev.map((entry) => (
        entry.id === itemId ? { ...entry, asset, status: 'uploaded', error: null } : entry
      )))
    } catch (uploadError) {
      const message = uploadError?.message || 'Upload failed'
      setContentFiles((prev) => prev.map((entry) => (
        entry.id === itemId ? { ...entry, status: 'failed', error: message } : entry
      )))
    } finally {
      setUploadingMedia(false)
    }
  }

  const retryFeaturedImageUpload = async () => {
    if (!imageFile || !imageUploadId || uploadingMedia || submitting) return
    setUploadingMedia(true)
    setImageUploadError(null)
    try {
      const asset = await uploadBlogMediaFile(imageFile, imageUploadId)
      setImageAsset(asset)
    } catch (uploadError) {
      setImageUploadError(uploadError?.message || 'Upload failed')
    } finally {
      setUploadingMedia(false)
    }
  }

  const handleSubmit = async (e, status) => {
    e.preventDefault()
    if (submitting || submissionLockRef.current) return
    submissionLockRef.current = true
    setError(null)

    const title = (form.title || '').trim()
    if (!title) {
      submissionLockRef.current = false
      setError('Title is required')
      return
    }
    if (videoFile && !videoAsset && videoPhase !== 'error' && videoPhase !== 'cancelled') {
      submissionLockRef.current = false
      setError('Wait for automatic video compression and upload to complete')
      return
    }
    if (videoError && videoFile) {
      submissionLockRef.current = false
      setError(videoError)
      return
    }

    setSubmitting(true)

    try {
      const uploads = await uploadPendingMedia()
      if (uploads.failed.length > 0) {
        throw new Error(`${uploads.failed.length} media upload${uploads.failed.length === 1 ? '' : 's'} failed. Retry the failed file${uploads.failed.length === 1 ? '' : 's'} before publishing.`)
      }

      if (videoAsset) {
        setVideoPhase('saving')
        setVideoPhaseProgress(100)
      }
      const payload = {
        title,
        subtitle: form.subtitle || '',
        slug: form.slug || slugify(title),
        description: form.description || '',
        content: form.content || '',
        category: form.category || '',
        tags: form.tags || '',
        author: form.author || '',
        metaDescription: form.metaDescription || '',
        published: status === 'publish' ? true : form.published,
        featured: Boolean(form.featured),
        displayOrder: Number(form.displayOrder) || 0,
      }
      if (form.publishDate) payload.publishDate = form.publishDate
      if (imageFile) payload.imageAsset = uploads.imageAsset
      if (videoAsset) payload.videoAsset = videoAsset
      if (removeVideo) payload.removeVideo = true
      if (uploads.mediaAssets.length > 0) payload.mediaAssets = uploads.mediaAssets
      if (removeMediaUrls.length > 0) payload.removeMediaUrls = removeMediaUrls

      let res
      if (isEdit) {
        res = await api.patch(`/admin/blog/${blog.id}`, payload)
      } else {
        res = await api.post('/admin/blog', payload)
      }

      if (videoAsset) setVideoPhase('completed')
      toast.success(`Blog ${isEdit ? 'updated' : 'created'} successfully`)
      dispatchAdminDataChanged('blog-changed')
      onSaved?.(res.data)
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save blog'
      setError(msg)
      toast.error(`Failed to save blog: ${msg}`)
    } finally {
      submissionLockRef.current = false
      setSubmitting(false)
      setUploadingMedia(false)
    }
  }

  const handleCancel = () => {
    if (!submitting) onCancel?.()
  }

  const wordCount = form.content ? form.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length : 0
  const readingTime = getReadingTime(form.content || '')
  const formatBytes = (bytes) => {
    if (!bytes) return '0 MB'
    const mb = bytes / 1024 / 1024
    return `${mb >= 1 ? mb.toFixed(1) : (bytes / 1024).toFixed(0)} ${mb >= 1 ? 'MB' : 'KB'}`
  }
  const compressionPercent = videoOriginalBytes && videoCompressedBytes
    ? Math.max(0, Math.round((1 - videoCompressedBytes / videoOriginalBytes) * 100))
    : 0
  const selectedImageCount = Number(Boolean(imageFile)) + contentFiles.filter(({ file }) => !isContentVideo(file)).length
  const selectedVideoCount = Number(Boolean(videoFile)) + contentFiles.filter(({ file }) => isContentVideo(file)).length
  const uploadedImageCount = Number(Boolean(imageFile && imageAsset)) + contentFiles.filter(({ file, asset }) => !isContentVideo(file) && asset).length
  const uploadedVideoCount = Number(Boolean(videoFile && videoAsset)) + contentFiles.filter(({ file, asset }) => isContentVideo(file) && asset).length
  const failedUploadCount = Number(Boolean(imageUploadError)) + Number(Boolean(videoError && videoFile)) + contentFiles.filter(({ status }) => status === 'failed').length
  const totalSelectedMedia = selectedImageCount + selectedVideoCount
  const totalUploadedMedia = uploadedImageCount + uploadedVideoCount
  const videoStepLabels = {
    preparing: 'Step 1: Preparing video',
    compressing: 'Step 2: Compressing video',
    uploading: 'Step 3: Uploading optimized video',
    saving: 'Step 4: Saving video',
    completed: 'Step 5: Completed',
  }

  return (
    <form className="space-y-6">
      {error && (
        <div className="rounded-xl border border-[var(--error)]/20 bg-[var(--error)]/5 p-4 text-sm text-[var(--error)]">
          {error}
        </div>
      )}
      {submitting && !uploadingMedia && (
        <div className="rounded-xl border border-border/50 bg-[var(--secondary)]/10 p-4 text-sm font-medium text-[var(--accent)]">
          Publishing blog…
        </div>
      )}

      {videoPhase && (
        <div className="space-y-3 rounded-xl border border-border/50 bg-[var(--secondary)]/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--primary)]">
                {videoStepLabels[videoPhase] || (videoPhase === 'error' ? 'Video processing failed' : 'Preparing video')}
              </p>
              {videoOriginalBytes > 0 && (
                <p className="mt-1 text-xs text-[var(--primary)]/55">
                  Original: {formatBytes(videoOriginalBytes)}
                  {videoCompressedBytes > 0 && ` • Compressed: ${formatBytes(videoCompressedBytes)} • ${compressionPercent}% smaller`}
                </p>
              )}
            </div>
            {(videoPhase === 'preparing' || videoPhase === 'compressing' || videoPhase === 'uploading') && (
              <button type="button" onClick={cancelVideoProcessing} className="text-xs font-semibold text-[var(--error)]">
                Cancel
              </button>
            )}
          </div>
          {videoPhase !== 'error' && videoPhase !== 'cancelled' && (
            <div className="h-2 overflow-hidden rounded-full bg-[var(--secondary)]/40">
              <div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${videoPhaseProgress}%` }} />
            </div>
          )}
          {(videoPhase === 'error' || videoPhase === 'cancelled') && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-[var(--error)]">{videoError || 'Video processing cancelled'}</p>
              {videoFile && (
                <button type="button" onClick={() => processSelectedVideo(videoFile)} className="text-xs font-semibold text-[var(--accent)]">
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {totalSelectedMedia > 0 && (
        <div className="space-y-3 rounded-xl border border-border/50 bg-[var(--secondary)]/10 p-4">
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs font-medium text-[var(--primary)]/70">
            <span>{uploadingMedia ? 'Uploading media' : 'Media uploaded'}: {totalUploadedMedia}/{totalSelectedMedia}</span>
            <span>Remaining: {totalSelectedMedia - totalUploadedMedia}</span>
            <span>Images uploaded: {uploadedImageCount}/{selectedImageCount}</span>
            <span>Videos uploaded: {uploadedVideoCount}/{selectedVideoCount}</span>
            <span>Failed uploads: {failedUploadCount}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--secondary)]/30">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-300 ease-out"
              style={{ width: `${totalSelectedMedia ? (totalUploadedMedia / totalSelectedMedia) * 100 : 0}%` }}
            />
          </div>
          {imageUploadError && (
            <div className="flex items-center justify-between gap-3 text-xs text-[var(--error)]">
              <span>Featured image: {imageUploadError}</span>
              <button type="button" onClick={retryFeaturedImageUpload} disabled={uploadingMedia} className="font-semibold text-[var(--accent)] disabled:opacity-50">
                Retry
              </button>
            </div>
          )}
          {contentFiles.filter(({ status }) => status === 'failed').map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 text-xs text-[var(--error)]">
              <span className="min-w-0 truncate">{item.file.name}: {item.error}</span>
              <button type="button" onClick={() => retryContentUpload(item.id)} disabled={uploadingMedia} className="shrink-0 font-semibold text-[var(--accent)] disabled:opacity-50">
                Retry
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
            Title *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            className="input-luxury"
            placeholder="Enter blog title"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
            Subtitle
          </label>
          <input
            type="text"
            value={form.subtitle}
            onChange={(e) => handleFieldChange('subtitle', e.target.value)}
            className="input-luxury"
            placeholder="Optional subtitle"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
            Slug
          </label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => handleFieldChange('slug', e.target.value)}
            className="input-luxury"
            placeholder="auto-generated from title"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
            Category
          </label>
          <input
            type="text"
            list="blog-categories"
            value={form.category}
            onChange={(e) => handleFieldChange('category', e.target.value)}
            className="input-luxury"
            placeholder="Select or enter category"
          />
          <datalist id="blog-categories">
            {PREDEFINED_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
            Author
          </label>
          <input
            type="text"
            value={form.author}
            onChange={(e) => handleFieldChange('author', e.target.value)}
            className="input-luxury"
            placeholder="Author name"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
          Content
          {wordCount > 0 && (
            <span className="ml-2 text-[var(--primary)]/40">
              ({wordCount} words, ~{readingTime} min read)
            </span>
          )}
        </label>
        <div className="mb-2 flex flex-wrap gap-1 rounded-xl border border-border/50 bg-white p-2">
          {FORMAT_COMMANDS.map((cmd) => (
            <button
              key={cmd.tag}
              type="button"
              onClick={() => applyFormat(cmd.tag)}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)]"
              title={cmd.title}
            >
              {cmd.label}
            </button>
          ))}
        </div>
        <textarea
          id="blog-content-editor"
          value={form.content}
          onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
          className="input-luxury min-h-[200px] resize-y font-mono text-sm"
          placeholder="Write your article content here. Use HTML tags like &lt;h2&gt;, &lt;strong&gt;, &lt;ul&gt;&lt;li&gt;, &lt;a href='...'&gt;"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
            Featured Image
          </label>
          {imagePreview ? (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-32 w-48 rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => handleRemovePreview('image')}
                className="absolute top-1 right-1 rounded-full bg-white/90 p-0.5 text-[var(--error)] shadow"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ) : (
            <label className="upload-zone flex cursor-pointer flex-col items-center justify-center py-8">
              <UploadCloud size={24} className="text-[var(--primary)]/30" />
              <span className="mt-2 text-sm font-medium text-[var(--primary)]/60">Click to upload featured image</span>
              <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'image')}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
            Video
          </label>
          {videoPreview ? (
            <div className="relative inline-block">
              {videoPreviewError ? (
                <div className="flex h-32 w-48 flex-col items-center justify-center rounded-xl bg-[var(--secondary)]/20 px-3 text-center">
                  <Video size={22} className="mb-2 text-[var(--primary)]/40" />
                  <span className="text-xs font-medium text-[var(--primary)]/60">Preview unavailable</span>
                </div>
              ) : (
                <video
                  src={videoPreview}
                  className="h-32 w-48 rounded-xl object-cover"
                  controls
                  muted
                  playsInline
                  preload="metadata"
                  onError={() => setVideoPreviewError(true)}
                  onCanPlay={() => setVideoPreviewError(false)}
                />
              )}
              <button
                type="button"
                onClick={() => handleRemovePreview('video')}
                className="absolute top-1 right-1 rounded-full bg-white/90 p-0.5 text-[var(--error)] shadow"
              >
                <Trash2 size={12} />
              </button>
              {videoPreviewError && (
                <p className="mt-2 max-w-64 text-xs text-[var(--primary)]/50">
                  The file remains selected. Video compatibility is checked when you save.
                </p>
              )}
            </div>
          ) : (
            <label className="upload-zone flex cursor-pointer flex-col items-center justify-center py-6">
              <UploadCloud size={24} className="text-[var(--primary)]/30" />
              <span className="mt-2 text-sm font-medium text-[var(--primary)]/60">Click to upload video</span>
              <input
                type="file"
                ref={videoInputRef}
                accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
                onChange={(e) => handleFileChange(e, 'video')}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
          Content Media (Gallery)
        </label>
        <p className="mb-3 text-xs text-[var(--primary)]/50">
        Additional images and videos to display within the article. Files upload separately and can be retried individually.
        </p>

        {existingContentImages.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            {existingContentImages.map((url) => (
              <div key={url} className="relative inline-block">
              {isVideoUrl(url)
                ? <video src={url} aria-label="Existing content video" className="h-20 w-20 rounded-lg object-cover" controls preload="metadata" />
                : <img src={url} alt="Content" className="h-20 w-20 rounded-lg object-cover" loading="lazy" />}
                <button
                  type="button"
                  onClick={() => handleRemoveExistingContentImage(url)}
                  className="absolute top-1 right-1 rounded-full bg-white/90 p-0.5 text-[var(--error)] shadow"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {contentFiles.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            {contentFiles.map((item, i) => (
              <div key={item.id} className="relative inline-block">
                {isContentVideo(item.file)
                  ? <video src={item.preview} aria-label={`Content video ${i + 1}`} className="h-20 w-20 rounded-lg object-cover" controls muted preload="metadata" />
                  : <img src={item.preview} alt={`Content image ${i + 1}`} className="h-20 w-20 rounded-lg object-cover" loading="lazy" />}
                <button
                  type="button"
                  onClick={() => handleRemoveContentImage(i)}
                  className="absolute top-1 right-1 rounded-full bg-white/90 p-0.5 text-[var(--error)] shadow"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <label className="upload-zone flex cursor-pointer flex-col items-center justify-center py-6">
          <UploadCloud size={20} className="text-[var(--primary)]/30" />
          <span className="mt-2 text-sm font-medium text-[var(--primary)]/60">Click to upload gallery images or videos</span>
          <input
            type="file"
            ref={contentInputRef}
            accept="image/*,video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
            multiple
            onChange={handleContentImagesChange}
            className="hidden"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
            Tags
          </label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => handleFieldChange('tags', e.target.value)}
            className="input-luxury"
            placeholder="Comma-separated: interior, design, luxury"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
            Meta Description
          </label>
          <textarea
            value={form.metaDescription}
            onChange={(e) => handleFieldChange('metaDescription', e.target.value)}
            className="input-luxury min-h-[56px] resize-y"
            placeholder="SEO meta description (150-160 characters)"
            rows={2}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-end">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
            Display Order
          </label>
          <input
            type="number"
            value={form.displayOrder}
            onChange={(e) => handleFieldChange('displayOrder', parseInt(e.target.value, 10) || 0)}
            className="input-luxury"
            min={0}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
            Publish Date
          </label>
          <input
            type="date"
            value={form.publishDate}
            onChange={(e) => handleFieldChange('publishDate', e.target.value)}
            className="input-luxury"
          />
        </div>

        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2 text-sm text-[var(--primary)]/70">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => handleFieldChange('featured', e.target.checked)}
              className="h-4 w-4 rounded border-border/50 text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--primary)]/70">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => handleFieldChange('published', e.target.checked)}
              className="h-4 w-4 rounded border-border/50 text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            Published
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border/50 pt-6">
        <button
          type="button"
          onClick={handleCancel}
          className="btn-luxury-secondary"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e, 'draft')}
          className="btn-luxury-secondary"
          disabled={submitting || !form.title.trim() || Boolean(videoFile && !videoAsset && !videoError)}
        >
          {submitting ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e, 'publish')}
          className="btn-luxury-primary"
          disabled={submitting || !form.title.trim() || Boolean(videoFile && !videoAsset && !videoError)}
        >
          {submitting ? 'Publishing...' : (isEdit ? 'Update & Publish' : 'Publish')}
        </button>
      </div>
    </form>
  )
}

export default BlogForm
