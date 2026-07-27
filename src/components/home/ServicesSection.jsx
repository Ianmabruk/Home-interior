import { useState, useEffect, useCallback, memo } from 'react'
import { api } from '@services/api'
import { CircularServicesGrid } from '@components/services/CircularServicesGrid'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const SkeletonServices = memo(() => (
  <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="mb-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">Services</p>
        <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
          What We Do
        </h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="group flex flex-col items-center text-center">
            <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--secondary)]/60 text-[var(--primary)] skeleton" />
            <h3 className="font-display text-xl md:text-2xl font-medium text-[var(--primary)] leading-tight skeleton" />
            <p className="mt-2 text-sm text-[var(--primary)]/60 leading-relaxed skeleton" />
          </div>
        ))}
      </div>
    </div>
  </section>
))

SkeletonServices.displayName = 'SkeletonServices'

const ErrorServices = memo(({ onRetry }) => (
  <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="text-center py-12">
        <p className="font-display text-xl text-[var(--primary)]/60 mb-4">Unable to load services</p>
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

ErrorServices.displayName = 'ErrorServices'

export const ServicesSection = memo(({ services = [], images = {} }) => {
  const [data, setData] = useState(services)
  const [imageData, setImageData] = useState(images)
  const [loading, setLoading] = useState(!services.length)
  const [error, setError] = useState(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/services')
      setData(res.data || [])
      if (res.data?.servicesImages) {
        setImageData(res.data.servicesImages)
      }
    } catch (err) {
      setError(err?.message || 'Failed to load services')
      console.warn('[SERVICES SECTION] Failed to load:', err?.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!services.length) loadData()
  }, [services.length, loadData])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'services-changed') loadData()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadData])

  if (loading) return <SkeletonServices />
  if (error) return <ErrorServices onRetry={loadData} />
  if (!data.length) return null

  return (
    <section id="services">
      <CircularServicesGrid services={data} images={imageData} />
      <div className="mt-12 text-center">
        <Link to="/services" className="btn-luxury-primary group inline-flex items-center gap-2">
          View All Services
          <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  )
})

ServicesSection.displayName = 'ServicesSection'

export default ServicesSection