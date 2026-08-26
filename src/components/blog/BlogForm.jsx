import { useState, useRef, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { UploadCloud, X, Trash2 } from 'lucide-react'
import { api } from '../../services/api'
import { dispatchAdminDataChanged } from '../../utils/adminEvents'
import { slugify, getReadingTime } from '../../utils/blogHelpers'

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
  const [contentFiles, setContentFiles] = useState([])
  const [contentPreviews, setContentPreviews] = useState([])
  const [existingContentImages, setExistingContentImages] = useState(blog?.mediaUrls ? [...blog.mediaUrls] : [])
  const [removeMediaUrls, setRemoveMediaUrls] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const imageInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const contentInputRef = useRef(null)

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
      if (videoPreview && videoPreview.startsWith('blob:')) URL.revokeObjectURL(videoPreview)
      contentPreviews.forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url)
      })
    }
  }, [imagePreview, videoPreview, contentPreviews])

  const handleFileChange = (e, field) => {
    const file = e.target.files?.[0] || null
    if (!file) return

    if (field === 'image') {
      setImageFile(file)
      const url = URL.createObjectURL(file)
      setImagePreview(url)
    } else if (field === 'video') {
      setVideoFile(file)
      const url = URL.createObjectURL(file)
      setVideoPreview(url)
    }
    e.target.value = ''
  }

  const handleContentImagesChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setContentFiles((prev) => [...prev, ...files])
    const newPreviews = files.map((f) => URL.createObjectURL(f))
    setContentPreviews((prev) => [...prev, ...newPreviews])
    e.target.value = ''
  }

  const handleRemoveContentImage = (index) => {
    const url = contentPreviews[index]
    if (url.startsWith('blob:')) URL.revokeObjectURL(url)
    setContentFiles((prev) => prev.filter((_, i) => i !== index))
    setContentPreviews((prev) => prev.filter((_, i) => i !== index))
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
      if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
      setImagePreview(null)
    } else if (field === 'video') {
      setVideoFile(null)
      if (videoPreview && videoPreview.startsWith('blob:')) URL.revokeObjectURL(videoPreview)
      setVideoPreview(null)
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

  const handleSubmit = async (e, status) => {
    e.preventDefault()
    if (submitting) return
    setError(null)

    const title = (form.title || '').trim()
    if (!title) {
      setError('Title is required')
      return
    }

    setSubmitting(true)
    setUploadProgress(0)

    const payload = new FormData()
    payload.append('title', title)
    payload.append('subtitle', form.subtitle || '')
    payload.append('slug', form.slug || slugify(title))
    payload.append('description', form.description || '')
    payload.append('content', form.content || '')
    payload.append('category', form.category || '')
    payload.append('tags', form.tags || '')
    payload.append('author', form.author || '')
    payload.append('metaDescription', form.metaDescription || '')
    payload.append('published', String(status === 'publish' ? true : form.published))
    payload.append('featured', String(form.featured))
    payload.append('displayOrder', String(form.displayOrder || 0))
    if (form.publishDate) payload.append('publishDate', form.publishDate)

    if (imageFile) payload.append('image', imageFile)
    if (videoFile) payload.append('video', videoFile)
    contentFiles.forEach((file) => payload.append('contentImages', file))
    if (removeMediaUrls.length > 0) payload.append('removeMediaUrls', JSON.stringify(removeMediaUrls))

    try {
      let res
      if (isEdit) {
        res = await api.patch(`/admin/blog/${blog.id}`, payload, {
          onUploadProgress: (event) => {
            if (event.total) {
              setUploadProgress(Math.round((event.loaded * 100) / event.total))
            }
          },
        })
      } else {
        res = await api.post('/admin/blog', payload, {
          onUploadProgress: (event) => {
            if (event.total) {
              setUploadProgress(Math.round((event.loaded * 100) / event.total))
            }
          },
        })
      }

      toast.success(`Blog ${isEdit ? 'updated' : 'created'} successfully`)
      dispatchAdminDataChanged('blog-changed')
      onSaved?.(res.data)
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save blog'
      setError(msg)
      toast.error(`Failed to save blog: ${msg}`)
    } finally {
      setSubmitting(false)
      setUploadProgress(0)
    }
  }

  const handleCancel = () => {
    if (!submitting) onCancel?.()
  }

  const wordCount = form.content ? form.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length : 0
  const readingTime = getReadingTime(form.content || '')

  return (
    <form className="space-y-6">
      {error && (
        <div className="rounded-xl border border-[var(--error)]/20 bg-[var(--error)]/5 p-4 text-sm text-[var(--error)]">
          {error}
        </div>
      )}

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--accent)]">
            <span>Uploading media…</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--secondary)]/30">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
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
              <video src={videoPreview} className="h-32 w-48 rounded-xl object-cover" controls muted preload="metadata" />
              <button
                type="button"
                onClick={() => handleRemovePreview('video')}
                className="absolute top-1 right-1 rounded-full bg-white/90 p-0.5 text-[var(--error)] shadow"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ) : (
            <label className="upload-zone flex cursor-pointer flex-col items-center justify-center py-6">
              <UploadCloud size={24} className="text-[var(--primary)]/30" />
              <span className="mt-2 text-sm font-medium text-[var(--primary)]/60">Click to upload video</span>
              <input
                type="file"
                ref={videoInputRef}
                accept="video/*"
                onChange={(e) => handleFileChange(e, 'video')}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--primary)]/60">
          Content Images (Gallery)
        </label>
        <p className="mb-3 text-xs text-[var(--primary)]/50">
          Additional images to display within the article.
        </p>

        {existingContentImages.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            {existingContentImages.map((url) => (
              <div key={url} className="relative inline-block">
                <img src={url} alt="Content" className="h-20 w-20 rounded-lg object-cover" loading="lazy" />
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

        {contentPreviews.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            {contentPreviews.map((url, i) => (
              <div key={i} className="relative inline-block">
                <img src={url} alt={`Content ${i + 1}`} className="h-20 w-20 rounded-lg object-cover" loading="lazy" />
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
          <span className="mt-2 text-sm font-medium text-[var(--primary)]/60">Click to upload content images</span>
          <input
            type="file"
            ref={contentInputRef}
            accept="image/*"
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
          disabled={submitting || !form.title.trim()}
        >
          {submitting ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e, 'publish')}
          className="btn-luxury-primary"
          disabled={submitting || !form.title.trim()}
        >
          {submitting ? 'Publishing...' : (isEdit ? 'Update & Publish' : 'Publish')}
        </button>
      </div>
    </form>
  )
}

export default BlogForm
