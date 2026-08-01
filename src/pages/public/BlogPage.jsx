import { useState, useEffect, useCallback, memo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { api } from '@services/api'
import { getOptimizedUrl, buildSrcSet } from '@utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'
import { SectionErrorBoundary } from '@components/home/SectionErrorBoundary'
import { useIsMobile } from '@hooks/useIsMobile'

const SkeletonBlog = () => (
  <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="mb-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">Blog</p>
        <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
          Latest Insights
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="group flex flex-col items-center text-center">
            <div className="mb-8 aspect-square w-full rounded-3xl bg-[var(--secondary)]/60 text-[var(--primary)] skeleton" />
            <h3 className="font-display text-xl md:text-2xl font-medium text-[var(--primary)] leading-tight skeleton" />
            <p className="mt-2 text-sm text-[var(--primary)]/60 leading-relaxed skeleton" />
          </div>
        ))}
      </div>
    </div>
  </section>
)

export const BlogPage = memo(() => {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const reduceMotion = useIsMobile()

  const loadBlogs = useCallback(async () => {
    try {
      const res = await api.get('/blog')
      setBlogs(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.warn('[BLOG] Failed to load:', err?.message)
      setBlogs([])
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

  if (loading) {
    return (
      <main>
        <SectionErrorBoundary sectionName="Blog" fallback={<SkeletonBlog />}>
          <SkeletonBlog />
        </SectionErrorBoundary>
      </main>
    )
  }

  return (
    <main>
      <PageMeta
        title="HOK Interiors Blog — Design Insights & Inspiration"
        description="Explore the latest trends in interior design, furniture, and virtual design from HOK Interiors."
      />

      {/* Hero Section */}
      <section className="relative w-full h-[60vh] min-h-[400px] overflow-hidden bg-[var(--primary)] flex items-center justify-center">
        <div className="absolute inset-0 bg-[var(--primary)]" />
        <div className="relative z-10 text-center px-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">Blog</p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight text-white">
            Latest Insights
          </h1>
          <p className="mt-4 text-sm md:text-base text-white/60 max-w-lg mx-auto">
            Discover the latest trends in interior design, furniture, and virtual design from HOK Interiors.
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <SectionErrorBoundary sectionName="BlogGrid" fallback={<div className="py-20 text-center text-[var(--primary)]/50">No blog posts available yet.</div>}>
        <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-20 md:py-32">
          <div className="container-wide">
            {blogs.length === 0 ? (
              <div className="text-center py-20">
                <p className="font-display text-2xl text-[var(--primary)]/30">No blog posts yet</p>
                <p className="text-sm text-[var(--primary)]/40 mt-2">Check back soon for new content</p>
              </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
                  {blogs.map((item, i) => (
                    <motion.article
                      key={item._id || item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reduceMotion ? 0 : i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="group bg-white rounded-3xl overflow-hidden shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500"
                    >
                     <Link to={`/blog/${item.id || item._id}`} className="block">
                       <div className="relative aspect-[4/3] overflow-hidden">
                       {item.imageUrl ? (
                         <img
                           src={getOptimizedUrl(item.imageUrl, { width: 800, crop: 'limit' })}
                           srcSet={buildSrcSet(item.imageUrl) || undefined}
                           sizes={buildSrcSet(item.imageUrl) ? '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw' : undefined}
                           alt={item.title}
                           className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                           loading="lazy"
                           decoding="async"
                           width={800}
                           height={600}
                         />
                       ) : (
                        <div className="h-full w-full bg-gradient-to-br from-[var(--bg)] to-[var(--secondary)]/30 flex items-center justify-center text-[var(--primary)]/30">
                          <div className="w-16 h-16 rounded-full bg-[var(--secondary)]/40 flex items-center justify-center text-[var(--primary)]/20">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2h10" />
                              <line x1="8" y1="7" x2="16" y2="7" />
                              <line x1="8" y1="11" x2="13" y2="11" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    </Link>
                    <div className="p-6 md:p-8">
                      <h3 className="font-display text-xl text-[var(--primary)] leading-tight line-clamp-2">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="mt-3 text-sm leading-relaxed text-[var(--primary)]/60 line-clamp-3">
                          {item.description}
                        </p>
                      )}
                      {item.videoUrl && (
                        <div className="mt-4">
                          <video src={item.videoUrl} className="w-full rounded-xl" controls preload="metadata" />
                        </div>
                      )}
                      <div className="mt-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--accent)]">
                        {item.published && <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">Published</span>}
                        {item.featured && <span className="px-2 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">Featured</span>}
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </div>
        </section>
      </SectionErrorBoundary>
    </main>
  )
})

BlogPage.displayName = 'BlogPage'

export default BlogPage
