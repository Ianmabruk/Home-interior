import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Hero } from '../../components/ui/Hero'
import { AboutPreview } from '../../components/about/AboutPreview'
import { ConsultationModal } from '../../components/common/ConsultationModal'
import { CircularPortfolioShowcase } from '../../components/portfolio/CircularPortfolioShowcase'
import { CircularServicesGrid } from '../../components/services/CircularServicesGrid'
import { CircularNavCard } from '../../components/ui/CircularNavCard'
import { api } from '../../services/api'
import { getOptimizedUrl } from '../../utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'
import { PageMeta } from '../../hooks/usePageMeta'
import ContactSection from '../../components/common/ContactSection'
import { getProjectImage } from '../../utils/homepageHelpers'

const SkeletonPortfolio = memo(() => (
  <section className="bg-[var(--secondary)]/30 px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="mb-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Portfolio</p>
        <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
          Featured Projects
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="group relative bg-white border border-[var(--border)]/40 overflow-hidden rounded-3xl">
            <div className="aspect-[3/4] skeleton" />
            <div className="p-5 border-t border-[var(--border)]/40">
              <div className="skeleton h-3 w-20 mb-3" />
              <div className="skeleton h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
))

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

const SkeletonContact = memo(() => (
  <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--accent)]/5 px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="mb-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Contact Us</p>
        <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
          Get In Touch
        </h2>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="skeleton h-10 w-10 rounded-xl" />
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-4 w-32" />
          </div>
        ))}
      </div>
    </div>
  </section>
))

