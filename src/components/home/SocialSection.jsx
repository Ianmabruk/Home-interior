import { useState, useEffect, useCallback, memo } from 'react'
import { api } from '@services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const SOCIAL_PLATFORMS = [
  { label: 'Instagram', icon: 'instagram', color: '#E4405F' },
  { label: 'Pinterest', icon: 'pinterest', color: '#BD081C' },
  { label: 'LinkedIn', icon: 'linkedin', color: '#0A66C2' },
  { label: 'TikTok', icon: 'tiktok', color: '#000000' },
]

const SocialIcons = ({ platform, size = 28 }) => {
  const icons = {
    instagram: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
    pinterest: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="17" x2="12" y2="12" />
        <path d="M5 17h14v-1.26a2.5 2.5 0 0 0-1.17-2.17l-1.78-.9A2 2 0 0 1 14 7h.01a2 2 0 0 1 2 2v1.26c0 .69.31 1.3.82 1.68L17 17l-5 5" />
      </svg>
    ),
    linkedin: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
    tiktok: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3c5.5 0 7 4 7 4 0 3-4 4-6 2-2-2-2-5 0-7 3 4 5 4 5 4" />
        <path d="M6 14a6 6 0 0 0 12 0" />
        <path d="M9 18a4 4 0 0 1-4-4" />
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
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
        {[1, 2, 3].map((i) => (
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
  const [socials, setSocials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/socials')
      setSocials(res.data || [])
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

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
          {SOCIAL_PLATFORMS.map((social) => (
            <div key={social.label} className="group flex flex-col items-center">
              <div className="relative w-full max-w-sm mx-auto mb-6">
                <div className="relative rounded-full overflow-hidden bg-[var(--secondary)]/30">
                  <div className="h-[320px] w-full flex items-center justify-center text-[var(--primary)]/30">
                    <SocialIcons platform={social.icon} size={64} style={{ color: social.color }} />
                  </div>
                </div>
              </div>
              <Link
                to="/socials"
                className="w-full max-w-xs px-8 py-4 bg-[#E89A43] text-white text-base font-semibold uppercase tracking-wide rounded-full text-center whitespace-nowrap shadow-[0_4px_16px_rgba(232,154,67,0.4)] hover:shadow-[0_8px_24px_rgba(232,154,67,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                {social.label}
              </Link>
            </div>
          ))}
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