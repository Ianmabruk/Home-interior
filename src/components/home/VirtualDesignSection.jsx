import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { api } from '@services/api'
import { getOptimizedUrl } from '@utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const getVirtualDesignImage = (item) => {
  if (!item) return null
  return item.imageUrl || item.mediaUrl || item.mediaUrls?.[0] || item.galleryImages?.[0] || null
}

const SkeletonVirtualDesigns = memo(() => (
  <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--secondary)]/20 via-[var(--bg)] to-[var(--accent)]/5 px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="mb-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">Virtual Designs</p>
        <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
          Virtual Interior Designs
        </h2>
      </div>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="group">
            <div className="skeleton aspect-[4/3] w-full rounded-3xl" />
            <div className="mt-4 space-y-2">
              <div className="skeleton h-3 w-24" />
              <div className="skeleton h-6 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
))

SkeletonVirtualDesigns.displayName = 'SkeletonVirtualDesigns'

const ErrorVirtualDesigns = memo(({ onRetry }) => (
  <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--secondary)]/20 via-[var(--bg)] to-[var(--accent)]/5 px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="text-center py-12">
        <p className="font-display text-xl text-[var(--primary)]/60 mb-4">Unable to load virtual designs</p>
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

ErrorVirtualDesigns.displayName = 'ErrorVirtualDesigns'

export const VirtualDesignSection = memo(({ virtualDesigns = [] }) => {
  const [data, setData] = useState(virtualDesigns)
  const [loading, setLoading] = useState(!virtualDesigns.length)
  const [error, setError] = useState(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/virtual-design')
      setData(res.data || [])
    } catch (err) {
      setError(err?.message || 'Failed to load virtual designs')
      console.warn('[VIRTUAL DESIGN SECTION] Failed to load:', err?.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!virtualDesigns.length) loadData()
  }, [virtualDesigns.length, loadData])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'virtual-changed') loadData()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadData])

  const displayData = useMemo(() => data.slice(0, 6), [data])

  if (loading) return <SkeletonVirtualDesigns />
  if (error) return <ErrorVirtualDesigns onRetry={loadData} />
  if (!displayData.length) return null

  return (
    <section id="virtual-design" className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--secondary)]/20 py-20 md:py-32">
      <div className="container-wide md:px-12 lg:px-20">
        <div className="mb-16 md:mb-24 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Virtual Designs</p>
          <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
            Virtual Interior Designs
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
            Experience your dream space before it&apos;s built. Our virtual design service brings your vision to life with immersive 3D renderings and virtual walkthroughs.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
          {displayData.map((item, index) => (
            <div key={item.id || index} className="group flex flex-col items-center">
              <div className="relative w-full max-w-sm mx-auto mb-6">
                <div className="relative rounded-full overflow-hidden">
                  <img
                    src={getOptimizedUrl(getVirtualDesignImage(item), { width: 600, crop: 'limit' })}
                    alt={item.title}
                    className="h-[320px] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/20 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>
              <Link
                to={`/virtual-design/project/${item.id}`}
                className="w-full max-w-xs px-8 py-4 bg-[#E89A43] text-white text-base font-semibold uppercase tracking-wide rounded-full text-center whitespace-nowrap shadow-[0_4px_16px_rgba(232,154,67,0.4)] hover:shadow-[0_8px_24px_rgba(232,154,67,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                {item.title}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link to="/virtual-design" className="btn-luxury-primary group inline-flex items-center gap-2">
            View All Virtual Designs
            <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  )
})

VirtualDesignSection.displayName = 'VirtualDesignSection'

export default VirtualDesignSection