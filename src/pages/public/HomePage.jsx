import { useState, useEffect, useCallback, memo } from 'react'
import { Link } from 'react-router-dom'
import { HeroSection } from '@components/home/HeroSection'
import { PortfolioSection } from '@components/home/PortfolioSection'
import { ServicesSection } from '@components/home/ServicesSection'
import { VirtualDesignSection } from '@components/home/VirtualDesignSection'
import { ShopSection } from '@components/home/ShopSection'
import { SocialSection } from '@components/home/SocialSection'
import { AboutSection } from '@components/home/AboutSection'
import { ContactSection } from '@components/home/ContactSection'
import { SectionErrorBoundary } from '@components/home/SectionErrorBoundary'
import { api } from '@services/api'
import { getOptimizedUrl } from '@utils/cloudinaryHelpers'
import { getProjectImage } from '@utils/homepageHelpers'
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

  const loadData = useCallback(async () => {
    let cancelled = false
    try {
      const res = await api.get('/homepage')
      if (!cancelled) {
        const data = res.data || {}
        setPortfolio(data.portfolio || [])
        setServices(data.services || [])
        setVirtualDesigns(data.virtualInteriorDesign || data.virtualDesigns || [])
        setHeroImages(data.heroImages || [])
        setProducts(data.products || [])
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
      if (payload?.type === 'portfolio-changed' || payload?.type === 'services-changed' || payload?.type === 'virtual-changed' || payload?.type === 'hero-images-changed' || payload?.type === 'products-changed') {
        loadData()
      }
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadData])

  const serviceImages = (Array.isArray(services) ? services : []).reduce((acc, service) => {
    const img = service?.imageUrl || service?.mediaUrl || service?.image || service?.galleryImages?.[0]
    if (img) {
      acc[service.key] = img
      acc[service.id] = img
    }
    return acc
  }, {})

  if (loading) {
    return (
      <main>
        <SectionErrorBoundary sectionName="Hero" fallback={<SkeletonHero />}>
          <HeroSection onBookConsultation={() => setShowModal(true)} heroImages={[]} />
        </SectionErrorBoundary>
        <SectionErrorBoundary sectionName="Portfolio" fallback={<EmptySection />}>
          <PortfolioSection portfolio={[]} />
        </SectionErrorBoundary>
        <SectionErrorBoundary sectionName="Services" fallback={<EmptySection />}>
          <ServicesSection services={[]} images={{}} />
        </SectionErrorBoundary>
        <SectionErrorBoundary sectionName="Virtual Designs" fallback={<EmptySection />}>
          <VirtualDesignSection virtualDesigns={[]} />
        </SectionErrorBoundary>
        <SectionErrorBoundary sectionName="Shop" fallback={<EmptySection />}>
          <ShopSection products={[]} />
        </SectionErrorBoundary>
        <SectionErrorBoundary sectionName="Socials" fallback={<EmptySection />}>
          <SocialSection />
        </SectionErrorBoundary>
        <SectionErrorBoundary sectionName="About" fallback={<EmptySection />}>
          <AboutSection />
        </SectionErrorBoundary>
        <SectionErrorBoundary sectionName="Contact" fallback={<EmptySection />}>
          <ContactSection contactInfo={null} />
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

      {/* HERO - Mobile */}
      <div className="md:hidden">
        <SectionErrorBoundary sectionName="Hero" fallback={<SkeletonHero />}>
          <HeroSection onBookConsultation={() => setShowModal(true)} heroImages={heroImages} />
        </SectionErrorBoundary>
      </div>

      {/* HERO - Desktop */}
      <div className="hidden md:block">
        <SectionErrorBoundary sectionName="Hero" fallback={<SkeletonHero />}>
          <HeroSection onBookConsultation={() => setShowModal(true)} heroImages={heroImages} className="h-[240px] min-h-[240px] rounded-b-[20px] mb-7" />
        </SectionErrorBoundary>
      </div>

      {/* MOBILE: Navigation cards - Hero, Portfolio, Services, Virtual Designs, Shop, Socials, About */}
      <div className="md:hidden">
        {/* Portfolio Navigation Card */}
        <SectionErrorBoundary sectionName="Portfolio" fallback={<EmptySection />}>
          <section className="bg-[var(--secondary)]/30 px-6 py-16">
            <div className="container-wide">
              <Link
                to="/portfolio"
                className="relative flex flex-col items-center group focus:outline-none w-full"
                aria-label="Portfolio — tap to explore"
              >
                <div
                  className="relative rounded-full transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    width: 300,
                    height: 300,
                    boxShadow: '0 8px 25px rgba(42,36,31,0.1)',
                    border: '2px solid #E89A43',
                    background: '#F5EFE8',
                    overflow: 'hidden',
                  }}
                >
                  {portfolio[0] && getProjectImage(portfolio[0]) ? (
                    <img
                      src={getOptimizedUrl(getProjectImage(portfolio[0]), { width: 600, crop: 'limit' })}
                      alt={portfolio[0].title}
                      className="h-full w-full object-cover"
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[var(--primary)]/20">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                    </div>
                  )}
                </div>

                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-xs px-4"
                  style={{ zIndex: 10 }}
                >
                  <button
                    type="button"
                    onClick={() => window.location.href = '/portfolio'}
                    className="block w-full py-3 px-6 bg-[#E89A43] text-white text-base font-semibold uppercase tracking-wide rounded-full text-center whitespace-nowrap shadow-[0_4px_16px_rgba(232,154,67,0.4)] hover:shadow-[0_8px_24px_rgba(232,154,67,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                    aria-label="View Portfolio"
                  >
                    Portfolio
                  </button>
                </div>
              </Link>
            </div>
          </section>
        </SectionErrorBoundary>

        {/* Services Navigation Card */}
        <SectionErrorBoundary sectionName="Services" fallback={<EmptySection />}>
          <section className="bg-[var(--bg)] px-6 py-16">
            <div className="container-wide">
              <Link
                to="/services"
                className="relative flex flex-col items-center group focus:outline-none w-full"
                aria-label="Services — tap to explore"
              >
                <div
                  className="relative rounded-full transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    width: 300,
                    height: 300,
                    boxShadow: '0 8px 25px rgba(42,36,31,0.1)',
                    border: '2px solid #E89A43',
                    background: '#F5EFE8',
                    overflow: 'hidden',
                  }}
                >
                  {services[0] && (services[0].imageUrl || services[0].mediaUrl || services[0].image || services[0].galleryImages?.[0]) ? (
                    <img
                      src={getOptimizedUrl(services[0].imageUrl || services[0].mediaUrl || services[0].image || services[0].galleryImages?.[0], { width: 600, crop: 'limit' })}
                      alt={services[0].title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[var(--primary)]/20">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3a6 6 0 0 0 9 4 9 9 0 1 1-9-9Z" />
                        <line x1="21" y1="9" x2="15.5" y2="14.5" />
                        <line x1="15" y1="15" x2="14" y2="16" />
                      </svg>
                    </div>
                  )}
                </div>

                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-xs px-4"
                  style={{ zIndex: 10 }}
                >
                  <button
                    type="button"
                    onClick={() => window.location.href = '/services'}
                    className="block w-full py-3 px-6 bg-[#E89A43] text-white text-base font-semibold uppercase tracking-wide rounded-full text-center whitespace-nowrap shadow-[0_4px_16px_rgba(232,154,67,0.4)] hover:shadow-[0_8px_24px_rgba(232,154,67,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                    aria-label="View Services"
                  >
                    Services
                  </button>
                </div>
              </Link>
            </div>
          </section>
        </SectionErrorBoundary>

        {/* Virtual Designs Navigation Card */}
        <SectionErrorBoundary sectionName="Virtual Designs" fallback={<EmptySection />}>
          <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--secondary)]/20 px-6 py-16">
            <div className="container-wide">
              <Link
                to="/virtual-design"
                className="relative flex flex-col items-center group focus:outline-none w-full"
                aria-label="Virtual Designs — tap to explore"
              >
                <div
                  className="relative rounded-full transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    width: 300,
                    height: 300,
                    boxShadow: '0 8px 25px rgba(42,36,31,0.1)',
                    border: '2px solid #E89A43',
                    background: '#F5EFE8',
                    overflow: 'hidden',
                  }}
                >
                  {virtualDesigns[0] && getProjectImage(virtualDesigns[0]) ? (
                    <img
                      src={getOptimizedUrl(getProjectImage(virtualDesigns[0]), { width: 600, crop: 'limit' })}
                      alt={virtualDesigns[0].title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[var(--primary)]/20">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                    </div>
                  )}
                </div>

                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-xs px-4"
                  style={{ zIndex: 10 }}
                >
                  <button
                    type="button"
                    onClick={() => window.location.href = '/virtual-design'}
                    className="block w-full py-3 px-6 bg-[#E89A43] text-white text-base font-semibold uppercase tracking-wide rounded-full text-center whitespace-nowrap shadow-[0_4px_16px_rgba(232,154,67,0.4)] hover:shadow-[0_8px_24px_rgba(232,154,67,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                    aria-label="View Virtual Designs"
                  >
                    Virtual Designs
                  </button>
                </div>
              </Link>
            </div>
          </section>
        </SectionErrorBoundary>

        {/* Shop Navigation Card */}
        <SectionErrorBoundary sectionName="Shop" fallback={<EmptySection />}>
          <section className="bg-[var(--bg)] px-6 py-16">
            <div className="container-wide">
              <Link
                to="/shop"
                className="relative flex flex-col items-center group focus:outline-none w-full"
                aria-label="Shop — tap to explore"
              >
                <div
                  className="relative rounded-full transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    width: 300,
                    height: 300,
                    boxShadow: '0 8px 25px rgba(42,36,31,0.1)',
                    border: '2px solid #E89A43',
                    background: '#F5EFE8',
                    overflow: 'hidden',
                  }}
                >
                  {Array.isArray(products) && products.length > 0 && (
                    typeof products[0]?.images?.[0] === 'string'
                      ? products[0].images[0]
                      : typeof products[0]?.images?.[0]?.url === 'string'
                      ? products[0].images[0].url
                      : null
                  ) ? (
                    <img
                      src={getOptimizedUrl(
                        typeof products[0]?.images?.[0] === 'string'
                          ? products[0].images[0]
                          : typeof products[0]?.images?.[0]?.url === 'string'
                          ? products[0].images[0].url
                          : null,
                        { width: 600, crop: 'limit' }
                      )}
                      alt={products[0].name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[var(--primary)]/20">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                    </div>
                  )}
                </div>

                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-xs px-4"
                  style={{ zIndex: 10 }}
                >
                  <button
                    type="button"
                    onClick={() => window.location.href = '/shop'}
                    className="block w-full py-3 px-6 bg-[#E89A43] text-white text-base font-semibold uppercase tracking-wide rounded-full text-center whitespace-nowrap shadow-[0_4px_16px_rgba(232,154,67,0.4)] hover:shadow-[0_8px_24px_rgba(232,154,67,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                    aria-label="View Shop"
                  >
                    Shop
                  </button>
                </div>
              </Link>
            </div>
          </section>
        </SectionErrorBoundary>

        {/* Socials Navigation Card */}
        <SectionErrorBoundary sectionName="Socials" fallback={<EmptySection />}>
          <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--accent)]/5 px-6 py-16">
            <div className="container-wide">
              <Link
                to="/socials"
                className="relative flex flex-col items-center group focus:outline-none w-full"
                aria-label="Socials — tap to explore"
              >
                <div
                  className="relative rounded-full transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    width: 300,
                    height: 300,
                    boxShadow: '0 8px 25px rgba(42,36,31,0.1)',
                    border: '2px solid #E89A43',
                    background: '#F5EFE8',
                    overflow: 'hidden',
                  }}
                >
                  {portfolio[0] && getProjectImage(portfolio[0]) ? (
                    <img
                      src={getOptimizedUrl(getProjectImage(portfolio[0]), { width: 600, crop: 'limit' })}
                      alt="HOK Interiors Social"
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[var(--primary)]/20">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                    </div>
                  )}
                </div>

                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-xs px-4"
                  style={{ zIndex: 10 }}
                >
                  <button
                    type="button"
                    onClick={() => window.location.href = '/socials'}
                    className="block w-full py-3 px-6 bg-[#E89A43] text-white text-base font-semibold uppercase tracking-wide rounded-full text-center whitespace-nowrap shadow-[0_4px_16px_rgba(232,154,67,0.4)] hover:shadow-[0_8px_24px_rgba(232,154,67,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                    aria-label="View Socials"
                  >
                    Socials
                  </button>
                </div>
              </Link>
            </div>
          </section>
        </SectionErrorBoundary>

        {/* About Navigation Card */}
        <SectionErrorBoundary sectionName="About" fallback={<EmptySection />}>
          <section className="bg-[var(--bg)] px-6 py-16 pb-24">
            <div className="container-wide">
              <Link
                to="/about"
                className="relative flex flex-col items-center group focus:outline-none w-full"
                aria-label="About Us — tap to explore"
              >
                <div
                  className="relative rounded-full transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    width: 300,
                    height: 300,
                    boxShadow: '0 8px 25px rgba(42,36,31,0.1)',
                    border: '2px solid #E89A43',
                    background: '#F5EFE8',
                    overflow: 'hidden',
                  }}
                >
                  {services[0] && (services[0].imageUrl || services[0].mediaUrl || services[0].image || services[0].galleryImages?.[0]) ? (
                    <img
                      src={getOptimizedUrl(services[0].imageUrl || services[0].mediaUrl || services[0].image || services[0].galleryImages?.[0], { width: 600, crop: 'limit' })}
                      alt="About HOK Interiors"
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[var(--primary)]/20">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                    </div>
                  )}
                </div>

                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-xs px-4"
                  style={{ zIndex: 10 }}
                >
                  <button
                    type="button"
                    onClick={() => window.location.href = '/about'}
                    className="block w-full py-3 px-6 bg-[#E89A43] text-white text-base font-semibold uppercase tracking-wide rounded-full text-center whitespace-nowrap shadow-[0_4px_16px_rgba(232,154,67,0.4)] hover:shadow-[0_8px_24px_rgba(232,154,67,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                    aria-label="View About Us"
                  >
                    About Us
                  </button>
                </div>
              </Link>
            </div>
          </section>
        </SectionErrorBoundary>
      </div>

      {/* DESKTOP: Full sections */}
      <div className="hidden md:block">
        <SectionErrorBoundary sectionName="Portfolio">
          <PortfolioSection portfolio={portfolio} />
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Virtual Designs">
          <VirtualDesignSection virtualDesigns={virtualDesigns} />
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Services">
          <ServicesSection services={services} images={serviceImages} />
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Shop">
          <ShopSection products={products} />
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="About">
          <AboutSection />
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Socials">
          <SocialSection />
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Contact">
          <ContactSection contactInfo={null} />
        </SectionErrorBoundary>
      </div>

      <ConsultationModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </main>
  )
}

export default HomePage