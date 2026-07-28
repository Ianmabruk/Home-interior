import { SiFacebookF, SiInstagram, SiPinterestP, SiTiktok, SiWhatsapp } from 'react-icons/si'
import { SOCIAL_LINKS } from '@constants/socialLinks'

const iconMap = {
  instagram: SiInstagram,
  tiktok: SiTiktok,
  pinterest: SiPinterestP,
  facebook: SiFacebookF,
  whatsapp: SiWhatsapp,
}

const socialOrder = ['instagram', 'tiktok', 'facebook', 'pinterest', 'whatsapp']

const capitalize = (s) => (s === 'tiktok' ? 'TikTok' : s[0].toUpperCase() + s.slice(1))

const normalizeSocials = (socials = {}) =>
  socialOrder
    .map((key) => ({ key, url: socials?.[key], label: capitalize(key) }))
    .filter((item) => Boolean(item.url))

export const SocialIcons = ({ className = '', socials, dark = false }) => {
  const items = normalizeSocials(socials)
  const showDefaults = items.length === 0

  const displayItems = showDefaults
    ? SOCIAL_LINKS.filter(link => link.href && link.href.trim() !== '')
        .map(link => ({ key: link.icon.toLowerCase(), url: link.href, label: link.label, isDefault: false }))
    : items.map((item) => ({ ...item, isDefault: false }))

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {displayItems.map((item) => {
        const Icon = iconMap[item.key]
        return (
          <a
            key={item.key}
            href={item.url}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={item.label}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
              dark
                ? 'border-white/20 bg-white/5 text-white hover:bg-bronze hover:border-bronze hover:text-charcoal'
                : 'border-white/20 bg-white/5 text-white hover:bg-bronze hover:border-bronze hover:text-charcoal'
            } ${item.isDefault ? 'opacity-40 cursor-default' : ''}`}
          >
            {Icon ? <Icon size={16} /> : <span className="inline-block h-4 w-4 rounded-full bg-white/10" />}
          </a>
        )
      })}
    </div>
  )
}