export const HomePage = () => {
  const [showModal, setShowModal] = useState(false)
  const [portfolio, setPortfolio] = useState([])
  const [services, setServices] = useState([])
  const [virtualDesigns, setVirtualDesigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [heroImages, setHeroImages] = useState([])
  const [contactInfo, setContactInfo] = useState(null)
  const [products, setProducts] = useState([])

  const loadData = useCallback(() => {
    let cancelled = false
    api.get('/homepage')
      .then((res) => {
        if (!cancelled) {
          const data = res.data || {}
          setPortfolio(data.portfolio || [])
          setServices(data.services || [])
          setVirtualDesigns(data.virtualInteriorDesign || data.virtualDesigns || [])
          setHeroImages(data.heroImages || [])
          setProducts(data.products || [])
          setContactInfo(data.contact || null)
        }
      })
      .catch((err) => {
        if (!cancelled) console.warn('[HOME] Failed to load data:', err?.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'portfolio-changed' || payload?.type === 'services-changed' || payload?.type === 'virtual-changed' || payload?.type === 'hero-images-changed' || payload?.type === 'contact-changed' || payload?.type === 'products-changed') {
        loadData()
      }
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadData])

  const serviceImages = useMemo(() => {
    const images = {}
    services.forEach((service) => {
      const img = service.imageUrl || service.mediaUrl || service.image || service.galleryImages?.[0]
      if (img) {
        images[service.key] = img
        images[service.id] = img
      }
    })
    return images
  }, [services])

  if (loading) {
    return (
      <main>
        <Hero onBookConsultation={() => setShowModal(true)} heroImages={[]} />
        <SkeletonPortfolio />
        <SkeletonServices />
        <SkeletonVirtualDesigns />
        <SkeletonContact />
        <AboutPreview />
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
        <Hero onBookConsultation={() => setShowModal(true)} heroImages={heroImages} />
      </div>

      {/* HERO - Desktop */}
      <div className="hidden md:block">
        <Hero onBookConsultation={() => setShowModal(true)} heroImages={heroImages} className="h-[240px] min-h-[240px] rounded-b-[20px] mb-7" />
      </div>

      {/* MOBILE: Vertical stack of CircularNavCard */}
      <div className="md:hidden">
        <section className="bg-[var(--secondary)]/30 px-6 py-16">
          <div className="container-wide">
            <CircularNavCard
              to="/portfolio"
              label="Portfolio"
              imageUrl={portfolio[0] ? getProjectImage(portfolio[0]) : null}
              alt={portfolio[0]?.title}
              size={300}
              priority
            />
          </div>
        </section>

        <section className="bg-[var(--bg)] px-6 py-16">
          <div className="container-wide">
            <CircularNavCard
              to="/services"
              label="Services"
              imageUrl={services[0] ? (services[0].imageUrl || services[0].mediaUrl || services[0].image || services[0].galleryImages?.[0]) : null}
              alt={services[0]?.title}
              size={300}
            />
          </div>
        </section>

        <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--secondary)]/20 px-6 py-16">
          <div className="container-wide">
            <CircularNavCard
              to="/virtual-design"
              label="Virtual Designs"
              imageUrl={virtualDesigns[0] ? getProjectImage(virtualDesigns[0]) : null}
              alt={virtualDesigns[0]?.title}
              size={300}
            />
          </div>
        </section>

        <section className="bg-[var(--bg)] px-6 py-16">
          <div className="container-wide">
            <CircularNavCard
              to="/shop"
              label="Shop"
              imageUrl={(products || []).length > 0 ? (typeof (products && products[0])?.images?.[0] === 'string' ? (products && products[0])?.images[0] : (products && products[0])?.images?.[0]?.url) : null}
              alt="HOK Interiors Shop"
              size={300}
            />
          </div>
        </section>

        <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--accent)]/5 px-6 py-16">
          <div className="container-wide">
            <CircularNavCard
              to="/socials"
              label="Socials"
              imageUrl={(portfolio || []).length > 0 ? getProjectImage(portfolio[0]) : null}
              alt="HOK Interiors Social"
              size={300}
            />
          </div>
        </section>

        <section className="bg-[var(--bg)] px-6 py-16 pb-24">
          <div className="container-wide">
            <CircularNavCard
              to="/about"
              label="About Us"
              imageUrl={(services || []).length > 0 ? (services[0]?.imageUrl || services[0]?.mediaUrl || services[0]?.image || services[0]?.galleryImages?.[0]) : null}
              alt="About HOK Interiors"
              size={300}
            />
          </div>
        </section>
      </div>

      {/* DESKTOP: Full sections */}
      <div className="hidden md:block">
        {/* Portfolio Section - Using CircularPortfolioShowcase */}
        <CircularPortfolioShowcase portfolio={portfolio} getProjectImage={getProjectImage} />

        {/* Virtual Designs Section */}
        <section id="virtual-designs" className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--secondary)]/20 py-20 md:py-32">
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
              {virtualDesigns.slice(0, 6).map((item, index) => (
                <div key={item.id || index} className="group flex flex-col items-center">
                  <div className="relative w-full max-w-sm mx-auto mb-6">
                    <div className="relative rounded-full overflow-hidden">
                      <img
                        src={getOptimizedUrl(getProjectImage(item), { width: 600, crop: 'limit' })}
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

        {/* Services Section - Using CircularServicesGrid */}
        <CircularServicesGrid services={services} images={serviceImages} />

        {/* Shop Section */}
        <section id="shop" className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--accent)]/5 py-20 md:py-32">
          <div className="container-wide md:px-12 lg:px-20">
            <div className="mb-16 md:mb-24 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Shop</p>
              <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
                Shop Collection
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
                Curated pieces to elevate your space with timeless elegance.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
              {(products || []).slice(0, 3).map((product, index) => {
                const firstImage = typeof product.images?.[0] === 'string' ? product.images[0] : product.images?.[0]?.url || null
                return (
                  <div key={product._id || product.id || index} className="group flex flex-col items-center">
                    <div className="relative w-full max-w-sm mx-auto mb-6">
                      <div className="relative rounded-full overflow-hidden bg-[var(--secondary)]/30">
                        {firstImage ? (
                          <img
                            src={getOptimizedUrl(firstImage, { width: 600, crop: 'limit' })}
                            alt={product.name}
                            className="h-[320px] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-[320px] w-full flex items-center justify-center text-[var(--primary)]/30">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                              <circle cx="9" cy="9" r="2" />
                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/shop/${product._id || product.id}`}
                      className="w-full max-w-xs px-8 py-4 bg-[#E89A43] text-white text-base font-semibold uppercase tracking-wide rounded-full text-center whitespace-nowrap shadow-[0_4px_16px_rgba(232,154,67,0.4)] hover:shadow-[0_8px_24px_rgba(232,154,67,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                    >
                      {product.name}
                    </Link>
                  </div>
                )
              })}
            </div>

            <div className="mt-12 text-center">
              <Link to="/shop" className="btn-luxury-primary group inline-flex items-center gap-2">
                View Full Collection
                <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>

        {/* About Us Section - Using premium AboutPreview */}
        <section id="about" className="bg-[var(--bg)] py-20 md:py-32">
          <div className="container-wide md:px-12 lg:px-20">
            <AboutPreview />
          </div>
        </section>

        {/* Socials Section */}
        <section id="socials" className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--secondary)]/20 py-20 md:py-32">
          <div className="container-wide md:px-12 lg:px-20">
            <div className="mb-16 md:mb-24 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Socials</p>
              <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
                Follow Our Journey
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
                Stay inspired with our latest projects, design tips, and behind-the-scenes moments.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
              {[
                { label: 'Instagram', icon: 'instagram' },
                { label: 'Pinterest', icon: 'pinterest' },
                { label: 'LinkedIn', icon: 'linkedin' },
              ].map((social) => (
                <div key={social.label} className="group flex flex-col items-center">
                  <div className="relative w-full max-w-sm mx-auto mb-6">
                    <div className="relative rounded-full overflow-hidden bg-[var(--secondary)]/30">
                      <div className="h-[320px] w-full flex items-center justify-center text-[var(--primary)]/30">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/socials"
                    className="w-full max-w-xs px-8 py-4 bg-[#E89A43] text-white text-base font-semibold uppercase tracking-wide rounded-full text-center whitespace-nowrap shadow-[0_4px_16px_rgba(232,154,67,0.4)] hover:shadow-[0_8px_24px_rgba(232,154,67,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                  >
                    {social.label}
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link to="/socials" className="btn-luxury-primary group inline-flex items-center gap-2">
                View All Socials
                <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <ContactSection contactInfo={contactInfo} />
      </div>

      <ConsultationModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </main>
  )
}

export default HomePage