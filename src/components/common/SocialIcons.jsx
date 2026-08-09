import { useState, useEffect } from 'react'
import { SiFacebook, SiInstagram, SiPinterest, SiTiktok, SiWhatsapp, SiX, SiYoutube, SiGlobus } from 'react-icons/si'
import { api } from '@services/api'
import { getDefaultSocialItems } from '@constants/socialLinks'

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
  const [internalItems, setInternalItems] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await api.get('/socials')
      setInternalItems(Array.isArray(res.data) ? res.data : [])
    } catch {
      setInternalItems([])
    } finally {
      setLoading(false)
    }
  }

  const items = externalItems || (externalItems === undefined ? internalItems : [])

  useEffect(() => {
    if (externalItems === undefined) {
      fetchItems()
    }
  }, [externalItems])

  const dbItems = items.filter((item) => item.link && item.link.trim() !== '')
  const defaultItems = dbItems.length === 0 && !loading ? getDefaultSocialItems().map((d) => ({ ...d, isDefault: true })) : []
  const displayItems = dbItems.length > 0 ? dbItems : defaultItems

  const getIconForPlatform = (platform) => {
    if (!platform) return SiGlobus
    const key = platform.toLowerCase()
    return platformIconMap[key] || SiGlobus
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {displayItems.map((item) => {
        const Icon = getIconForPlatform(item.platform)
        const platformKey = (item.platform || '').toLowerCase()
        const label = item.name || platformKey || 'Social'
        return (
          <a
            key={item.id || item.link}
            href={item.link}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={item.ariaLabel || `Follow us on ${label}`}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
              dark
                ? 'border-white/20 bg-white/5 text-white hover:bg-bronze hover:border-bronze hover:text-charcoal'
                : 'border-white/20 bg-white/5 text-white hover:bg-bronze hover:border-bronze hover:text-charcoal'
            } ${item.isDefault ? 'opacity-40 cursor-default' : ''}`}
          >
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={label} className="h-5 w-5 object-contain" loading="lazy" />
            ) : (
              <Icon size={16} />
            )}
          </a>
        )
      })}
    </div>
  )
}
