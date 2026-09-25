import { useState, useEffect, useCallback, memo } from 'react'
import { motion } from '@components/common/DynamicMotion'
import { useSearchParams } from 'react-router-dom'
import { Search, Tag } from 'lucide-react'
import { api, clearApiCache } from '@services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'
import { SectionErrorBoundary } from '@components/home/SectionErrorBoundary'
import BlogCard from '@components/blog/BlogCard'
import { useIsMobile } from '@hooks/useIsMobile'

const SkeletonGrid = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-[0_2px_16px_rgba(42,36,31,0.04)]">
        <div className="relative aspect-[4/3] w-full rounded-3xl skeleton mb-4" />
        <div className="px-6 md:px-8 pb-6 flex-1 flex flex-col">
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <div className="skeleton h-3 w-12 rounded" />
            <div className="skeleton h-3 w-16 rounded" />
          </div>
          <div className="skeleton h-5 w-3/4 rounded-lg mb-3" />
          <div className="skeleton h-4 w-full rounded-lg mb-2" />
          <div className="skeleton h-4 w-full rounded-lg mb-2" />
          <div className="skeleton h-4 w-1/2 rounded-lg mt-auto mb-4" />
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton h-3 w-14 rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

export const BlogPage = memo(() => {
  const [blogs, setBlogs] = useState([])
  const [featuredBlog, setFeaturedBlog] = useState(null)
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [error, setError] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const reduceMotion = useIsMobile()

  const searchTerm = searchParams.get('search') || ''
  const activeCategory = searchParams.get('category') || ''
  const activeTag = searchParams.get('tag') || ''
  const currentPage = parseInt(searchParams.get('page') || '1', 10)

  const loadMeta = useCallback(async () => {
    try {
      const res = await api.get('/blog/categories')
      if (res.data) {
        setCategories(res.data.categories || [])
        setTags(res.data.tags || [])
      }
    } catch (err) {
      console.warn('[BlogPage] Failed to load categories/tags:', err?.message)
    } finally {
      setLoadingMeta(false)
    }
  }, [])

const loadBlogs = useCallback(async () => {
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '12',
      })
      if (searchTerm) params.set('search', searchTerm)
      if (activeCategory) params.set('category', activeCategory)
      if (activeTag) params.set('tag', activeTag)
      params.set('sort', 'createdAt:desc')

      const res = await api.get(`/blog?${params.toString()}`)
      const data = Array.isArray(res.data) ? res.data : res.data?.items || []
      setBlogs(data)

      const featured = data.find((b) => b.featured) || data[0] || null
      setFeaturedBlog(featured)
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return
      console.warn('[BlogPage] Failed to load blogs:', err?.message)
      setError(err)
      // CRITICAL: Only clear blogs on a genuine fetch failure.
      // Do NOT clear them when the API returns 200 with zero results.
      // The error handler is only reached when the API call itself failed.
      setBlogs([])
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, activeCategory, activeTag])

  const retry = useCallback(() => {
    setLoading(true)
    setLoadingMeta(true)
    loadBlogs()
    loadMeta()
  }, [loadBlogs, loadMeta])

  useEffect(() => {
    loadBlogs()
  }, [loadBlogs])

  useEffect(() => {
    loadMeta()
  }, [loadMeta])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'blog-changed') {
        clearApiCache('/blog')
        loadBlogs()
        loadMeta()
      }
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadBlogs, loadMeta])

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

  const handleCategory = (cat) => {
    if (cat === activeCategory) {
      const newParams = { ...searchParams }
      delete newParams.category
      setSearchParams(newParams)
    } else {
      setSearchParams({ category: cat, page: '1' })
    }
  }

  const handleTag = (tag) => {
    if (tag === activeTag) {
      const newParams = { ...searchParams }
      delete newParams.tag
      setSearchParams(newParams)
    } else {
      setSearchParams({ tag, page: '1' })
    }
  }

  const clearFilters = () => {
    setSearchParams({})
  }

  const hasActiveFilters = searchTerm || activeCategory || activeTag
  const displayBlogs = featuredBlog ? blogs.filter((b) => (b.id || b._id) !== (featuredBlog.id || featuredBlog._id)) : blogs

  useEffect(() => {
    const blogListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'HOK Interiors Blog',
      description: 'Design insights, trends, and inspiration from HOK Interiors.',
      url: 'https://hokinteriors.com/blog',
      itemListElement: displayBlogs.slice(0, 12).map((blog, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `https://hokinteriors.com/blog/${blog.slug || blog.id}`,
        name: blog.title,
      })),
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(blogListSchema)
    script.setAttribute('data-structured-data', 'blog-list')
    document.head.appendChild(script)

    const existing = document.querySelector('script[data-structured-data="blog-list"]')
    if (existing && existing !== script) existing.remove()

    return () => {
      const el = document.querySelector('script[data-structured-data="blog-list"]')
      if (el) el.remove()
    }
  }, [displayBlogs])

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <PageMeta
        title="HOK Interiors Blog"
        description="Explore the latest trends in interior design, furniture, and virtual design from HOK Interiors."
      />

      <div className="container-wide mx-auto px-6 md:px-12 lg:px-20 py-12 md:py-20">
        {/* Search + Categories */}
        <SectionErrorBoundary sectionName="BlogControls">
          <div className="mb-8 space-y-6">
            <div className="relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary)]/30" />
              <input
                type="text"
                placeholder="Search articles..."
                defaultValue={searchTerm}
                onChange={handleSearch}
                className="w-full rounded-xl border border-border/50 bg-white pl-12 pr-4 py-3 text-sm text-[var(--primary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 outline-none"
              />
            </div>

            {!loadingMeta && categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={clearFilters}
                  className={`text-xs font-medium rounded-full px-4 py-2 transition-all ${
                    !hasActiveFilters
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--secondary)]/20 text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategory(cat)}
                    className={`text-xs font-medium rounded-full px-4 py-2 transition-all ${
                      activeCategory === cat
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[var(--secondary)]/20 text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {!loadingMeta && tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.slice(0, 12).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTag(tag)}
                    className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-all ${
                      activeTag === tag
                        ? 'bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30'
                        : 'bg-[var(--secondary)]/10 text-[var(--primary)]/50 hover:bg-[var(--secondary)]/20 hover:text-[var(--primary)]/70 border border-transparent'
                    }`}
                  >
                    <Tag size={10} />
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </SectionErrorBoundary>

        {/* Blog Grid */}
        <SectionErrorBoundary sectionName="BlogGrid">
          {error && blogs.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-display text-2xl text-[var(--primary)]/30 mb-3">Unable to load blog posts</p>
              <p className="text-sm text-[var(--primary)]/40 mb-4">Please check your connection and try again.</p>
              <button onClick={retry} className="btn-luxury-primary">Retry</button>
            </div>
          ) : loading ? (
            <SkeletonGrid />
          ) : displayBlogs.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-display text-2xl text-[var(--primary)]/30 mb-3">No blog posts found</p>
              <p className="text-sm text-[var(--primary)]/40">
                {hasActiveFilters ? 'Try adjusting your search or filters.' : 'Check back soon for new content.'}
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn-luxury-primary mt-4 inline-flex items-center gap-2">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
              {displayBlogs.map((item, i) => (
                <motion.div
                  key={item.id || item._id || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: reduceMotion ? 0 : i * 0.05,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="h-full"
                >
                  <BlogCard blog={item} priority={i < 6} />
                </motion.div>
              ))}
            </div>
          )}
        </SectionErrorBoundary>
      </div>
    </main>
  )
})

BlogPage.displayName = 'BlogPage'

export default BlogPage
