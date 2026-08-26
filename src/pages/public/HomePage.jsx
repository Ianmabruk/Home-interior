import { useState, useEffect, useCallback, memo } from 'react'
import { Link } from 'react-router-dom'
import { HeroSection } from '@components/home/HeroSection'
import { CircularNavigationGrid } from '@components/home/CircularNavigationGrid'
import { MobileCircularNavigation } from '@components/home/MobileCircularNavigation'
import { SectionErrorBoundary } from '@components/home/SectionErrorBoundary'
import { api, clearApiCache } from '@services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'

const SkeletonHero = memo(() => (
  <section className="relative w-full h-screen min-h-[700px] overflow-hidden bg-[var(--primary)]" role="region" aria-label="Hero image">
    <div className="absolute inset-0 bg-[var(--primary)]" />
  </section>
))

SkeletonHero.displayName = 'SkeletonHero'

const EmptySection = memo(() => (
  <div className="py-20 text-center text-[var(--primary)]/40">
    <p>No content available</p>
  </div>
))

EmptySection.displayName = 'EmptySection'

export const HomePage = memo(() => {
    const [portfolio, setPortfolio] = useState([])
   const [services, setServices] = useState([])
   const [virtualDesigns, setVirtualDesigns] = useState([])
   const [products, setProducts] = useState([])
   const [loading, setLoading] = useState(true)
   const [heroImages, setHeroImages] = useState([])
   const [about, setAbout] = useState(null)
   const [aboutImages, setAboutImages] = useState([])
   const [socialItems, setSocialItems] = useState([])
   const [blog, setBlog] = useState([])
   const [workWithUs, setWorkWithUs] = useState([])
   const [testimonials, setTestimonials] = useState([])
   const [shopWithUsHomepageImage, setShopWithUsHomepageImage] = useState(null)
   const [circularTabs, setCircularTabs] = useState({})

  const loadData = useCallback(async () => {
    try {
      const homeRes = await api.get('/homepage')
      const data = homeRes.data || {}
      setPortfolio(data.portfolio || [])
      setServices(data.services || [])
      setVirtualDesigns(data.virtualInteriorDesign || data.virtualDesigns || [])
      setProducts(data.products || [])
      setAbout(data.about || null)
      setAboutImages(data.aboutImages || [])
      setSocialItems(data.socialItems || [])
      setBlog(data.blog || [])
      setWorkWithUs(data.workWithUs || [])
      setTestimonials(data.testimonials || [])
      setShopWithUsHomepageImage(data.shopWithUsHomepageImage || null)
      setCircularTabs(data.circularTabs || {})

      const homeHeroImages = data.heroImages || data.heroMedia || []
      if (Array.isArray(homeHeroImages) && homeHeroImages.length > 0) {
        setHeroImages(homeHeroImages)
      } else {
        const heroRes = await api.get('/hero-media')
        const heroData = heroRes.data
        const heroList = Array.isArray(heroData) ? heroData : []
        setHeroImages(heroList)
      }

      if (!Array.isArray(data.workWithUs) || data.workWithUs.length === 0) {
        try {
          const wwuRes = await api.get('/work-with-us')
          const wwuData = wwuRes.data
          const wwuList = Array.isArray(wwuData) ? wwuData : []
          setWorkWithUs(wwuList)
        } catch (wwuErr) {
          console.warn('[HOME] Failed to load work-with-us:', wwuErr?.message)
        }
      }
    } catch (err) {
      console.warn('[HOME] Failed to load data, fetching individual endpoints:', err?.message)
      try {
        const [heroRes, portfolioRes, servicesRes, productsRes, virtualRes] = await Promise.allSettled([
          api.get('/hero-media'),
          api.get('/portfolio'),
          api.get('/services'),
          api.get('/products', { params: { sort: '-createdAt', limit: 1 } }),
          api.get('/virtual-design'),
        ])
        if (heroRes.status === 'fulfilled') {
          const heroData = heroRes.value.data
          const heroList = Array.isArray(heroData) ? heroData : (heroData || [])
          setHeroImages(heroList)
        }
        if (portfolioRes.status === 'fulfilled') {
          const portfolioData = portfolioRes.value.data
          setPortfolio(Array.isArray(portfolioData) ? portfolioData : [])
        }
        if (servicesRes.status === 'fulfilled') {
          const servicesData = servicesRes.value.data
          setServices(Array.isArray(servicesData) ? servicesData : [])
        }
        if (productsRes.status === 'fulfilled') {
          const productsData = productsRes.value.data
          setProducts(Array.isArray(productsData) ? productsData : [])
        }
        if (virtualRes.status === 'fulfilled') {
          const virtualData = virtualRes.value.data
          setVirtualDesigns(Array.isArray(virtualData) ? virtualData : [])
        }
      } catch (fallbackErr) {
        console.warn('[HOME] Fallback fetch failed:', fallbackErr?.message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
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
        payload?.type === 'socials-changed' ||
        payload?.type === 'work-with-us-changed' ||
        payload?.type === 'testimonials-changed' ||
        payload?.type === 'circular-tabs-changed' ||
        payload?.type === 'settings-changed'
      ) {
        clearApiCache('/homepage')
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
        image={heroImages?.[0]?.imageUrl || heroImages?.[0] || undefined}
      />

      {/* HERO - Full Width */}
      <SectionErrorBoundary sectionName="Hero" fallback={<SkeletonHero />}>
        <HeroSection heroImages={heroImages} className="w-full" />
      </SectionErrorBoundary>

      {/* CIRCULAR NAVIGATION */}
      <SectionErrorBoundary sectionName="CircularNavigation" fallback={<EmptySection />}>
        <CircularNavigationGrid circularTabs={circularTabs} />
      </SectionErrorBoundary>

      {/* MOBILE CIRCULAR NAVIGATION */}
      <SectionErrorBoundary sectionName="MobileCircularNavigation" fallback={<EmptySection />}>
        <MobileCircularNavigation circularTabs={circularTabs} />
      </SectionErrorBoundary>

      {/* INTERNAL LINKS */}
      <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-12">
        <div className="container-wide">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link to="/portfolio" className="text-[var(--primary)]/60 hover:text-[var(--accent)] transition-colors">Portfolio</Link>
            <Link to="/services" className="text-[var(--primary)]/60 hover:text-[var(--accent)] transition-colors">Services</Link>
            <Link to="/shop" className="text-[var(--primary)]/60 hover:text-[var(--accent)] transition-colors">Shop</Link>
            <Link to="/blog" className="text-[var(--primary)]/60 hover:text-[var(--accent)] transition-colors">Blog</Link>
            <Link to="/virtual-design" className="text-[var(--primary)]/60 hover:text-[var(--accent)] transition-colors">Virtual Design</Link>
            <Link to="/about" className="text-[var(--primary)]/60 hover:text-[var(--accent)] transition-colors">About</Link>
            <Link to="/signup" className="text-[var(--primary)]/60 hover:text-[var(--accent)] transition-colors">Sign Up</Link>
            <Link to="/login" className="text-[var(--primary)]/60 hover:text-[var(--accent)] transition-colors">Login</Link>
          </div>
        </div>
      </section>
    </main>
  )
})

HomePage.displayName = 'HomePage'

export default HomePage
