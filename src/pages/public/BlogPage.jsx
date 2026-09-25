import { useState, useEffect, useCallback, memo } from 'react'
import { motion } from '@components/common/DynamicMotion'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { api, clearApiCache } from '@services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'
import { SectionErrorBoundary } from '@components/home/SectionErrorBoundary'
import BlogCard from '@components/blog/BlogCard'

const SkeletonCard = () => (
  <div className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-[0_2px_16px_rgba(42,36,31,0.04)]">
    <div className="aspect-square w-full skeleton rounded-3xl" />
    <div className="p-5 flex-1 flex flex-col">
      <div className="skeleton h-4 w-2/3 rounded-lg mb-4" />
      <div className="mt-auto">
        <div className="skeleton h-9 w-28 rounded-xl" />
      </div>
    </div>
  </div>
)

const SkeletonGrid = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
)

export const BlogPage = memo(() => {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()

  const searchTerm = searchParams.get('search') || ''
  const currentPage = parseInt(searchParams.get('page') || '1', 10)

  const loadBlogs = useCallback(async () => {
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '12',
        sort: 'createdAt:desc',
      })
      if (searchTerm) params.set('search', searchTerm)

      const res = await api.get(`/blog?${params.toString()}`)
      const data = Array.isArray(res.data) ? res.data : res.data?.items || []
      setBlogs(data)
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return
      console.warn('[BlogPage] Failed to load blogs:', err?.message)
      setError(err)
      setBlogs([])
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm])

  const retry = useCallback(() => {
    setLoading(true)
    loadBlogs()
  }, [loadBlogs])

  useEffect(() => {
    loadBlogs()
  }, [loadBlogs])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'blog-changed') {
        clearApiCache('/blog')
        loadBlogs()
      }
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadBlogs])

  useEffect(() => {
    const handleOnline = () => {
      if (error) retry()
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [error, retry])

  const handleSearch = (e) => {
    const value = e.target.value.trim()
    if (value) {
      setSearchParams({ search: value, page: '1' })
    } else {
      const newParams = { ...searchParams }
      delete newParams.search
      newParams.page = '1'
      setSearchParams(newParams)
    }
  }

  const clearSearch = () => {
    const newParams = { ...searchParams }
    delete newParams.search
    newParams.page = '1'
    setSearchParams(newParams)
  }

  const hasActiveFilters = !!searchTerm

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <PageMeta
        title="HOK Interiors Blog"
        description="Explore the latest trends in interior design, furniture, and virtual design from HOK Interiors."
      />

      {/* SEARCH — first meaningful element, nothing above it */}
      <div className="container-wide mx-auto px-6 md:px-12 lg:px-20 pt-8 pb-6">
        <div className="max-w-xl mx-auto">
          <div className="relative">
            <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary)]/30" />
            <input
              type="text"
              placeholder="Search articles..."
              defaultValue={searchTerm}
              onChange={handleSearch}
              className="w-full rounded-xl border border-border/50 bg-white pl-12 pr-12 py-3.5 text-sm text-[var(--primary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--primary)]/30 hover:text-[var(--primary)]/60 text-sm"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ARTICLE GRID — immediately below search */}
      <SectionErrorBoundary sectionName="BlogGrid">
        <div className="container-wide mx-auto px-6 md:px-12 lg:px-20 pb-12 md:pb-20">
          {error && blogs.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-display text-2xl text-[var(--primary)]/30 mb-3">Unable to load blog posts</p>
              <p className="text-sm text-[var(--primary)]/40 mb-4">Please check your connection and try again.</p>
              <button onClick={retry} className="btn-luxury-primary">Retry</button>
            </div>
          ) : loading ? (
            <SkeletonGrid />
          ) : blogs.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-display text-2xl text-[var(--primary)]/30 mb-3">No articles found.</p>
              <p className="text-sm text-[var(--primary)]/40">
                {hasActiveFilters
                  ? 'Try adjusting your search.'
                  : 'Check back soon for new content.'}
              </p>
              {hasActiveFilters && (
                <button onClick={clearSearch} className="btn-luxury-primary mt-4 inline-flex items-center gap-2">
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {blogs.map((item, i) => (
                <motion.div
                  key={item.id || item._id || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.05,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <BlogCard blog={item} priority={i < 6} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </SectionErrorBoundary>
    </main>
  )
})

BlogPage.displayName = 'BlogPage'

export default BlogPage