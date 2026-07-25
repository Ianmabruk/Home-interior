import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Users } from 'lucide-react'
import { Hero } from '../../components/Hero'
import { AboutPreview } from '../../components/AboutPreview'
import { ConsultationModal } from '../../components/ConsultationModal'
import { CircularPortfolioShowcase } from '../../components/CircularPortfolioShowcase'
import { CircularServicesGrid } from '../../components/CircularServicesGrid'
import { api } from '../../services/api'
import { getOptimizedUrl } from '../../utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'
import { ScrollReveal } from '../../utils/scrollReveal'
import { useIsMobile } from '../../utils/useIsMobile'
import PositionedImage from '../../components/common/PositionedImage'

export const HomePage = () => {
  const [showModal, setShowModal] = useState(false)
  const [portfolio, setPortfolio] = useState([])
  const [services, setServices] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [heroImages, setHeroImages] = useState([])
  const [aboutData, setAboutData] = useState(null)
  const isMobile = useIsMobile(768)

  const loadData = async () => {
    try {
      const homepageRes = await api.get('/homepage')

      const homepageData = homepageRes.data || {}
      setPortfolio(homepageData.portfolio || [])
      setServices(homepageData.services || [])
      setHeroImages(homepageData.heroImages || [])
      setProducts(Array.isArray(homepageData.products) ? homepageData.products : [])
      setAboutData(homepageData.about || null)
    } catch (err) {
      console.warn('[HOME] Failed to load data:', err?.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial data load is a standard pattern
    loadData()
  }, [])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'portfolio-changed' || payload?.type === 'services-changed' || payload?.type === 'products-changed' || payload?.type === 'hero-images-changed' || payload?.type === 'about-changed') {
        loadData()
      }
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [])

  const getProjectImage = (item) => {
    if (!item) return null
    return (
      item.imageUrl ||
      item.mediaUrl ||
      item.mediaUrls?.[0] ||
      item.galleryImages?.[0] ||
      null
    )
  }

