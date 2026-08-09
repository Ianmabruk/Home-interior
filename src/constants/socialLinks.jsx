import { SiTiktok, SiInstagram, SiFacebook, SiPinterest } from 'react-icons/si'

export const SOCIAL_LINKS = [
  {
    name: 'TikTok',
    platform: 'tiktok',
    link: 'https://www.tiktok.com/@esther.k.musa?_r=1&_t=ZS-98PsIlPUwey',
    icon: 'TikTok',
    ariaLabel: 'Follow us on TikTok',
  },
  {
    name: 'Instagram',
    platform: 'instagram',
    link: 'https://www.instagram.com/hokinteriors?igsh=OG1tZ2xuOG9mMWRl&utm_source=qr',
    icon: 'Instagram',
    ariaLabel: 'Follow us on Instagram',
  },
  {
    name: 'Facebook',
    platform: 'facebook',
    link: 'https://www.facebook.com/profile.php?id=61589240250994',
    icon: 'Facebook',
    ariaLabel: 'Follow us on Facebook',
  },
  {
    name: 'Pinterest',
    platform: 'pinterest',
    link: 'https://pin.it/47AUIIl9v',
    icon: 'Pinterest',
    ariaLabel: 'Follow us on Pinterest',
  },
]

export const getDefaultSocialItems = () => {
  return SOCIAL_LINKS.filter((link) => link.link && link.link.trim() !== '')
}

export const getSocialLinks = () => {
  return SOCIAL_LINKS.filter((link) => link.link && link.link.trim() !== '')
}

export const getSocialLink = (icon) => {
  return SOCIAL_LINKS.find((link) => link.icon === icon)
}

export const SOCIAL_ICONS = {
  TikTok: <SiTiktok size={22} aria-hidden="true" />,
  Instagram: <SiInstagram size={22} aria-hidden="true" />,
  Facebook: <SiFacebook size={22} aria-hidden="true" />,
  Pinterest: <SiPinterest size={22} aria-hidden="true" />,
}

export const FOOTER_SOCIAL_LINKS = SOCIAL_LINKS
