import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getOptimizedUrl } from '../../utils/cloudinaryHelpers'

const floatKeyframes = {
  y: [0, -10, 0],
  transition: {
    duration: 5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
}

const TriangleSVG = ({ label }) => (
  <svg viewBox="0 0 180 72" className="w-full h-full" preserveAspectRatio="none" aria-hidden="true">
    <path
      d="M 0 0 L 144 0 A 16 16 0 0 1 160 16 L 160 56 A 16 16 0 0 1 144 72 Z"
      fill="#E89A43"
    />
    <text
      x="38"
      y="42"
      fill="white"
      fontFamily="'Plus Jakarta Sans', 'Plus Jakarta Sans Fallback', system-ui, sans-serif"
      fontSize="16"
      fontWeight="600"
      letterSpacing="0.02em"
      textAnchor="start"
    >
      {label}
    </text>
  </svg>
)

export const CircularNavCard = ({ to, label, imageUrl, alt, size = 300 }) => {
  const displayUrl = typeof imageUrl === 'string' ? imageUrl : null
  const clampedSize = Math.min(size, 320)

  return (
    <motion.div
      className="flex flex-col items-center w-full"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative flex justify-center items-start w-full" style={{ height: clampedSize + 50 }}>
        <Link
          to={to}
          className="relative flex flex-col items-center group focus:outline-none"
          aria-label={`${label} — tap to explore`}
        >
          <motion.div
            animate={floatKeyframes}
            className="relative rounded-full"
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
          </motion.div>

          <TriangleSVG label={label} className="relative -mt-px w-[180px] h-[72px] flex-shrink-0" />
        </Link>
      </div>
    </motion.div>
  )
}

export default CircularNavCard
