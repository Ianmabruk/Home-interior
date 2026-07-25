import { Link } from 'react-router-dom'
import { getOptimizedUrl } from '../../utils/cloudinaryHelpers'

export const CircularNavCard = ({ to, label, imageUrl, alt, size = 300, priority = false }) => {
  const displayUrl = typeof imageUrl === 'string' ? imageUrl : null
  const clampedSize = Math.min(size, 320)

  return (
    <div className="flex flex-col items-center w-full animate-fade-up">
      <div className="relative flex justify-center items-start w-full" style={{ height: clampedSize + 40 }}>
        <Link
          to={to}
          className="relative flex flex-col items-center group focus:outline-none"
          aria-label={`${label} \u2014 tap to explore`}
        >
          <div
            className="relative rounded-full transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              width: clampedSize,
              height: clampedSize,
              boxShadow: '0 8px 25px rgba(42,36,31,0.1)',
              border: '2px solid #E89A43',
              background: '#F5EFE8',
              overflow: 'hidden',
            }}
          >
            {displayUrl ? (
              <img
                src={getOptimizedUrl(displayUrl, { width: clampedSize * 2, crop: 'limit' })}
                alt={alt || label}
                className="h-full w-full object-cover"
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={priority ? 'high' : undefined}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-espresso/20">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              </div>
            )}
          </div>

          <div className="mt-6 w-full max-w-xs">
            <Link
              to={to}
              className="block w-full py-4 px-8 bg-[#E89A43] text-white text-base font-semibold uppercase tracking-wide rounded-full whitespace-nowrap text-center shadow-[0_4px_16px_rgba(232,154,67,0.4)] hover:shadow-[0_8px_24px_rgba(232,154,67,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              aria-label={`View ${label}`}
            >
              {label}
            </Link>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default CircularNavCard