import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { api } from '@services/api'
import { getOptimizedUrl } from '@utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'
import { SectionErrorBoundary } from '@components/home/SectionErrorBoundary'

const SkeletonBlogDetail = () => (
  <main className="min-h-screen bg-[var(--bg)]">
    <div className="h-[50vh] min-h-[400px] bg-[var(--primary)] skeleton" />
    <div className="container-wide px-6 md:px-12 lg:px-20 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="skeleton h-5 w-20 mb-4" />
        <div className="skeleton h-10 w-full mb-4" />
        <div className="skeleton h-4 w-3/4 mb-8" />
        <div className="skeleton h-64 w-full mb-8" />
        <div className="skeleton h-4 w-full mb-3" />
        <div className="skeleton h-4 w-full mb-3" />
        <div className="skeleton h-4 w-2/3" />
      </div>
    </div>
  </main>
)

export const BlogDetailPage = () => {
  const { id } = useParams()
  const [blog, setBlog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadBlog = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/blog/${id}`)
      setBlog(res.data || null)
    } catch (err) {
      setError(err?.message || 'Failed to load blog')
      setBlog(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadBlog()
  }, [loadBlog])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'blog-changed') {
        loadBlog()
      }
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadBlog])

  if (loading) {
    return (
      <main>
        <SectionErrorBoundary sectionName="BlogDetail" fallback={<SkeletonBlogDetail />}>
          <SkeletonBlogDetail />
        </SectionErrorBoundary>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="font-display text-xl text-[var(--primary)]/60 mb-4">Unable to load blog</p>
          <button onClick={loadBlog} className="btn-luxury-primary inline-flex items-center gap-2">Retry</button>
        </div>
      </main>
    )
  }

  if (!blog) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="font-display text-xl text-[var(--primary)]/60 mb-4">Blog not found</p>
          <Link to="/blog" className="btn-luxury-primary inline-flex items-center gap-2">Back to Blog</Link>
        </div>
      </main>
    )
  }

  const imageUrl = blog.imageUrl || blog.mediaUrl || blog.mediaUrls?.[0] || blog.image || null
  const videoUrl = blog.videoUrl || blog.video || blog.mediaUrls?.[0] || null
  const content = blog.description || blog.content || blog.body || ''

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <PageMeta
        title={`${blog.title} — HOK Interior Designs Blog`}
        description={blog.description || 'Read the latest from HOK Interior Designs.'}
      />

      {/* Hero */}
      <section className="relative w-full h-[50vh] min-h-[400px] overflow-hidden bg-[var(--primary)]">
        {imageUrl ? (
          <img
            src={getOptimizedUrl(imageUrl, { width: 1200, crop: 'limit' })}
            alt={blog.title}
            className="h-full w-full object-contain"
            loading="eager"
            decoding="async"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        ) : (
          <div className="absolute inset-0 bg-[var(--primary)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/80 via-transparent to-transparent" />
        <div className="absolute bottom-6 left-0 right-0 container-wide">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors">
            <ArrowLeft size={16} strokeWidth={1.5} />
            Back to Blog
          </Link>
        </div>
      </section>

      {/* Content */}
      <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-12 md:py-20">
        <div className="container-wide max-w-3xl mx-auto">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-[var(--primary)] leading-tight mb-6">
              {blog.title}
            </h1>

            <div className="flex items-center gap-4 mb-8 text-sm text-[var(--primary)]/50">
              {blog.published && (
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold uppercase">Published</span>
              )}
              {blog.featured && (
                <span className="px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-semibold uppercase">Featured</span>
              )}
            </div>

            {content && (
              <div className="prose max-w-none text-[var(--primary)]/80 leading-relaxed">
                {content.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="mb-4">{paragraph}</p>
                ))}
              </div>
            )}

            {videoUrl && (
              <div className="mt-8 rounded-2xl overflow-hidden bg-[var(--secondary)]/30">
                <video
                  src={videoUrl}
                  controls
                  playsInline
                  muted
                  preload="metadata"
                  className="w-full"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              </div>
            )}
          </motion.article>
        </div>
      </section>
    </main>
  )
}

export default BlogDetailPage