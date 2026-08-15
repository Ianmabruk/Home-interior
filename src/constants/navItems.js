export const NAV_ITEMS = [
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/virtual-design', label: 'Virtual Designs' },
  { to: '/services', label: 'Services' },
  { to: '/about', label: 'About Us' },
  { to: '/socials', label: 'Socials' },
  { to: '/track-order', label: 'Track Order' },
]

export const FULLSCREEN_MENU_ITEMS = [
  { to: '/', label: 'Home', icon: 'Home' },
  { to: '/portfolio', label: 'Portfolio', icon: 'LayoutGrid' },
  { to: '/services', label: 'Services', icon: 'Sparkles' },
  { to: '/about', label: 'About Us', icon: 'User' },
  { to: '/socials', label: 'Socials', icon: 'Mail' },
  { to: '/track-order', label: 'Track Order', icon: 'Search' },
]

export const FOOTER_NAV_GROUPS = [
  {
    label: 'Explore',
    links: [
      { to: '/portfolio', label: 'Portfolio' },
      { to: '/virtual-design', label: 'Virtual Designs' },
      { to: '/services', label: 'Services' },
      { to: '/shop', label: 'Shop' },
    ],
  },
  {
    label: 'Company',
    links: [
      { to: '/about', label: 'About Us' },
      { to: '/contact', label: 'Contact' },
      { to: '/socials', label: 'Socials' },
    ],
  },
  {
    label: 'Support',
    links: [
      { to: '/account', label: 'My Account' },
      { to: '/cart', label: 'Cart' },
      { to: '/wishlist', label: 'Wishlist' },
      { to: '/track-order', label: 'Track Order' },
    ],
  },
]

export const MOBILE_BREAKPOINTS = {
  SM: 320,
  MD: 375,
  LG: 390,
  XL: 414,
  TABLET_SM: 768,
  TABLET: 1024,
  DESKTOP: 1280,
  DESKTOP_LG: 1440,
  DESKTOP_XL: 1920,
}