import { useEffect, useState } from 'react'
import { ArrowRight, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'
import { getOptimizedUrl, getOptimizedVideoUrl, getVideoPosterUrl } from '../../utils/cloudinaryHelpers'
import LazyVideo from '../../components/common/LazyVideo'
import { PageMeta } from '../../hooks/usePageMeta'

const VirtualDesignCard = ({ item }) => (
  <article className="group cursor-pointer bg-white rounded-3xl overflow-hidden shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500">
    <Link
      to={`/virtual-design/project/${item.id}`}
      className="block"
      aria-label={`View ${item.title} project`}
    >
      <div className="relative aspect-square overflow-hidden">
        {item.mediaType === 'video' && item.mediaUrl ? (
          <>
            <LazyVideo
              src={getOptimizedVideoUrl(item.mediaUrl, { width: 1200 })}
              poster={getVideoPosterUrl(item.mediaUrl, { width: 1200 })}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <button
              className="absolute right-3 bottom-3 flex h-11 w-11 items-center justify-center bg-white/90 text-[var(--primary)] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white shadow-lg hover:scale-110"
              aria-label="Play video"
            >
              <Play size={20} strokeWidth={1.5} className="ml-1" />
            </button>
          </>
        ) : item.imageUrl ? (
          <img
            src={getOptimizedUrl(item.imageUrl, { width: 1200, crop: 'limit' })}
            alt={item.title}
            className="h-full w-full object-cover bg-[var(--bg)] transition duration-700 group-hover:scale-105"
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

export const VirtualDesignPage = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const loadVirtualDesigns = () => {
    api.get('/virtual-design')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.items || []
        setItems(data)
      })
      .catch((err) => {
        console.warn('[VIRTUAL] Failed to load projects:', err?.message)
        setItems([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadVirtualDesigns() }, [])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'virtual-changed') loadVirtualDesigns()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [])

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <PageMeta title="Virtual Design — HOK Interior Designs" description="Experience your dream space with immersive 3D virtual design services." />
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
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                </div>
              )}
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-normal text-[var(--primary)] leading-tight">
              Virtual Design Projects
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
              <VirtualDesignCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default VirtualDesignPage