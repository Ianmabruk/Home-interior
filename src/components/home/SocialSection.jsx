import { useState, useEffect, useCallback, memo } from 'react'
import { api } from '@services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { ArrowRight } from 'lucide-react'
import { SOCIAL_ICONS, SOCIAL_LINKS } from '@constants/socialLinks'

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

  const platforms = SOCIAL_LINKS.map(link => ({
    key: link.icon.toLowerCase(),
    label: link.label,
    color: link.color || 'currentColor',
    icon: link.icon,
    href: link.href,
  }))

  return (
    <section id="socials" className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--secondary)]/20 py-20 md:py-32">
      <div className="container-wide md:px-12 lg:px-20">
        <div className="flex items-center justify-center gap-6 md:gap-8">
          {platforms.map((platform) => {
            const url = socialLinks[platform.key] || platform.href
            const hasLink = url && url.trim() !== ''
            return (
              <a
                key={platform.key}
                href={hasLink ? url : '#'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={platform.label}
                className="group relative flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full border border-[var(--border)] transition-all duration-500 hover:border-[var(--accent)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] hover:scale-110 active:scale-95"
                style={{ color: platform.color }}
              >
                {SOCIAL_ICONS[platform.icon]}
                {!hasLink && (
                  <span className="absolute inset-0 rounded-full border border-transparent transition-all duration-300 group-hover:border-[var(--accent)] group-hover:scale-110" aria-hidden="true" />
                )}
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
})

SocialSection.displayName = 'SocialSection'

export default SocialSection
