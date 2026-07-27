import { Link, memo } from 'react'
import { getOptimizedUrl } from '../../utils/cloudinaryHelpers'
import { SERVICES_CONFIG, SERVICE_ICONS, CIRCULAR_CARD_SIZE } from '../../constants/servicesConfig'

const CircularServiceCard = memo(({ service, imageUrl, size = CIRCULAR_CARD_SIZE, index = 0 }) => {
  const config = SERVICES_CONFIG.find(s => s.key === service.key) || SERVICES_CONFIG[0]
  const Icon = SERVICE_ICONS[config.icon] || SERVICE_ICONS.Brush
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
                {Icon}
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