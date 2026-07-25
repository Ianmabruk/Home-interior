import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'
import { getOptimizedUrl, buildSrcSet } from '../../utils/cloudinaryHelpers'
import { ScrollReveal } from '../../utils/scrollReveal'

const ProjectCard = ({ item }) => (
  <article className="group cursor-pointer bg-white rounded-3xl overflow-hidden shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500">
    <Link
      to={`/portfolio/${item.id}`}
      className="block"
      aria-label={`View ${item.title} project`}
    >
      <div className="relative aspect-square overflow-hidden">
        {item.imageUrl ? (
          <img
            src={getOptimizedUrl(item.imageUrl, { width: 800, crop: 'limit' })}
            srcSet={buildSrcSet(item.imageUrl) || undefined}
            sizes={buildSrcSet(item.imageUrl) ? '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw' : undefined}
            alt={item.title}
            className="h-full w-full object-cover transition duration-[1.2s] ease-out group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="h-full w-full bg-[var(--secondary)]/30" />
        )}
        {item.featured && (
          <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] text-white text-[10px] font-semibold uppercase tracking-widest rounded-full shadow-lg">
            Featured
          </span>
        )}
      </div>

      <div className="p-6 md:p-8 border-t border-[var(--border)]/40 bg-white text-center">
        <h3 className="font-display text-2xl md:text-3xl font-normal text-[var(--primary)] leading-tight mb-6">
          {item.title}
        </h3>
        <button
          type="button"
          className="btn-luxury-primary group inline-flex items-center gap-2 text-[11px] px-8 py-3 rounded-full whitespace-nowrap hover:scale-105 active:scale-95"
        >
          View Project
          <ArrowRight size={12} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </Link>
  </article>
)

export const PortfolioPage = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const loadPortfolio = () => {
    api.get('/portfolio')
      .then((res) => setItems(res.data || []))
      .catch((err) => {
        console.warn('[PORTFOLIO] Failed to load:', err?.message)
        setItems([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadPortfolio() }, [])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'portfolio-changed') loadPortfolio()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [])

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <section className="py-16 md:py-24 px-6 md:px-12 lg:px-20">
        <div className="container-wide text-center">
          <div className="mb-12 md:mb-16 flex flex-col items-center">
            <div className="relative w-[150px] h-[150px] mx-auto mb-8">
              {items.length > 0 && items[0]?.imageUrl ? (
                <img
                  src={getOptimizedUrl(items[0].imageUrl, { width: 300, height: 300, crop: 'fill' })}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover shadow-lg border-4 border-white"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-[var(--secondary)]/30 border-4 border-white flex items-center justify-center">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--primary)]/30" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M12 14c-4.418 0-8 3.582-8 8h16c0-4.418-3.582-8-8-8z" />
                  </svg>
                </div>
              )}
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-normal text-[var(--primary)] leading-tight">
              Your Projects
            </h1>
          </div>
        </div>
      </section>

      <section className="section-pad bg-[var(--bg)] pt-8">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          {loading && (
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="group">
                  <div className="skeleton aspect-square w-full rounded-3xl" />
                  <div className="mt-6 space-y-2 text-center">
                    <div className="skeleton h-8 w-48 mx-auto" />
                    <div className="skeleton h-10 w-32 mx-auto" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="py-24 text-center">
              <p className="font-display text-3xl text-[var(--primary)]/30">No projects found</p>
            </div>
          )}

          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <ScrollReveal key={item.id}>
                <ProjectCard item={item} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}