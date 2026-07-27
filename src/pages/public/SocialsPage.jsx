import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { api } from '@services/api'
import { getOptimizedUrl } from '@utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'
import { SOCIAL_LINKS } from '@constants/socialLinks'

const SkeletonSocials = () => (
  <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--secondary)]/20 px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="mb-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Socials</p>
        <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
          Follow Our Journey
        </h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="group flex flex-col items-center">
            <div className="relative w-full max-w-sm mx-auto mb-6">
              <div className="relative rounded-full overflow-hidden bg-[var(--secondary)]/30 skeleton aspect-square" />
            </div>
            <div className="skeleton h-6 w-24" />
          </div>
        ))}
      </div>
    </div>
  </section>
)

export const SocialsPage = () => {
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)

  const loadFeed = useCallback(async () => {
    try {
      const res = await api.get('/socials')
      setFeed(res.data || [])
    } catch (err) {
      console.warn('[SOCIALS] Failed to load:', err?.message)
      setFeed([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'socials-changed') loadFeed()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadFeed])

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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 lg:gap-12 mb-16">
            {SOCIAL_LINKS.map((social, index) => (
              <motion.a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="group flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-[var(--border)]/40 hover:border-[var(--accent)]/40 hover:shadow-[0_20px_40px_rgba(42,36,31,0.1)] transition-all duration-500"
              >
                <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-[var(--secondary)]/30 group-hover:bg-[var(--accent)]/10 transition-all duration-500">
                  {social.icon === 'TikTok' && (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary)] group-hover:text-[var(--accent)] transition-colors">
                      <path d="M15 8.5c0-2.5-2-4.5-4.5-4.5C8 4 6 6 6 8.5c0 2.7 3.5 6 6 8.1 2.6-2.2 6-5.4 6-8.1z" />
                      <path d="M12 16h.01" />
                    </svg>
                  )}
                  {social.icon === 'Instagram' && (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary)] group-hover:text-[var(--accent)] transition-colors">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  )}
                  {social.icon === 'Facebook' && (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary)] group-hover:text-[var(--accent)] transition-colors">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  )}
                  {social.icon === 'Pinterest' && (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary)] group-hover:text-[var(--accent)] transition-colors">
                      <line x1="12" y1="17" x2="12" y2="12" />
                      <line x1="12" y1="7" x2="12" y2="3" />
                      <line x1="4.5" y1="9.5" x2="4.5" y2="5.5" />
                      <line x1="19.5" y1="9.5" x2="19.5" y2="5.5" />
                      <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6" />
                      <circle cx="12" cy="14" r="4" />
                    </svg>
                  )}
                </div>
                <h3 className="font-display text-xl font-medium text-[var(--primary)] group-hover:text-[var(--accent)] transition-colors">
                  {social.label}
                </h3>
                <p className="mt-1 text-sm text-[var(--primary)]/60">Follow us</p>
              </motion.a>
            ))}
          </div>

          {feed.length > 0 && (
            <div>
              <h3 className="font-display text-2xl md:text-3xl font-medium text-[var(--primary)] mb-8 text-center">Latest Posts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
                {feed.slice(0, 6).map((post, index) => (
                  <motion.div
                    key={post.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className="group bg-white rounded-3xl overflow-hidden border border-[var(--border)]/40 hover:shadow-[0_20px_40px_rgba(42,36,31,0.1)] transition-all duration-500"
                  >
                    {post.imageUrl && (
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={getOptimizedUrl(post.imageUrl, { width: 600, crop: 'limit' })}
                          alt={post.caption || post.title || 'Social post'}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <p className="text-sm text-[var(--primary)]/60 line-clamp-3">{post.caption || post.content || 'Follow us for more design inspiration.'}</p>
                      <div className="mt-4 flex items-center gap-2 text-xs text-[var(--primary)]/40">
                        <span>{post.platform || 'Instagram'}</span>
                        <span>·</span>
                        <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recently'}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {feed.length === 0 && (
            <div className="text-center py-20">
              <p className="font-display text-xl text-[var(--primary)]/60">No social posts available at the moment.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default SocialsPage