import { useState, useEffect, useCallback, memo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '@services/api'
import { getOptimizedUrl, buildSrcSet } from '@utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'
import { getProjectImage } from '@utils/homepageHelpers'

const SITE_URL = 'https://hokinteriors.com'

const SkeletonPortfolio = () => (
  <section className="bg-[var(--bg)] px-4 md:px-8 py-12 md:py-20">
    <div className="max-w-2xl mx-auto space-y-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          <div className="skeleton aspect-[3/4] w-full rounded-2xl" />
          <div className="space-y-2 px-2">
            <div className="skeleton h-3 w-16" />
            <div className="skeleton h-7 w-full" />
          </div>
        </div>
      ))}
    </div>
  </section>
)

export const PortfolioPage = memo(() => {
  const [portfolio, setPortfolio] = useState([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: SITE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Portfolio',
          item: `${SITE_URL}/portfolio`,
        },
      ],
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(breadcrumbSchema)
    script.setAttribute('data-structured-data', 'portfolio-breadcrumb')
    document.head.appendChild(script)

    const existing = document.querySelector('script[data-structured-data="portfolio-breadcrumb"]')
    if (existing && existing !== script) existing.remove()

    return () => {
      const el = document.querySelector('script[data-structured-data="portfolio-breadcrumb"]')
      if (el) el.remove()
    }
  }, [])

  if (loading) {
    return <main><SkeletonPortfolio /></main>
  }

  return (
    <main>
      <PageMeta
        title="Portfolio — HOK Interior Designs"
        description="Explore our curated portfolio of luxury interior design projects."
      />
      <section className="relative min-h-[40vh] md:min-h-[50vh] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)] via-[var(--primary)]/90 to-[var(--bg)]" />
        <div className="relative z-10 px-6 md:px-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl md:text-7xl font-semibold text-white leading-tight"
          >
            Portfolio
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 text-white/70 text-lg md:text-xl max-w-xl mx-auto"
          >
            Explore our curated collection of luxury interior design projects
          </motion.p>
        </div>
      </section>

      <section className="bg-[var(--bg)] px-4 md:px-8 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {portfolio.map((item, index) => {
                const heroImage = getProjectImage(item)
                const beforeImages = Array.isArray(item.beforeImages) ? item.beforeImages.filter(Boolean) : []
                const afterImages = Array.isArray(item.afterImages) ? item.afterImages.filter(Boolean) : []

                return (
                  <motion.article
                    key={item._id || item.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="group bg-white border border-[var(--border)]/40 rounded-3xl overflow-hidden shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500"
                  >
                    <Link to={`/portfolio/${item.id}`} className="block">
                      <div className="relative aspect-[3/4] overflow-hidden">
                        {heroImage ? (
                          <img
                            src={getOptimizedUrl(heroImage, { width: 800, crop: 'limit' })}
                            srcSet={buildSrcSet(heroImage) || undefined}
                            sizes={buildSrcSet(heroImage) ? '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw' : undefined}
                            alt={item.title}
                            className="h-full w-full object-contain bg-[var(--secondary)]/10 transition-transform duration-700 group-hover:scale-105"
                            loading={index === 0 ? 'eager' : 'lazy'}
                            decoding="async"
                            width={800}
                            height={1000}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[var(--primary)]/20">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
                              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                              <circle cx="9" cy="9" r="2" />
                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/40 via-transparent to-transparent pointer-events-none" />
                        {item.category && (
                          <div className="absolute top-4 left-4 z-10">
                            <span className="inline-block px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm text-xs font-semibold uppercase tracking-widest text-[var(--primary)]">
                              {item.category}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="p-5 md:p-6 border-t border-[var(--border)]/40 bg-white">
                      <Link to={`/portfolio/${item.id}`}>
                        <h3 className="font-display text-xl md:text-2xl font-medium text-[var(--primary)] leading-tight group-hover:text-[var(--accent)] transition-colors">
                          {item.title}
                        </h3>
                      </Link>
                      {item.description && (
                        <p className="mt-2 text-sm text-[var(--primary)]/60 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      {(beforeImages.length > 0 || afterImages.length > 0) && (
                        <div className="mt-4 flex items-center gap-3">
                          {beforeImages.length > 0 && (
                            <Link
                              to={`/portfolio/${item.id}`}
                              className="flex-1 relative aspect-video rounded-xl overflow-hidden border border-[var(--border)]/40 bg-[var(--secondary)]/10"
                            >
                              <img
                                src={getOptimizedUrl(beforeImages[0], { width: 300, crop: 'limit' })}
                                alt="Before"
                                className="h-full w-full object-contain"
                                loading="lazy"
                                decoding="async"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-[var(--primary)]/20">
                                <span className="text-xs font-semibold uppercase tracking-widest text-white drop-shadow-md">Before</span>
                              </div>
                            </Link>
                          )}
                          {afterImages.length > 0 && (
                            <Link
                              to={`/portfolio/${item.id}`}
                              className="flex-1 relative aspect-video rounded-xl overflow-hidden border border-[var(--border)]/40 bg-[var(--secondary)]/10"
                            >
                              <img
                                src={getOptimizedUrl(afterImages[0], { width: 300, crop: 'limit' })}
                                alt="After"
                                className="h-full w-full object-contain"
                                loading="lazy"
                                decoding="async"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-[var(--accent)]/20">
                                <span className="text-xs font-semibold uppercase tracking-widest text-white drop-shadow-md">After</span>
                              </div>
                            </Link>
                          )}
                        </div>
                      )}

                      <Link
                        to={`/portfolio/${item.id}`}
                        className="mt-4 btn-luxury-primary inline-flex items-center gap-2 text-[10px] px-5 py-2.5 rounded-full active:scale-95 transition-transform"
                      >
                        View Project
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[var(--bg)] px-4 md:px-8 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/services" className="btn-luxury-secondary">Our Services</Link>
            <Link to="/contact" className="btn-luxury-primary">Start Your Project</Link>
          </div>
        </div>
      </section>
    </main>
  )
})

PortfolioPage.displayName = 'PortfolioPage'

export default PortfolioPage
