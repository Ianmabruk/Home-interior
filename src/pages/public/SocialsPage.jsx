import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { api } from '@services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'

const SkeletonSocials = () => (
  <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--secondary)]/20 px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="mb-16 md:mb-24 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Socials</p>
        <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
          Follow Our Journey
        </h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 lg:gap-12">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="group flex flex-col items-center"
          >
            <div className="relative w-full max-w-sm mx-auto mb-6">
              <div className="relative rounded-full overflow-hidden bg-[var(--secondary)]/30 skeleton aspect-square" />
            </div>
            <div className="skeleton h-6 w-3/4 mb-2" />
            <div className="skeleton h-10 w-full" />
          </motion.div>
        ))}
      </div>
    </div>
  </section>
)

export const SocialsPage = () => {
  const [socialLinks, setSocialLinks] = useState({})
  const [loading, setLoading] = useState(true)

  const loadSocials = useCallback(async () => {
    try {
      const res = await api.get('/socials')
      setSocialLinks(res.data || {})
    } catch (err) {
      console.warn('[SOCIALS] Failed to load:', err?.message)
      setSocialLinks({})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSocials()
  }, [loadSocials])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'socials-changed') loadSocials()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadSocials])

  const platforms = [
    { key: 'tiktok', label: 'TikTok', color: '#000000', icon: 'tiktok' },
    { key: 'instagram', label: 'Instagram', color: '#E4405F', icon: 'instagram' },
    { key: 'facebook', label: 'Facebook', color: '#1877F2', icon: 'facebook' },
    { key: 'pinterest', label: 'Pinterest', color: '#BD081C', icon: 'pinterest' },
  ]

  const getIcon = (platform) => {
    const icons = {
      tiktok: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 8.5c0-2.5-2-4.5-4.5-4.5C8 4 6 6 6 8.5c0 2.7 3.5 6 6 8.1 2.6-2.2 6-5.4 6-8.1z" />
          <path d="M12 16h.01" />
        </svg>
      ),
      instagram: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      ),
      facebook: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      ),
      pinterest: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="17" x2="12" y2="12" />
          <line x1="12" y1="7" x2="12" y2="3" />
          <line x1="4.5" y1="9.5" x2="4.5" y2="5.5" />
          <line x1="19.5" y1="9.5" x2="19.5" y2="5.5" />
          <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6" />
          <circle cx="12" cy="14" r="4" />
        </svg>
      ),
    }
    return icons[platform] || icons.instagram
  }

  if (loading) {
    return <main><SkeletonSocials /></main>
  }

  return (
    <main>
      <PageMeta
        title="Socials — HOK Interior Designs"
        description="Follow HOK Interior Designs on social media."
      />
      <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)] via-[var(--primary)]/80 to-[var(--bg)]" />
        <div className="relative z-10 container-wide px-6 md:px-12 lg:px-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl md:text-7xl lg:text-8xl font-semibold text-white leading-tight"
          >
            Socials
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-lg md:text-xl text-white/70 max-w-3xl mx-auto"
          >
            Stay inspired with our latest projects, design tips, and behind-the-scenes moments from the HOK Interiors studio.
          </motion.p>
        </div>
      </section>

      <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--secondary)]/20 px-6 md:px-12 lg:px-20 py-20 md:py-32">
        <div className="container-wide">
          <div className="mb-16 md:mb-24 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Socials</p>
            <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
              Follow Our Journey
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
              Stay inspired with our latest projects, design tips, and behind-the-scenes moments.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 lg:gap-12">
            {platforms.map((platform, index) => {
              const url = socialLinks[platform.key]
              const hasLink = url && url.trim() !== ''
              return (
                <motion.div
                  key={platform.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="group flex flex-col items-center"
                >
                  <div className="relative w-full max-w-sm mx-auto mb-6">
                    <div className="relative rounded-full overflow-hidden bg-[var(--secondary)]/30">
                      <div className="h-[320px] w-full flex items-center justify-center" style={{ color: platform.color }}>
                        {getIcon(platform.icon)}
                      </div>
                    </div>
                  </div>
                  <div className="text-center mb-4">
                    <h3 className="font-display text-xl font-medium text-[var(--primary)] group-hover:text-[var(--accent)] transition-colors">
                      {platform.label}
                    </h3>
                  </div>
                  <div className="w-full max-w-xs">
                    {hasLink ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-4 bg-[var(--primary)] text-white text-base font-semibold uppercase tracking-wide rounded-full text-center whitespace-nowrap shadow-[0_4px_16px_rgba(42,36,31,0.2)] hover:bg-[var(--primary)]/90 hover:shadow-[0_8px_24px_rgba(42,36,31,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                      >
                        Give Us a Follow
                      </a>
                    ) : (
                      <button
                        disabled
                        className="block w-full py-4 bg-[var(--primary)]/20 text-[var(--primary)]/40 text-base font-semibold uppercase tracking-wide rounded-full text-center whitespace-nowrap cursor-not-allowed"
                      >
                        Link Not Configured
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}

export default SocialsPage