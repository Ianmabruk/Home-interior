import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getOptimizedUrl } from '../../utils/cloudinaryHelpers'

const floatKeyframes = {
  y: [0, -8, 0],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'easeInOut',
  },
}

export const CircularNavCard = ({ to, label, imageUrl, alt, size = 220 }) => {
  const displayUrl = typeof imageUrl === 'string' ? imageUrl : null
  const diameter = `${size}px`
  const triangleSize = size * 0.18

  return (
    <motion.div
      className="flex flex-col items-center gap-4"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        animate={floatKeyframes}
        className="relative rounded-full"
        style={{
          width: diameter,
          height: diameter,
          boxShadow: '0 12px 40px rgba(42,36,31,0.08), 0 4px 12px rgba(42,36,31,0.04)',
          border: '3px solid rgba(214,178,122,0.35)',
          background: '#F5EFE8',
          overflow: 'hidden',
        }}
      >
        {displayUrl ? (
          <img
            src={getOptimizedUrl(displayUrl, { width: size * 2, crop: 'limit' })}
            alt={alt || label}
            className="h-full w-full object-contain"
            loading="lazy"
            decoding="async"
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

        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: 'inset 0 2px 8px rgba(42,36,31,0.04)',
          }}
        />
      </motion.div>

      <Link
        to={to}
        className="relative flex items-center justify-center group focus:outline-none"
        style={{
          width: `${size * 0.38}px`,
          height: `${triangleSize}px`,
          minWidth: '64px',
          minHeight: '44px',
        }}
        aria-label={`${label} — tap to explore`}
      >
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full overflow-visible"
          preserveAspectRatio="none"
        >
          <polygon
            points="50,0 0,100 100,100"
            fill="#E89A43"
            className="transition-all duration-300 group-hover:fill-[#D88227]"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(232,154,67,0.25))' }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-white font-display text-sm md:text-base font-normal tracking-wide"
          style={{
            transform: 'translateY(6%)',
            textShadow: '0 1px 2px rgba(0,0,0,0.15)',
          }}
        >
          {label}
        </span>
      </Link>
    </motion.div>
  )
}

export default CircularNavCard
