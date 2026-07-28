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
  TikTok: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 12a4 4 0 1 0 4 4V2h3.5a5.5 5.5 0 0 0 5.5 5.5v3.5a9 9 0 0 1-5.5-2v6a4 4 0 1 1-7.5-1.5V12z" />
    </svg>
  ),
  Instagram: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="18" x="3" y="3" rx="3" />
      <circle cx="9" cy="9" r="2" />
      <path d="M21 15l-3.5-3.5a2 2 0 0 0-2.8 0L7 21" />
    </svg>
  ),
  Facebook: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  ),
  Pinterest: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6c-3 0-5 2-5 5 0 2.5 1.5 4.5 3.5 4.5 1 0 1.5-.5 2-1.2" />
      <path d="M15 18.5c-1.5 1-3.5 1.5-5 1" />
      <path d="M10.5 13c.5-1 1-2.5 1-3.5" />
    </svg>
  ),
}

export const FOOTER_SOCIAL_LINKS = SOCIAL_LINKS
