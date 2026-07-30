import { useState, useEffect, useCallback, memo } from 'react'
import { api } from '@services/api'
import { getOptimizedUrl } from '@utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const SkeletonBlog = memo(() => (
  <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="mb-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">Blog</p>
        <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
          Latest Insights
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="group flex flex-col items-center text-center">
            <div className="mb-8 aspect-square w-full rounded-3xl bg-[var(--secondary)]/60 text-[var(--primary)] skeleton" />
            <h3 className="font-display text-xl md:text-2xl font-medium text-[var(--primary)] leading-tight skeleton" />
            <p className="mt-2 text-sm text-[var(--primary)]/60 leading-relaxed skeleton" />
          </div>
        ))}
      </div>
    </div>
  </section>
))

SkeletonBlog.displayName = 'SkeletonBlog'

const ErrorBlog = memo(({ onRetry }) => (
  <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="text-center py-12">
        <p className="font-display text-xl text-[var(--primary)]/60 mb-4">Unable to load blog</p>
        <button onClick={onRetry} className="btn-luxury-primary inline-flex items-center gap-2">
          Retry
          <ArrowRight size={14} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  </section>
))

ErrorBlog.displayName = 'ErrorBlog'

export const BlogSection = memo(() => {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadBlogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/blog')
      setBlogs(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setError(err?.message || 'Failed to load blog')
      console.warn('[BLOG SECTION] Failed to load:', err?.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBlogs()
  }, [loadBlogs])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'blog-changed') {
        import('@services/api').then(({ clearApiCache }) => clearApiCache('/blog'))
        loadBlogs()
      }
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadBlogs])

  if (loading) return <SkeletonBlog />
  if (error) return <ErrorBlog onRetry={loadBlogs} />

  const displayBlogs = blogs.slice(0, 3)

  return (
    <section id="blog" className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-20 md:py-32">
      <div className="container-wide">
        <div className="mb-16 md:mb-24 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">Blog</p>
          <h2 className="font-display text-4xl font-medium leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
            Latest Insights
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
            Discover the latest trends in interior design, furniture, and virtual design from HOK Interiors.
          </p>
        </div>

        {displayBlogs.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-2xl text-[var(--primary)]/30">No blog posts yet</p>
            <p className="text-sm text-[var(--primary)]/40 mt-2">Check back soon for new content</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
            {displayBlogs.map((item, i) => (
              <Link
                key={item._id || item.id || i}
                to={`/blog/${item._id || item.id}`}
                className="group block bg-white rounded-3xl overflow-hidden shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={getOptimizedUrl(item.imageUrl, { width: 800, crop: 'limit' })}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[var(--bg)] to-[var(--secondary)]/30 flex items-center justify-center text-[var(--primary)]/30">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2h10" />
                        <line x1="8" y1="7" x2="16" y2="7" />
                        <line x1="8" y1="11" x2="13" y2="11" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-6 md:p-8">
                  <h3 className="font-display text-xl text-[var(--primary)] leading-tight line-clamp-2">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="mt-3 text-sm leading-relaxed text-[var(--primary)]/60 line-clamp-3">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--accent)]">
                    {item.published && <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">Published</span>}
                    {item.featured && <span className="px-2 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">Featured</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link to="/blog" className="btn-luxury-primary group inline-flex items-center gap-2">
            View All Posts
            <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  )
})

BlogSection.displayName = 'BlogSection'

export default BlogSection
