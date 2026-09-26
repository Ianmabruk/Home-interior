import {
  SiFacebook,
  SiInstagram,
  SiPinterest,
  SiTiktok,
  SiYoutube,
  SiWhatsapp,
  SiX,
  SiGlobus,
} from 'react-icons/si'

export const INSTAGRAM_GRADIENT =
  'linear-gradient(135deg, #833AB4 0%, #C13584 35%, #E1306C 55%, #FD1D1D 75%, #FCAF45 100%)'

export const SOCIAL_BRANDS = {
  facebook: {
    label: 'Facebook',
    color: '#1877F2',
    iconColor: '#FFFFFF',
    badgeBackground: '#1877F2',
    badgeShape: 'circle',
    buttonColor: '#1877F2',
    buttonHover: '#166FE5',
  },
  instagram: {
    label: 'Instagram',
    color: '#E1306C',
    iconColor: '#FFFFFF',
    badgeBackground: INSTAGRAM_GRADIENT,
    badgeShape: 'circle',
    buttonBackground: INSTAGRAM_GRADIENT,
    buttonText: '#FFFFFF',
  },
  pinterest: {
    label: 'Pinterest',
    color: '#E60023',
    iconColor: '#FFFFFF',
    badgeBackground: '#E60023',
    badgeShape: 'circle',
    buttonColor: '#E60023',
    buttonHover: '#BD001B',
  },
  tiktok: {
    label: 'TikTok',
    color: '#000000',
    iconColor: '#FFFFFF',
    cyan: '#25F4EE',
    red: '#FE2C55',
    chromatic: true,
    badgeBackground: '#000000',
    badgeShape: 'rounded',
    buttonColor: '#000000',
    buttonHover: '#181818',
  },
  youtube: {
    label: 'YouTube',
    color: '#FF0000',
    iconColor: '#FFFFFF',
    badgeBackground: '#FF0000',
    badgeShape: 'rounded',
    buttonColor: '#FF0000',
    buttonHover: '#CC0000',
  },
  whatsapp: {
    label: 'WhatsApp',
    color: '#25D366',
    iconColor: '#FFFFFF',
    badgeBackground: '#25D366',
    badgeShape: 'circle',
    buttonColor: '#25D366',
    buttonHover: '#1EB955',
  },
  x: {
    label: 'X (Twitter)',
    color: '#000000',
    iconColor: '#FFFFFF',
    badgeBackground: '#000000',
    badgeShape: 'circle',
    buttonColor: '#000000',
    buttonHover: '#181818',
  },
  linkedin: {
    // simple-icons no longer ships a LinkedIn mark, so no official glyph is
    // available here. The platform stays selectable and keeps its brand colour
    // rather than falling back to a hand-drawn approximation.
    label: 'LinkedIn',
    color: '#0A66C2',
    iconColor: '#FFFFFF',
    badgeBackground: '#0A66C2',
    badgeShape: 'rounded',
    buttonColor: '#0A66C2',
    buttonHover: '#0959A8',
  },
  threads: {
    label: 'Threads',
    color: '#000000',
    iconColor: '#FFFFFF',
    badgeBackground: '#000000',
    badgeShape: 'circle',
    buttonColor: '#000000',
    buttonHover: '#181818',
  },
  custom: {
    label: 'Custom',
    color: '#666666',
    iconColor: '#FFFFFF',
    badgeBackground: '#666666',
    badgeShape: 'circle',
    buttonColor: '#666666',
    buttonHover: '#555555',
  },
}

const SOCIAL_BRAND_ICONS = {
  facebook: SiFacebook,
  instagram: SiInstagram,
  pinterest: SiPinterest,
  tiktok: SiTiktok,
  youtube: SiYoutube,
  whatsapp: SiWhatsapp,
  x: SiX,
  custom: SiGlobus,
}

const FALLBACK_BRAND = SOCIAL_BRANDS.custom

export const normalizePlatformKey = (platform) =>
  String(platform || '').trim().toLowerCase()

export const getSocialBrand = (platform) => {
  const key = normalizePlatformKey(platform)
  return {
    key: SOCIAL_BRANDS[key] ? key : 'custom',
    ...(SOCIAL_BRANDS[key] || FALLBACK_BRAND),
    Icon: SOCIAL_BRAND_ICONS[key] || SiGlobus,
  }
}

export const getSocialBrandColor = (platform) => getSocialBrand(platform).color

export const getSocialBrandButtonStyle = (platform) => {
  const brand = getSocialBrand(platform)
  return {
    background: brand.buttonBackground || brand.buttonColor || brand.color,
    color: brand.buttonText || '#FFFFFF',
  }
}

export const getSocialBrandCssVars = (platform) => {
  const brand = getSocialBrand(platform)
  return {
    '--social-brand': brand.color,
    '--social-icon': brand.iconColor,
    '--social-badge-bg': brand.badgeBackground,
    '--social-cyan': brand.cyan || '#25F4EE',
    '--social-red': brand.red || '#FE2C55',
    '--social-button-bg': brand.buttonBackground || brand.buttonColor || brand.color,
    '--social-button-hover': brand.buttonHover || brand.color,
  }
}

export const getSocialPlatforms = () =>
  Object.entries(SOCIAL_BRANDS).map(([key, brand]) => ({ key, label: brand.label }))
