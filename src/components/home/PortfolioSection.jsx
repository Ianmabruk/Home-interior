import { useState, useEffect, useCallback, memo } from 'react'
import { api } from '@services/api'
import { HorizontalPortfolioCarousel } from '@components/portfolio/HorizontalPortfolioCarousel'
import { getProjectImage } from '@utils/homepageHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const SkeletonPortfolio = memo(() => (
  <section className="bg-[var(--secondary)]/30 px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="mb-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Portfolio</p>
        <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
          Featured Projects
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
        {[1, 2, 3, 4].map((i) => (
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
))

SkeletonPortfolio.displayName = 'SkeletonPortfolio'

const ErrorPortfolio = memo(({ onRetry }) => (
  <section className="bg-[var(--secondary)]/30 px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="text-center py-12">
        <p className="font-display text-xl text-[var(--primary)]/60 mb-4">Unable to load portfolio</p>
        <button
          onClick={onRetry}
          className="btn-luxury-primary inline-flex items-center gap-2"
        >
          Retry
          <ArrowRight size={14} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  </section>
))

ErrorPortfolio.displayName = 'ErrorPortfolio'

export const PortfolioSection = memo(({ portfolio = [] }) => {
  const [data, setData] = useState(portfolio)
  const [loading, setLoading] = useState(!portfolio.length)
  const [error, setError] = useState(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/portfolio')
      setData(res.data || [])
    } catch (err) {
      setError(err?.message || 'Failed to load portfolio')
      console.warn('[PORTFOLIO SECTION] Failed to load:', err?.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!portfolio.length) loadData()
  }, [portfolio.length, loadData])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'portfolio-changed') loadData()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadData])

  if (loading) return <SkeletonPortfolio />
  if (error) return <ErrorPortfolio onRetry={loadData} />

  return (
    <section id="portfolio">
      <HorizontalPortfolioCarousel portfolio={data} getProjectImage={getProjectImage} />
      <div className="mt-12 text-center">
        <Link to="/portfolio" className="btn-luxury-primary group inline-flex items-center gap-2">
          View All Projects
          <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  )
})

PortfolioSection.displayName = 'PortfolioSection'

export default PortfolioSection