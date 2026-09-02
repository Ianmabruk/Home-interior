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
    const [loading, setLoading] = useState(true)
    const [heroImages, setHeroImages] = useState([])
    const [circularTabs, setCircularTabs] = useState({})

  const loadCircularTabs = useCallback(async () => {
    try {
      const res = await api.get('/circular-tabs')
      setCircularTabs(res.data || {})
    } catch {
      setCircularTabs({})
    }
  }, [])

  const loadData = useCallback(async () => {
    try {
      const homeRes = await api.get('/homepage')
      const data = homeRes.data || {}

      const homeHeroImages = data.heroImages || data.heroMedia || []
      if (Array.isArray(homeHeroImages) && homeHeroImages.length > 0) {
        setHeroImages(homeHeroImages)
      } else {
        const heroRes = await api.get('/hero-media')
        const heroData = heroRes.data
        const heroList = Array.isArray(heroData) ? heroData : []
        setHeroImages(heroList)
      }
    } catch (err) {
      console.warn('[HOME] Failed to load data, fetching individual endpoints:', err?.message)
      try {
        const [heroRes] = await Promise.allSettled([
          api.get('/hero-media'),
        ])
        if (heroRes.status === 'fulfilled') {
          const heroData = heroRes.value.data
          const heroList = Array.isArray(heroData) ? heroData : (heroData || [])
          setHeroImages(heroList)
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
    loadCircularTabs()
  }, [loadData, loadCircularTabs])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (
        payload?.type === 'hero-images-changed' ||
        payload?.type === 'settings-changed'
      ) {
        clearApiCache('/homepage')
        loadData()
      }
      if (payload?.type === 'circular-tabs-changed') {
        clearApiCache('/circular-tabs')
        loadCircularTabs()
      }
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadData, loadCircularTabs])

  return (
    <main>
      <PageMeta
        title="HOK INTERIOR DESIGNS — Timeless Interiors, Designed for a Life Well Lived"
        description="Luxury interior design, curated furniture, and premium virtual design services."
        image={heroImages?.[0]?.imageUrl || heroImages?.[0]?.url || undefined}
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
