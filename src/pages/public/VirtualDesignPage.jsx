import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '@services/api'
import { getOptimizedUrl } from '@utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'
import { getProjectImage } from '@utils/homepageHelpers'

const SkeletonVirtualDesign = () => (
  <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--secondary)]/20 via-[var(--bg)] to-[var(--accent)]/5 px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="mb-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">Virtual Designs</p>
        <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
          Virtual Interior Designs
        </h2>
      </div>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
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
)

export const VirtualDesignPage = () => {
  const [designs, setDesigns] = useState([])
  const [loading, setLoading] = useState(true)

  const loadDesigns = useCallback(async () => {
    try {
      const res = await api.get('/virtual-design')
      setDesigns(res.data || [])
    } catch (err) {
      console.warn('[VIRTUAL DESIGN] Failed to load:', err?.message)
      setDesigns([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDesigns()
  }, [loadDesigns])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'virtual-changed') loadDesigns()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadDesigns])

  if (loading) {
    return <main><SkeletonVirtualDesign /></main>
  }

  return (
    <main>
      <PageMeta
        title="Virtual Design — HOK Interior Designs"
        description="Experience your dream space with immersive 3D virtual design services."
      />
      <section className="px-6 md:px-12 lg:px-20 py-20 md:py-32">
        <div className="container-wide">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {designs.map((item, index) => (
              <motion.div
                key={item.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="group"
              >
                <Link to={`/virtual-design/${item.id}`} className="block">
                  <div className="relative w-full mb-4">
                    <div className="relative rounded-3xl overflow-hidden bg-[var(--secondary)]/30">
                      <img
                        src={getOptimizedUrl(getProjectImage(item), { width: 600, crop: 'limit' })}
                        alt={item.title}
                        className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/40 via-transparent to-transparent pointer-events-none" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="font-display text-xl font-medium text-[var(--primary)] leading-tight group-hover:text-[var(--accent)] transition-colors">
                      {item.title}
                    </h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {designs.length === 0 && (
            <div className="text-center py-20">
              <p className="font-display text-xl text-[var(--primary)]/60">No virtual designs available at the moment.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default VirtualDesignPage