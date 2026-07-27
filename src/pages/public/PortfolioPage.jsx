import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '@services/api'
import { getOptimizedUrl } from '@utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'
import { getProjectImage } from '@utils/homepageHelpers'

const SkeletonPortfolio = () => (
  <section className="bg-[var(--secondary)]/30 px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="mb-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Portfolio</p>
        <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
          Featured Projects
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="group relative bg-white border border-[var(--border)]/40 overflow-hidden rounded-3xl">
            <div className="aspect-[3/4] skeleton" />
            <div className="p-5 border-t border-[var(--border)]/40">
              <div className="skeleton h-3 w-20 mb-3" />
              <div className="skeleton h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

export const PortfolioPage = () => {
  const [portfolio, setPortfolio] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const loadPortfolio = useCallback(async () => {
    try {
      const res = await api.get('/portfolio')
      setPortfolio(res.data || [])
    } catch (err) {
      console.warn('[PORTFOLIO] Failed to load:', err?.message)
      setPortfolio([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPortfolio()
  }, [loadPortfolio])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'portfolio-changed') loadPortfolio()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadPortfolio])

  const filteredPortfolio = useMemo(() => {
    return portfolio.filter((item) => {
      const matchesFilter = filter === 'all' || item.category === filter
      const matchesSearch = !searchQuery || item.title?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [portfolio, filter, searchQuery])

  const categories = useMemo(() => {
    const cats = new Set(portfolio.map((item) => item.category).filter(Boolean))
    return ['all', ...cats]
  }, [portfolio])

  if (loading) {
    return (
      <main>
        <SkeletonPortfolio />
      </main>
    )
  }

  return (
    <main>
      <PageMeta
        title="Portfolio — HOK Interior Designs"
        description="Explore our curated portfolio of luxury interior design projects."
      />
      <section className="relative min-h-[60vh] md:min-h-[70vh] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)] via-[var(--primary)]/80 to-[var(--bg)]" />
        <div className="relative z-10 container-wide px-6 md:px-12 lg:px-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl md:text-7xl lg:text-8xl font-semibold text-white leading-tight"
          >
            Portfolio
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-lg md:text-xl text-white/70 max-w-3xl mx-auto"
          >
            A curated collection of our most distinguished interior design projects, each telling a unique story of elegance and craftsmanship.
          </motion.p>
        </div>
      </section>

      <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-12 md:py-16">
        <div className="container-wide">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
            <div className="flex flex-wrap items-center gap-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium uppercase tracking-wide transition-all duration-300 ${
                    filter === cat
                      ? 'bg-[var(--primary)] text-white shadow-[0_4px_16px_rgba(42,36,31,0.2)]'
                      : 'bg-white border border-[var(--border)] text-[var(--primary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[var(--border)] bg-white text-sm text-[var(--primary)] placeholder:text-[var(--primary)]/40 outline-none focus:border-[var(--accent)]"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--primary)]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth={1.5} />
                <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth={1.5} />
              </svg>
            </div>
          </div>

          {filteredPortfolio.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--secondary)]/30 text-[var(--primary)]/30">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              </div>
              <h3 className="font-display text-2xl md:text-3xl text-[var(--primary)] mb-2">No projects found</h3>
              <p className="text-[var(--primary)]/60 max-w-md">Try adjusting your filters or search terms to find what you're looking for.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                {filteredPortfolio.map((item, index) => (
                  <motion.article
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className="group relative bg-white border border-[var(--border)]/40 overflow-hidden rounded-3xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(42,36,31,0.1)] transition-all duration-500"
                  >
                    <Link to={`/portfolio/${item.id}`} className="block">
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <img
                          src={getOptimizedUrl(getProjectImage(item), { width: 600, crop: 'limit' })}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        {item.category && (
                          <div className="absolute top-4 left-4 z-10">
                            <span className="inline-block px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]">
                              {item.category}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-5 border-t border-[var(--border)]/40">
                        <h3 className="font-display text-xl md:text-2xl font-medium text-[var(--primary)] leading-tight group-hover:text-[var(--accent)] transition-colors">
                          {item.title}
                        </h3>
                        {item.location && (
                          <p className="mt-1 text-sm text-[var(--primary)]/60 flex items-center gap-1">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            {item.location}
                          </p>
                        )}
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>

              {filteredPortfolio.length < portfolio.length && (
                <div className="mt-12 text-center">
                  <p className="text-[var(--primary)]/60">
                    Showing {filteredPortfolio.length} of {portfolio.length} projects
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  )
}

export default PortfolioPage