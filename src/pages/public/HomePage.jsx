import { useState, useEffect, useCallback, memo } from 'react'
import { HeroSection } from '@components/home/HeroSection'
import { CircularNavigationGrid } from '@components/home/CircularNavigationGrid'
import { MobileCircularNavigation } from '@components/home/MobileCircularNavigation'
import { SectionErrorBoundary } from '@components/home/SectionErrorBoundary'
import { api } from '@services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'
import { ConsultationModal } from '@components/common/ConsultationModal'

const SkeletonHero = memo(() => (
  <section className="relative w-full h-screen min-h-[700px] overflow-hidden bg-[var(--primary)]" role="region" aria-label="Hero image">
    <div className="absolute inset-0 bg-[var(--primary)]" />
  </section>
))

SkeletonHero.displayName = 'SkeletonHero'

const EmptySection = memo(() => null)

EmptySection.displayName = 'EmptySection'

export const HomePage = () => {
  const [showModal, setShowModal] = useState(false)
  const [portfolio, setPortfolio] = useState([])
  const [services, setServices] = useState([])
  const [virtualDesigns, setVirtualDesigns] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [heroImages, setHeroImages] = useState([])
  const [about, setAbout] = useState(null)

  const loadData = useCallback(async () => {
    let cancelled = false
    try {
      const res = await api.get('/homepage')
      if (!cancelled) {
        const data = res.data || {}
        setPortfolio(data.portfolio || [])
        setServices(data.services || [])
        setVirtualDesigns(data.virtualInteriorDesign || data.virtualDesigns || [])
        setHeroImages(data.heroImages || data.heroMedia || [])
        setProducts(data.products || [])
        setAbout(data.about || null)
      }
    } catch (err) {
      if (!cancelled) console.warn('[HOME] Failed to load data:', err?.message)
    } finally {
      if (!cancelled) setLoading(false)
    }
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'portfolio-changed' || payload?.type === 'services-changed' || payload?.type === 'virtual-changed' || payload?.type === 'hero-images-changed' || payload?.type === 'products-changed' || payload?.type === 'about-changed') {
        import('@services/api').then(({ clearApiCache }) => clearApiCache('/homepage'))
        loadData()
      }
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadData])

  if (loading) {
    return (
      <main>
        <SectionErrorBoundary sectionName="Hero" fallback={<SkeletonHero />}>
          <HeroSection heroImages={[]} />
        </SectionErrorBoundary>
        <SectionErrorBoundary sectionName="CircularNavigation" fallback={<EmptySection />}>
          <CircularNavigationGrid />
        </SectionErrorBoundary>
        <ConsultationModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </main>
    )
  }

  return (
    <main>
      <PageMeta
        title="HOK INTERIOR DESIGNS — Timeless Interiors, Designed for a Life Well Lived"
        description="Luxury interior design, curated furniture, and premium virtual design services."
      />

      {/* HERO - Full Width */}
      <SectionErrorBoundary sectionName="Hero" fallback={<SkeletonHero />}>
        <HeroSection heroImages={heroImages} className="w-full" />
      </SectionErrorBoundary>

      {/* DESKTOP: CIRCULAR NAVIGATION GRID (3x2) */}
      <div className="hidden md:block">
        <SectionErrorBoundary sectionName="CircularNavigation" fallback={<EmptySection />}>
          <CircularNavigationGrid
            portfolio={portfolio}
            virtualDesigns={virtualDesigns}
            services={services}
            products={products}
            about={about}
          />
        </SectionErrorBoundary>
      </div>

      {/* MOBILE: VERTICAL CIRCULAR NAVIGATION STACK */}
      <div className="md:hidden">
        <SectionErrorBoundary sectionName="MobileCircularNavigation" fallback={<EmptySection />}>
          <MobileCircularNavigation
            portfolio={portfolio}
            virtualDesigns={virtualDesigns}
            services={services}
            products={products}
            about={about}
          />
        </SectionErrorBoundary>
      </div>

      <ConsultationModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </main>
  )
}

export default HomePage