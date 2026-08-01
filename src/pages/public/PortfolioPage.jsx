import { useState, useEffect, useCallback, memo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '@services/api'
import { getOptimizedUrl, buildSrcSet } from '@utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'
import { getProjectImage } from '@utils/homepageHelpers'
import { useIsMobile } from '@hooks/useIsMobile'

const SkeletonPortfolio = () => (
  <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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

export const PortfolioPage = memo(() => {
  const [portfolio, setPortfolio] = useState([])
  const [loading, setLoading] = useState(true)
  const reduceMotion = useIsMobile()

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

  if (loading) {
    return <main><SkeletonPortfolio /></main>
  }

  return (
    <main>
      <PageMeta
        title="Portfolio — HOK Interior Designs"
        description="Explore our curated portfolio of luxury interior design projects."
      />
      <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center">
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
        </div>
      </section>

      <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-12 md:py-16">
        <div className="container-wide">
          {portfolio.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--secondary)]/30 text-[var(--primary)]/30">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              </div>
              <h3 className="font-display text-2xl md:text-3xl text-[var(--primary)] mb-2">No projects found</h3>
              <p className="text-[var(--primary)]/60 max-w-md">Projects will appear here once added from the admin dashboard.</p>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {portfolio.map((item, index) => (
                <motion.article
                  key={item._id || item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: reduceMotion ? 0 : index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative bg-white border border-[var(--border)]/40 overflow-hidden rounded-3xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(42,36,31,0.1)] transition-all duration-500"
                >
                  <Link to={`/portfolio/${item.id}`} className="block">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={getOptimizedUrl(getProjectImage(item), { width: 600, crop: 'limit' })}
                        srcSet={buildSrcSet(getProjectImage(item)) || undefined}
                        sizes={buildSrcSet(getProjectImage(item)) ? '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw' : undefined}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                        width={600}
                        height={800}
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
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
})

PortfolioPage.displayName = 'PortfolioPage'

export default PortfolioPage