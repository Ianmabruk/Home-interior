import { useMemo, memo } from 'react'
import { Link } from 'react-router-dom'
import { getOptimizedUrl } from '../../utils/cloudinaryHelpers'

const CIRCLE_SIZE = {
  mobile: 280,
  tablet: 320,
  desktop: 380,
}

const NAV_ITEMS = [
  {
    key: 'portfolio',
    label: 'Portfolio',
    path: '/portfolio',
    getImage: (data) => {
      const item = data.portfolio?.[0]
      if (!item) return null
      return item.imageUrl || item.mediaUrl || item.mediaUrls?.[0] || item.galleryImages?.[0] || null
    },
  },
  {
    key: 'virtualDesigns',
    label: 'Virtual Designs',
    path: '/virtual-design',
    getImage: (data) => {
      const item = data.virtualDesigns?.[0]
      if (!item) return null
      return item.imageUrl || item.mediaUrl || item.mediaUrls?.[0] || item.galleryImages?.[0] || null
    },
  },
  {
    key: 'services',
    label: 'Services',
    path: '/services',
    getImage: (data) => {
      const item = data.services?.[0]
      if (!item) return null
      return item.imageUrl || item.mediaUrl || item.galleryImages?.[0] || null
    },
  },
  {
    key: 'shop',
    label: 'Shop With Us',
    path: '/shop',
    getImage: (data) => {
      const product = data.products?.[0]
      if (!product) return null
      return typeof product.images?.[0] === 'string'
        ? product.images[0]
        : product.images?.[0]?.url || null
    },
  },
  {
    key: 'about',
    label: 'About Us',
    path: '/about',
    getImage: (data) => data.about?.imageUrl || null,
  },
  {
    key: 'socials',
    label: 'Socials',
    path: '/socials',
    getImage: (data) => data.about?.imageUrl || null,
  },
]

const PlaceholderIcons = {
  portfolio: (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  ),
  virtualDesigns: (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  ),
  services: (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 4 9 9 0 1 1-9-9Z" />
      <line x1="21" y1="9" x2="15.5" y2="14.5" />
      <line x1="15" y1="15" x2="14" y2="16" />
    </svg>
  ),
  shop: (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 6H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z" />
      <path d="M3 12h18" />
      <path d="M9 6v6" />
      <path d="M15 6v6" />
    </svg>
  ),
  about: (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  ),
  socials: (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
}

const CircleItem = memo(({ item, data }) => {
  const imageUrl = useMemo(() => item.getImage(data), [item, data])
  const placeholder = PlaceholderIcons[item.key]

  return (
    <Link
      to={item.path}
      className="relative flex flex-col items-center group focus:outline-none"
      aria-label={`${item.label} — tap to explore`}
    >
      <div
        className="relative rounded-full transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          width: CIRCLE_SIZE.desktop,
          height: CIRCLE_SIZE.desktop,
          boxShadow: '0 12px 40px rgba(42,36,31,0.12)',
          border: '3px solid #E89A43',
          background: '#F5EFE8',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {imageUrl ? (
          <img
            src={getOptimizedUrl(imageUrl, { width: 800, crop: 'limit' })}
            alt={item.label}
            className="h-full w-full object-cover"
            loading={item.key === 'portfolio' ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={item.key === 'portfolio' ? 'high' : undefined}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--primary)]/20">
            {placeholder}
          </div>
        )}
      </div>

      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-xs px-4"
        style={{ zIndex: 10 }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            window.location.href = item.path
          }}
          className="block w-full py-3 px-6 bg-[#E89A43] text-white text-base font-semibold uppercase tracking-wide rounded-full text-center whitespace-nowrap shadow-[0_4px_16px_rgba(232,154,67,0.4)] hover:shadow-[0_8px_24px_rgba(232,154,67,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          aria-label={`View ${item.label}`}
        >
          {item.label}
        </button>
      </div>
    </Link>
  )
})

CircleItem.displayName = 'CircleItem'

export const CircularNavigationGrid = memo(({ portfolio = [], virtualDesigns = [], services = [], products = [], about = null }) => {
  const data = useMemo(() => ({
    portfolio,
    virtualDesigns,
    services,
    products,
    about,
  }), [portfolio, virtualDesigns, services, products, about])

  return (
    <section className="bg-[var(--secondary)]/30 py-16 md:py-24 lg:py-32">
      <div className="container-wide md:px-12 lg:px-20">
        <div
          className="grid gap-6 md:gap-8 lg:gap-10 justify-items-center grid-cols-1 md:grid-cols-3"
          role="list"
          aria-label="Navigation"
        >
          {NAV_ITEMS.map((item) => (
            <CircleItem key={item.key} item={item} data={data} />
          ))}
        </div>
      </div>
    </section>
  )
})

CircularNavigationGrid.displayName = 'CircularNavigationGrid'

export default CircularNavigationGrid