import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { api } from '@services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'
import { SOCIAL_ICONS } from '@constants/socialLinks'

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
    { key: 'tiktok', label: 'TikTok', color: '#000000', icon: 'TikTok' },
    { key: 'instagram', label: 'Instagram', color: '#E4405F', icon: 'Instagram' },
    { key: 'facebook', label: 'Facebook', color: '#1877F2', icon: 'Facebook' },
    { key: 'pinterest', label: 'Pinterest', color: '#BD081C', icon: 'Pinterest' },
  ]

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
                        {SOCIAL_ICONS[platform.icon]}
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
