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

  if (!items.length) return null

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {items.map((item) => {
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
                ? 'border-black/15 bg-white text-ink hover:bg-orange hover:border-orange hover:text-ink'
                : 'border-white/20 bg-white/5 text-white hover:bg-orange hover:border-orange hover:text-ink'
            }`}
          >
            <Icon size={16} />
          </a>
        )
      })}
    </div>
  )
}
