import { FaFacebookF, FaInstagram, FaPinterestP, FaTiktok, FaWhatsapp } from 'react-icons/fa6'

const iconMap = {
  instagram: FaInstagram,
  tiktok: FaTiktok,
  pinterest: FaPinterestP,
  facebook: FaFacebookF,
  whatsapp: FaWhatsapp,
}

const socialOrder = ['instagram', 'tiktok', 'facebook', 'pinterest', 'whatsapp']

const capitalize = (s) => (s === 'tiktok' ? 'TikTok' : s[0].toUpperCase() + s.slice(1))

const normalizeSocials = (socials = {}) =>
  socialOrder
    .map((key) => ({ key, url: socials?.[key], label: capitalize(key) }))
    .filter((item) => Boolean(item.url))

export const SocialIcons = ({ className = '', socials = {}, dark = false }) => {
  const items = normalizeSocials(socials)
  const showDefaults = items.length === 0

  const displayItems = showDefaults
    ? socialOrder.map((key) => ({ key, url: '#', label: capitalize(key), isDefault: true }))
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
            <Icon size={16} />
          </a>
        )
      })}
    </div>
  )
}
