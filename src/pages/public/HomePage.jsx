import { useState, useEffect, useCallback, memo } from 'react'
import { HeroSection } from '@components/home/HeroSection'
import { BrandingBanner } from '@components/home/BrandingBanner'
import { CircularNavigationGrid } from '@components/home/CircularNavigationGrid'
import { MobileCircularNavigation } from '@components/home/MobileCircularNavigation'
import { PortfolioSection } from '@components/home/PortfolioSection'
import { VirtualDesignSection } from '@components/home/VirtualDesignSection'
import { AboutSection } from '@components/home/AboutSection'
import { ServicesSection } from '@components/home/ServicesSection'
import { ShopSection } from '@components/home/ShopSection'
import { ContactSection } from '@components/home/ContactSection'
import { SectionErrorBoundary } from '@components/home/SectionErrorBoundary'
import { ScrollReveal } from '@utils/scrollReveal'
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
  const [blog, setBlog] = useState([])

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
        setBlog(data.blog || [])
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
      if (payload?.type === 'portfolio-changed' || payload?.type === 'services-changed' || payload?.type === 'virtual-changed' || payload?.type === 'hero-images-changed' || payload?.type === 'products-changed' || payload?.type === 'about-changed' || payload?.type === 'blog-changed') {
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
        <BrandingBanner />
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

      <ScrollReveal>
        <BrandingBanner />
      </ScrollReveal>

      {/* DESKTOP: CIRCULAR NAVIGATION GRID (3x2) */}
      <ScrollReveal delay={100}>
        <div className="hidden md:block">
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
        </div>
      </ScrollReveal>

      {/* MOBILE: VERTICAL CIRCULAR NAVIGATION STACK */}
      <ScrollReveal delay={100}>
        <div className="md:hidden">
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
        </div>
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <SectionErrorBoundary sectionName="Portfolio" fallback={<EmptySection />}>
          <PortfolioSection portfolio={portfolio} />
        </SectionErrorBoundary>
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <SectionErrorBoundary sectionName="VirtualDesign" fallback={<EmptySection />}>
          <VirtualDesignSection virtualDesigns={virtualDesigns} />
        </SectionErrorBoundary>
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <SectionErrorBoundary sectionName="Services" fallback={<EmptySection />}>
          <ServicesSection services={services} />
        </SectionErrorBoundary>
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <SectionErrorBoundary sectionName="Shop" fallback={<EmptySection />}>
          <ShopSection products={products} />
        </SectionErrorBoundary>
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <SectionErrorBoundary sectionName="About" fallback={<EmptySection />}>
          <AboutSection aboutData={about} />
        </SectionErrorBoundary>
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <ContactSection />
      </ScrollReveal>

      <ConsultationModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </main>
  )
}

export default HomePage