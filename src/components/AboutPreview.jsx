import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import { getOptimizedUrl } from '../utils/cloudinaryHelpers'
import { Link } from 'react-router-dom'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../utils/adminEvents'

export const AboutPreview = () => {
  const [aboutData, setAboutData] = useState(null)

  const loadAbout = useCallback(async () => {
    try {
      const res = await api.get('/about')
      setAboutData(res.data || null)
    } catch {
      setAboutData(null)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial data load is a standard pattern
    loadAbout()
  }, [loadAbout])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'about-changed') loadAbout()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadAbout])

  const story =
    aboutData?.story ||
    aboutData?.content ||
    aboutData?.description ||
    'We are a team of passionate designers dedicated to creating spaces that inspire and delight. With years of experience and a commitment to excellence, we bring your vision to life through thoughtful design, premium materials, and meticulous attention to detail.'
  const mission =
    aboutData?.mission ||
    'To transform spaces into timeless environments that reflect the unique personality and lifestyle of each client.'
  const imageUrl =
    aboutData?.aboutImageUrl || aboutData?.heroImage || ''

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="bg-soft-cream px-6 md:px-12 lg:px-20 py-20 md:py-32"
    >
      <div className="container-wide">
        <div className="grid items-center gap-12 lg:gap-24 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* Premium Framed Container */}
            <div className="relative overflow-hidden shadow-[0_32px_100px_rgba(42,36,31,0.12),_0_0_0_1px_rgba(232,154,67,0.15),_0_0_0_4px_rgba(250,248,244,0.8),_inset_0_1px_0_rgba(255,255,255,0.1)] aspect-[4/5] md:aspect-[3/4] rounded-3xl bg-[var(--bg)]">
              {/* Outer gold accent border */}
              <div className="absolute inset-0 border-2 border-[var(--accent)]/20 rounded-3xl pointer-events-none" />
              {/* Inner subtle highlight */}
              <div className="absolute inset-[2px] border border-white/30 rounded-[22px] pointer-events-none" />
              {/* Bottom accent bar */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gradient-to-r from-[var(--accent)] via-[var(--secondary)] to-[var(--accent)] rounded-t-full" />
              {/* Corner accents */}
              <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-[var(--accent)]/40 rounded-tl-3xl pointer-events-none" />
              <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-[var(--accent)]/40 rounded-tr-3xl pointer-events-none" />
              <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-[var(--accent)]/40 rounded-bl-3xl pointer-events-none" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-[var(--accent)]/40 rounded-br-3xl pointer-events-none" />
              
              <img
                src={getOptimizedUrl(imageUrl, { width: 960, crop: 'limit' })}
                alt="Luxury interior design studio"
                className="relative z-10 h-full w-full object-cover transition duration-[1.2s] hover:scale-105 rounded-3xl"
                loading="lazy"
                decoding="async"
                fetchPriority="high"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-luxury-text/10 to-transparent pointer-events-none rounded-3xl" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8 md:space-y-10 max-w-3xl"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-accent mb-4">Our Story</p>
              <h3 className="font-display text-3xl md:text-4xl lg:text-5xl font-normal text-luxury-text leading-[1.15]">
                Designing Spaces,
                <br />
                Creating Memories
              </h3>
            </div>
            <p className="text-base md:text-lg leading-[1.8] text-luxury-text/70">{story}</p>

            <div className="py-2 border-t border-b border-linen/40">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-accent mb-3">Our Philosophy</p>
              <p className="font-display text-xl md:text-2xl text-luxury-text italic leading-relaxed">{mission}</p>
            </div>

            <Link
              to="/about"
              className="group inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-widest text-orange-accent transition-colors duration-300 hover:text-warm-bronze"
            >
              Discover Our Story
              <motion.svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-300 group-hover:translate-x-1"
                whileHover={{ x: 4 }}
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </motion.svg>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}