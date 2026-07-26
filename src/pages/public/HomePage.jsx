import { useState, useEffect, useCallback, memo, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Hero } from '../../components/Hero'
import { AboutPreview } from '../../components/AboutPreview'
import { ConsultationModal } from '../../components/ConsultationModal'
import { CircularPortfolioShowcase } from '../../components/CircularPortfolioShowcase'
import { CircularServicesGrid } from '../../components/CircularServicesGrid'
import { api } from '../../services/api'
import { getOptimizedUrl } from '../../utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'
import { ScrollReveal } from '../../utils/scrollReveal'
import { CircularNavCard } from '../../components/mobile/CircularNavCard'
import { PageMeta } from '../../hooks/usePageMeta'

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

const ContactSection = memo(({ contactInfo }) => {
  const phoneNumbers = contactInfo?.phoneNumbers || ['+254 700 000 000', '+254 711 111 111']
  const emails = contactInfo?.emails || ['info@hokinteriors.com', 'projects@hokinteriors.com']
  const addresses = contactInfo?.addresses || ['Westlands, Nairobi, Kenya']
  const businessHours = contactInfo?.businessHours || 'Mon - Fri: 8:00 AM - 6:00 PM\nSat: 9:00 AM - 4:00 PM\nSun: Closed'

  return (
    <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--accent)]/5 px-6 md:px-12 lg:px-20 py-20 md:py-32">
      <div className="container-wide">
        <ScrollReveal>
          <div className="mb-16 md:mb-24 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Contact Us</p>
            <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
              Get In Touch
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
              We&apos;d love to hear from you. Reach out and let&apos;s start a conversation about your project.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-8 md:grid-cols-3 mb-16">
          <ScrollReveal delay={0} className="text-center md:text-left">
            <div className="mx-auto md:mx-0 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
            </div>
            <h3 className="font-display text-xl font-normal text-[var(--primary)] mb-2">Phone Numbers</h3>
            <div className="space-y-1 text-[var(--primary)]/60 leading-relaxed">
              {phoneNumbers.map((phone, i) => (
                <p key={i}>{phone}</p>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100} className="text-center md:text-left">
            <div className="mx-auto md:mx-0 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
            </div>
            <h3 className="font-display text-xl font-normal text-[var(--primary)] mb-2">Email Addresses</h3>
            <div className="space-y-1 text-[var(--primary)]/60 leading-relaxed">
              {emails.map((email, i) => (
                <p key={i}>{email}</p>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200} className="text-center md:text-left">
            <div className="mx-auto md:mx-0 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            </div>
            <h3 className="font-display text-xl font-normal text-[var(--primary)] mb-2">Office Location</h3>
            <div className="space-y-1 text-[var(--primary)]/60 leading-relaxed">
              {addresses.map((address, i) => (
                <p key={i}>{address}</p>
              ))}
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={300}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--primary)] via-[var(--primary)]/90 to-[var(--primary)]/70 p-8 md:p-12 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,154,67,0.2),transparent_60%)]" />
            <div className="relative z-10">
              <div className="mx-auto md:mx-0 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm text-white border border-white/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-normal text-white mb-4">Business Hours</h3>
              <pre className="text-white/70 leading-relaxed whitespace-pre-wrap text-left max-w-md mx-auto">
                {businessHours}
              </pre>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
})

ContactSection.displayName = 'ContactSection'

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
  <section className="bg-soft-cream px-6 md:px-12 lg:px-20 py-20 md:py-32">
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
      if (payload?.type === 'portfolio-changed' || payload?.type === 'services-changed' || payload?.type === 'virtual-changed' || payload?.type === 'hero-images-changed' || payload?.type === 'contact-changed') {
        loadData()
      }
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadData])

  useEffect(() => {
    const loadContact = async () => {
      const res = await api.get('/contact')
      setContactInfo(res.data)
    }
    loadContact()
  }, [])

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

        <section className="bg-soft-cream px-6 py-16">
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

        <section className="bg-soft-cream px-6 py-16">
          <div className="container-wide">
            <CircularNavCard
              to="/shop"
              label="Shop"
              imageUrl={heroImages[0] ? (typeof heroImages[0] === 'string' ? heroImages[0] : heroImages[0].imageUrl || heroImages[0].mediaUrls?.[0] || heroImages[0].url) : null}
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
              imageUrl={heroImages[0] ? (typeof heroImages[0] === 'string' ? heroImages[0] : heroImages[0].imageUrl || heroImages[0].mediaUrls?.[0] || heroImages[0].url) : null}
              alt="HOK Interiors Social"
              size={300}
            />
          </div>
        </section>

        <section className="bg-soft-cream px-6 py-16 pb-24">
          <div className="container-wide">
            <CircularNavCard
              to="/about"
              label="About Us"
              imageUrl={heroImages[0] ? (typeof heroImages[0] === 'string' ? heroImages[0] : heroImages[0].imageUrl || heroImages[0].mediaUrls?.[0] || heroImages[0].url) : null}
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
              {[
                { label: 'Mirrors', category: 'mirror' },
                { label: 'Artwork', category: 'artwork' },
                { label: 'Throw Pillows', category: 'throw-pillows' },
              ].map((cat) => (
                <div key={cat.category} className="group flex flex-col items-center">
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
                    to={`/shop/${cat.category}`}
                    className="w-full max-w-xs px-8 py-4 bg-[#E89A43] text-white text-base font-semibold uppercase tracking-wide rounded-full text-center whitespace-nowrap shadow-[0_4px_16px_rgba(232,154,67,0.4)] hover:shadow-[0_8px_24px_rgba(232,154,67,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                  >
                    {cat.label}
                  </Link>
                </div>
              ))}
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
        <section id="about" className="bg-soft-cream py-20 md:py-32">
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
