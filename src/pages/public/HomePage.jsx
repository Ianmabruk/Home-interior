import { useState, useEffect, useCallback, memo } from 'react'
import { HeroSection } from '@components/home/HeroSection'
import { CircularNavigationGrid } from '@components/home/CircularNavigationGrid'
import { MobileCircularNavigation } from '@components/home/MobileCircularNavigation'
import { ContactSection } from '@components/home/ContactSection'
import { SectionErrorBoundary } from '@components/home/SectionErrorBoundary'
import { api } from '@services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'

const SkeletonHero = memo(() => (
  <section className="relative w-full h-screen min-h-[700px] overflow-hidden bg-[var(--primary)]" role="region" aria-label="Hero image">
    <div className="absolute inset-0 bg-[var(--primary)]" />
  </section>
))

SkeletonHero.displayName = 'SkeletonHero'

const EmptySection = memo(() => null)

EmptySection.displayName = 'EmptySection'

export const HomePage = () => {
  const [portfolio, setPortfolio] = useState([])
  const [services, setServices] = useState([])
  const [virtualDesigns, setVirtualDesigns] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [heroImages, setHeroImages] = useState([])
  const [about, setAbout] = useState(null)
  const [blog, setBlog] = useState([])
  const [contactInfo, setContactInfo] = useState(null)

  const loadData = useCallback(async () => {
    let cancelled = false
    try {
      const [homeRes, contactRes] = await Promise.all([
        api.get('/homepage'),
        api.get('/contact').catch(() => ({ data: null })),
      ])
      if (!cancelled) {
        const data = homeRes.data || {}
        setPortfolio(data.portfolio || [])
        setServices(data.services || [])
        setVirtualDesigns(data.virtualInteriorDesign || data.virtualDesigns || [])
        setHeroImages(data.heroImages || data.heroMedia || [])
        setProducts(data.products || [])
        setAbout(data.about || null)
        setBlog(data.blog || [])
        setContactInfo(contactRes?.data || null)
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
    return () => { loadData()?.catch(() => {}) }
  }, [loadData])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (
        payload?.type === 'portfolio-changed' ||
        payload?.type === 'services-changed' ||
        payload?.type === 'virtual-changed' ||
        payload?.type === 'hero-images-changed' ||
        payload?.type === 'products-changed' ||
        payload?.type === 'about-changed' ||
        payload?.type === 'blog-changed' ||
        payload?.type === 'contact-changed'
      ) {
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

      {/* CIRCULAR NAVIGATION */}
      <SectionErrorBoundary sectionName="CircularNavigation" fallback={<EmptySection />}>
        <CircularNavigationGrid
          portfolio={portfolio}
          virtualDesigns={virtualDesigns}
          services={services}
          products={products}
          about={about}
          blog={blog}
        />
      </SectionErrorBoundary>

      {/* MOBILE CIRCULAR NAVIGATION */}
      <SectionErrorBoundary sectionName="MobileCircularNavigation" fallback={<EmptySection />}>
        <MobileCircularNavigation
          portfolio={portfolio}
          virtualDesigns={virtualDesigns}
          services={services}
          products={products}
          about={about}
          blog={blog}
        />
      </SectionErrorBoundary>

      {/* CONTACT SECTION */}
      <ContactSection contactInfo={contactInfo} />
    </main>
  )
}

export default HomePage
