import { useMemo } from 'react'
import { SiFacebook, SiInstagram, SiPinterest, SiTiktok, SiWhatsapp, SiX, SiYoutube, SiGlobus } from 'react-icons/si'
import { getDefaultSocialItems } from '@constants/socialLinks'
import { getSocialBrand } from '@constants/socialBrands'

const platformIconMap = {
  instagram: SiInstagram,
  facebook: SiFacebook,
  tiktok: SiTiktok,
  pinterest: SiPinterest,
  youtube: SiYoutube,
  whatsapp: SiWhatsapp,
  x: SiX,
  custom: SiGlobus,
}

export const SocialIcons = ({ className = '', items: externalItems, dark = false }) => {
  const defaultItems = useMemo(() => getDefaultSocialItems(), [])

  const items = useMemo(() => {
    if (externalItems !== undefined) {
      return externalItems.filter((item) => item && item.link && item.link.trim() !== '')
    }
    return defaultItems
  }, [externalItems, defaultItems])

  const getIconForPlatform = (platform) => {
    if (!platform) return SiGlobus
    const key = platform.toLowerCase()
    return platformIconMap[key] || SiGlobus
  }

  const getIconColor = (platform, darkMode) => {
    const brand = getSocialBrand(platform)
    return darkMode ? '#FFFFFF' : brand.color
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {items.map((item) => {
        const Icon = getIconForPlatform(item.platform)
        const platformKey = (item.platform || '').toLowerCase()
        const label = item.name || platformKey || 'Social'
        const iconColor = getIconColor(item.platform, dark)
        return (
          <a
            key={item.id || item.link}
            href={item.link}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={item.ariaLabel || `Follow us on ${label}`}
            className={`group relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(42,36,31,0.12)] ${
              dark
                ? 'border-white/20 bg-white/10 hover:bg-[var(--accent)] hover:border-[var(--accent)]'
                : 'border-[var(--border)]/40 bg-[var(--card)]/60 hover:bg-[var(--accent)] hover:border-[var(--accent)]'
            }`}
          >
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={label} className="h-5 w-5 object-contain" loading="lazy" decoding="async" width={20} height={20} />
            ) : (
              <Icon size={18} strokeWidth={1.5} className="transition-transform duration-300 group-hover:scale-110" aria-hidden="true" style={{ color: iconColor }} />
            )}
            <span className="absolute inset-0 rounded-2xl ring-0 group-focus-visible:ring-2 group-focus-visible:ring-[var(--accent)]" />
          </a>
        )
      })}
    </div>
  )
}
