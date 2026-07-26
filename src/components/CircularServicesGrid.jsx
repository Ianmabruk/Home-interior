import { Link, memo } from 'react'
import { getOptimizedUrl } from '../utils/cloudinaryHelpers'

const SERVICES_CONFIG = [
  { key: 'residential', label: 'Residential Design', icon: 'Brush' },
  { key: 'commercial', label: 'Commercial Design', icon: 'LayoutGrid' },
  { key: 'virtual', label: 'Virtual Designs', icon: 'MonitorSmartphone' },
  { key: 'furniture', label: 'Furniture Curation', icon: 'Armchair' },
  { key: 'space', label: 'Space Planning', icon: 'Search' },
  { key: 'styling', label: 'Styling Consultation', icon: 'Sparkles' },
]

const ICON_MAP = {
  Brush: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 4 9 9 0 1 1-9-9Z"/><line x1="21" y1="9" x2="15.5" y2="14.5"/><line x1="15" y1="15" x2="14" y2="16"/></svg>,
  LayoutGrid: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
  MonitorSmartphone: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8V5a2 2 0 0 0-2-2H4"/><path d="M17 9h.01"/><rect width="6" height="10" x="16" y="12" rx="2"/><path d="M6 12h.01"/><rect width="6" height="12" x="4" y="8" rx="2"/></svg>,
  Armchair: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5"/><path d="M5 18v2"/><path d="M19 18v2"/></svg>,
  Search: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Sparkles: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v2.2"/><path d="M16.38 4.74l1.06 1.06"/><path d="M18 12h2.2"/><path d="M21 16.38l-1.06 1.06"/><path d="M12 21v-2.2"/><path d="M7.64 19.34l1.06-1.06"/><path d="M3 12h-2.2"/><path d="M4.74 4.74l-1.06 1.06"/></svg>,
}

const CIRCULAR_CARD_SIZE = 300

const CircularServiceCard = memo(({ service, imageUrl, size = CIRCULAR_CARD_SIZE, index = 0 }) => {
  const config = SERVICES_CONFIG.find(s => s.key === service.key) || SERVICES_CONFIG[0]
  const Icon = ICON_MAP[config.icon] || ICON_MAP.Brush
  const displayUrl = typeof imageUrl === 'string' ? imageUrl : null
  const clampedSize = Math.min(size, 320)

  return (
    <div
      className="animate-fade-up flex flex-col items-center"
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="relative flex justify-center items-center w-full" style={{ height: clampedSize + 60 }}>
        <div className="relative flex flex-col items-center group focus:outline-none">
          <div
            className="relative rounded-full hover-scale hover:shadow-[0_20px_60px_rgba(42,36,31,0.15)] active:scale-[0.98]"
            style={{
              width: clampedSize,
              height: clampedSize,
              boxShadow: '0 12px 40px rgba(42,36,31,0.1), 0 0 0 2px rgba(232,154,67,0.25)',
              border: '2px solid #E89A43',
              background: '#F5EFE8',
              overflow: 'hidden',
            }}
          >
            {displayUrl ? (
              <img
                src={getOptimizedUrl(displayUrl, { width: clampedSize * 2, crop: 'limit' })}
                alt={service.title || config.label}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[var(--primary)]/30">
                <Icon />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/20 via-transparent to-transparent pointer-events-none" />
          </div>

          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-xs px-4"
            style={{ zIndex: 10 }}
          >
            <Link
              to="/services"
              className="block w-full py-3 px-6 bg-[#E89A43] text-white text-base font-semibold uppercase tracking-wide rounded-full text-center whitespace-nowrap shadow-[0_4px_16px_rgba(232,154,67,0.4)] hover:shadow-[0_8px_24px_rgba(232,154,67,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              aria-label={`View ${service.title || config.label}`}
            >
              {service.title || config.label}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
})

CircularServiceCard.displayName = 'CircularServiceCard'

export const CircularServicesGrid = memo(({ services = [], images = {}, size = CIRCULAR_CARD_SIZE }) => {
  const serviceItems = services.slice(0, 6).map((service, index) => ({
    ...service,
    imageUrl: images[service.key] || images[service.id] || null,
    index
  }))

  if (!serviceItems.length) return null

  return (
    <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-20 md:py-32">
      <div className="container-wide">
        <div className="animate-fade-up mb-16 md:mb-24 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">Services</p>
          <h2 className="font-display text-4xl font-medium leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
            What We Do
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
            Comprehensive interior design services tailored to elevate your space with timeless elegance.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
          {serviceItems.map((item, index) => (
            <CircularServiceCard key={item.id || item.key || index} service={item} imageUrl={item.imageUrl} size={size} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
})

CircularServicesGrid.displayName = 'CircularServicesGrid'

export default CircularServicesGrid