const getProductImage = (item) => {
    if (!item || !item.images) return null
    return typeof item.images[0] === 'string' ? item.images[0] : item.images[0]?.url || null
  }

  const socialLinks = [
    { label: 'Instagram', href: 'https://www.instagram.com/hokinteriors', icon: 'Instagram' },
    { label: 'TikTok', href: 'https://www.tiktok.com/@hokinteriors', icon: 'TikTok' },
    { label: 'Facebook', href: 'https://www.facebook.com/share/14i3V8Sw7uo', icon: 'Facebook' },
    { label: 'Pinterest', href: 'https://www.pinterest.com/hokinterior', icon: 'Pinterest' },
  ]

  if (loading) {
    return (
      <main>
        <Hero onBookConsultation={() => setShowModal(true)} heroImages={[]} />
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
        <section className="bg-soft-cream px-6 md:px-12 lg:px-20 py-20 md:py-32">
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
                  <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-champagne-beige/60 text-espresso skeleton" />
                  <h3 className="font-display text-xl md:text-2xl font-medium text-espresso leading-tight skeleton" />
                  <p className="mt-2 text-sm text-espresso/60 leading-relaxed skeleton" />
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--secondary)]/20 via-[var(--bg)] to-[var(--accent)]/5 px-6 md:px-12 lg:px-20 py-20 md:py-32">
          <div className="container-wide">
            <div className="mb-16 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">Shop</p>
              <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
                Curated Collection
              </h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 lg:gap-12">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="group">
                  <div className="skeleton aspect-square w-full rounded-3xl mb-4" />
                  <div className="skeleton h-3 w-24 mb-2" />
                  <div className="skeleton h-5 w-16" />
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--secondary)]/20 px-6 md:px-12 lg:px-20 py-20 md:py-32">
          <div className="container-wide">
            <div className="mb-16 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Virtual Designs</p>
              <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
                Virtual Designs
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
        <AboutPreview />
        <ConsultationModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </main>
    )
  }

  return (
    <main>
      <div className={isMobile ? 'md:hidden' : 'hidden md:block'}>
        <Hero onBookConsultation={() => setShowModal(true)} heroImages={heroImages} className="h-[240px] min-h-[240px] rounded-b-[20px] mb-7" />
      </div>
      <div className={isMobile ? 'hidden md:block' : 'md:hidden'}>
        <Hero onBookConsultation={() => setShowModal(true)} heroImages={heroImages} />
      </div>

      <CircularPortfolioShowcase
        portfolio={portfolio}
        getProjectImage={getProjectImage}
      />

      <CircularServicesGrid
        services={services}
        images={services.reduce((acc, s) => {
          const img = s.imageUrl || s.mediaUrl || s.image || s.galleryImages?.[0]
          if (img) acc[s.key || s.id] = img
          return acc
        }, {})}
      />

      {/* Shop With Us - Desktop */}
      {!isMobile && (
        <section className="bg-[var(--secondary)]/30 md:py-20 md:md:py-32">
          <div className="container-wide md:px-12 lg:px-20">
            <ScrollReveal>
              <div className="mb-16 md:mb-24 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">Shop</p>
                <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
                  Shop With Us
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-base text-espresso/60 leading-relaxed">
                  Curated collection of premium home decor and accessories.
                </p>
              </div>
            </ScrollReveal>

            {products.length === 0 ? (
              <ScrollReveal>
                <div className="flex min-h-[40vh] items-center justify-center">
                  <p className="font-display text-xl text-[var(--primary)]/60">No products yet</p>
                </div>
              </ScrollReveal>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 lg:gap-12">
                {products.slice(0, 4).map((item, index) => (
                  <ScrollReveal key={item.id} delay={index * 80}>
                    <article className="group">
                      <Link to={`/shop/${item._id || item.id}`} className="block" aria-label={`View ${item.name} product`}>
                        <div className="relative aspect-square overflow-hidden rounded-3xl bg-white border border-[var(--border)]/40 shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-700">
                          <PositionedImage
                            src={getProductImage(item) || ''}
                            alt={item.name}
                            settings={{ fit: 'cover', position: 'center', zoom: 100 }}
                            className="h-full w-full transition duration-[1.2s] ease-out group-hover:scale-105"
                            loading={index < 2 ? 'eager' : 'lazy'}
                            fetchPriority={index < 2 ? 'high' : undefined}
                            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                          />
                        </div>
                        <div className="p-5 md:p-6 border-t border-[var(--border)]/40 bg-white text-center">
                          <h3 className="font-display text-lg md:text-xl font-medium text-espresso leading-tight mb-2">
                            {item.name}
                          </h3>
                          <p className="font-medium text-espresso">{item.discountPrice ? `$${Number(item.discountPrice).toFixed(2)}` : item.price ? `$${Number(item.price).toFixed(2)}` : ''}</p>
                        </div>
                      </Link>
                    </article>
                  </ScrollReveal>
                ))}
              </div>
            )}
            <div className="mt-12 text-center">
              <Link to="/shop" className="btn-luxury-primary group inline-flex items-center gap-2">
                View All Products
                <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Socials - Desktop */}
      {!isMobile && (
        <section className="bg-soft-cream md:py-20 md:md:py-32">
          <div className="container-wide md:px-12 lg:px-20">
            <ScrollReveal>
              <div className="mb-16 md:mb-24 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Follow Us</p>
                <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
                  Socials
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
                  Join our design community across platforms and see how we bring luxury interiors to life.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {socialLinks.map((item, index) => {
                const Icon = item.icon
                return (
                  <ScrollReveal key={item.label} delay={index * 80}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center text-center rounded-3xl border border-[var(--border)] bg-white p-8 transition-all duration-500 hover:border-[var(--accent)]/60 hover:shadow-[0_25px_80px_rgba(42,36,31,0.12)] hover:-translate-y-1"
                    >
                      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#E6D8C9]/60 text-[#2A241F] transition-all duration-500 group-hover:bg-[#E89A43] group-hover:text-white group-hover:scale-105 mb-6">
                        <Icon size={32} strokeWidth={1.5} aria-hidden="true" />
                      </span>
                      <h3 className="font-display text-xl md:text-2xl font-normal text-[#2A241F] leading-tight mb-2 group-hover:text-[#E89A43] transition-colors">
                        {item.label}
                      </h3>
                      <p className="text-sm text-[#2A241F]/60 leading-relaxed mb-6">{item.desc}</p>
                      <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]">
                        Give Me A Follow
                        <ArrowRight size={12} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </a>
                  </ScrollReveal>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* About Us - Desktop */}
      {!isMobile && aboutData && (
        <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--accent)]/5 md:py-20 md:md:py-32">
          <div className="container-wide md:px-12 lg:px-20">
            <div className="grid gap-16 md:grid-cols-2">
              <ScrollReveal>
                <div className="space-y-6 max-w-3xl">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">About Us</p>
                  <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
                    {aboutData.heading || 'About HOK'}
                  </h2>
                  {aboutData.companyDescription && (
                    <p className="text-base leading-[1.8] text-[var(--primary)]/55">{aboutData.companyDescription}</p>
                  )}
                  {aboutData.story && (
                    <p className="text-lg leading-[1.8] text-[var(--primary)]">{aboutData.story}</p>
                  )}
                  <Link to="/about" className="btn-luxury-primary mt-4 inline-flex items-center gap-2">
                    Learn More
                    <ArrowRight size={14} strokeWidth={1.5} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </ScrollReveal>
              <ScrollReveal>
                <div className="space-y-4">
                  {aboutData.aboutImageUrl && (
                    <PositionedImage
                      src={aboutData.aboutImageUrl}
                      alt="About HOK Interior Designs"
                      settings={aboutData.mediaSettings}
                      className="rounded-3xl w-full aspect-[4/5] object-cover shadow-[0_10px_40px_rgba(42,36,31,0.06)]"
                    />
                  )}
                  {aboutData.heroImage && !aboutData.aboutImageUrl && (
                    <div className="rounded-3xl w-full aspect-[4/5] overflow-hidden shadow-[0_10px_40px_rgba(42,36,31,0.06)]">
                      <img
                        src={getOptimizedUrl(aboutData.heroImage, { width: 800, height: 1000, crop: 'fill' })}
                        alt="About HOK Interior Designs"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  {!aboutData.aboutImageUrl && !aboutData.heroImage && (
                    <div className="rounded-3xl w-full aspect-[4/5] bg-gradient-to-br from-[var(--secondary)]/30 to-[var(--accent)]/10 flex items-center justify-center text-[var(--primary)]/30">
                      <Users size={64} />
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>
      )}

      <ConsultationModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </main>
  )
}
