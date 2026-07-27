import { useState, useEffect, useCallback, memo } from 'react'
import { api } from '@services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { Link } from 'react-router-dom'
import { ArrowRight, ExternalLink } from 'lucide-react'

const PLATFORM_CONFIG = {
  tiktok: { label: 'TikTok', color: '#000000', icon: 'tiktok' },
  instagram: { label: 'Instagram', color: '#E4405F', icon: 'instagram' },
  facebook: { label: 'Facebook', color: '#1877F2', icon: 'facebook' },
  pinterest: { label: 'Pinterest', color: '#BD081C', icon: 'pinterest' },
}

const SocialIcons = ({ platform, size = 28 }) => {
  const icons = {
    tiktok: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 8.5c0-2.5-2-4.5-4.5-4.5C8 4 6 6 6 8.5c0 2.7 3.5 6 6 8.1 2.6-2.2 6-5.4 6-8.1z" />
        <path d="M12 16h.01" />
      </svg>
    ),
    instagram: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
    ),
    facebook: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
    pinterest: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
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

const SkeletonSocials = memo(() => (
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
          <div key={i} className="group flex flex-col items-center">
            <div className="relative w-full max-w-sm mx-auto mb-6">
              <div className="relative rounded-full overflow-hidden bg-[var(--secondary)]/30 skeleton aspect-square" />
            </div>
            <div className="w-full max-w-xs px-8 py-4 bg-[#E89A43] text-white text-base font-semibold uppercase tracking-wide rounded-full text-center whitespace-nowrap skeleton" />
          </div>
        ))}
      </div>
    </div>
  </section>
))

SkeletonSocials.displayName = 'SkeletonSocials'

const ErrorSocials = memo(({ onRetry }) => (
  <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--secondary)]/20 px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="text-center py-12">
        <p className="font-display text-xl text-[var(--primary)]/60 mb-4">Unable to load socials</p>
        <button onClick={onRetry} className="btn-luxury-primary inline-flex items-center gap-2">
          Retry
          <ArrowRight size={14} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  </section>
))

ErrorSocials.displayName = 'ErrorSocials'

export const SocialSection = memo(() => {
  const [socialLinks, setSocialLinks] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/socials')
      setSocialLinks(res.data || {})
    } catch (err) {
      setError(err?.message || 'Failed to load socials')
      console.warn('[SOCIAL SECTION] Failed to load:', err?.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'socials-changed') loadData()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadData])

  if (loading) return <SkeletonSocials />
  if (error) return <ErrorSocials onRetry={loadData} />

  const platforms = [
    { key: 'tiktok', ...PLATFORM_CONFIG.tiktok },
    { key: 'instagram', ...PLATFORM_CONFIG.instagram },
    { key: 'facebook', ...PLATFORM_CONFIG.facebook },
    { key: 'pinterest', ...PLATFORM_CONFIG.pinterest },
  ]

  return (
    <section id="socials" className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--secondary)]/20 py-20 md:py-32">
      <div className="container-wide md:px-12 lg:px-20">
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
          {platforms.map((platform) => {
            const url = socialLinks[platform.key]
            const hasLink = url && url.trim() !== ''
            return (
              <div key={platform.key} className="group flex flex-col items-center">
                <div className="relative w-full max-w-sm mx-auto mb-6">
                  <div className="relative rounded-full overflow-hidden bg-[var(--secondary)]/30">
                    <div className="h-[320px] w-full flex items-center justify-center" style={{ color: platform.color }}>
                      <SocialIcons platform={platform.icon} size={64} />
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
                      className="flex items-center justify-center gap-2 w-full py-4 bg-[#E89A43] text-white text-base font-semibold uppercase tracking-wide rounded-full text-center whitespace-nowrap shadow-[0_4px_16px_rgba(232,154,67,0.4)] hover:shadow-[0_8px_24px_rgba(232,154,67,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                    >
                      Give Us a Follow
                      <ExternalLink size={14} strokeWidth={1.5} />
                    </a>
                  ) : (
                    <button
                      className="w-full py-4 bg-[var(--border)] text-[var(--primary)]/40 text-base font-semibold uppercase tracking-wide rounded-full text-center whitespace-nowrap cursor-not-allowed"
                      disabled
                    >
                      Link Not Configured
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <Link to="/socials" className="btn-luxury-primary group inline-flex items-center gap-2">
            View All Socials
            <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  )
})

SocialSection.displayName = 'SocialSection'

export default SocialSection