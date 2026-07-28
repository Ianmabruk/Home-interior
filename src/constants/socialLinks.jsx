import { SiTiktok, SiInstagram, SiFacebook, SiPinterest } from 'react-icons/si'

export const SOCIAL_LINKS = [
  { 
    icon: 'TikTok', 
    href: 'https://www.tiktok.com/@esther.k.musa?_r=1&_t=ZS-98PsIlPUwey', 
    label: 'TikTok', 
    ariaLabel: 'Follow us on TikTok' 
  },
  { 
    icon: 'Instagram', 
    href: 'https://www.instagram.com/hokinteriors?igsh=OG1tZ2xuOG9mMWRl&utm_source=qr', 
    label: 'Instagram', 
    ariaLabel: 'Follow us on Instagram' 
  },
  { 
    icon: 'Facebook', 
    href: '', 
    label: 'Facebook', 
    ariaLabel: 'Follow us on Facebook' 
  },
  { 
    icon: 'Pinterest', 
    href: '', 
    label: 'Pinterest', 
    ariaLabel: 'Follow us on Pinterest' 
  },
]

export const getSocialLinks = () => {
  return SOCIAL_LINKS.filter(link => link.href && link.href.trim() !== '')
}

export const getSocialLink = (icon) => {
  return SOCIAL_LINKS.find(link => link.icon === icon)
}

export const SOCIAL_ICONS = {
  TikTok: <SiTiktok size={22} aria-hidden="true" />,
  Instagram: <SiInstagram size={22} aria-hidden="true" />,
  Facebook: <SiFacebook size={22} aria-hidden="true" />,
  Pinterest: <SiPinterest size={22} aria-hidden="true" />,
}

export const FOOTER_SOCIAL_LINKS = SOCIAL_LINKS
