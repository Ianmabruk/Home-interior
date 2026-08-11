export const PUBLIC_ROUTES = {
  HOME: '/',
  PORTFOLIO: '/portfolio',
  PORTFOLIO_DETAIL: '/portfolio/:id',
  SHOP: '/shop',
  SHOP_CATEGORY: '/shop/:category',
  SHOP_DETAIL: '/shop/:id',
  SERVICES: '/services',
  VIRTUAL_DESIGN: '/virtual-design',
  VIRTUAL_DESIGN_DETAIL: '/virtual-design/project/:id',
  ABOUT: '/about',
  CONTACT: '/contact',
  SOCIALS: '/socials',
  CHAT: '/chat',
  BLOG: '/blog',
  BLOG_DETAIL: '/blog/:id',
  NOT_FOUND: '*',
}

export const AUTH_ROUTES = {
  LOGIN: '/login',
}

export const ACCOUNT_ROUTES = {
  ACCOUNT: '/account',
  WISHLIST: '/wishlist',
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDERS: '/account/orders',
  ORDER_CONFIRMATION: '/order-confirmation',
}

export const ADMIN_ROUTES = {
  ADMIN: '/admin',
  ADMIN_CHAT: '/admin/chat',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_BLOG: '/admin/blog',
}

export const ALL_ROUTES = {
  ...PUBLIC_ROUTES,
  ...AUTH_ROUTES,
  ...ACCOUNT_ROUTES,
  ...ADMIN_ROUTES,
}

export const ROUTE_GROUPS = {
  PUBLIC: Object.values(PUBLIC_ROUTES),
  AUTH: Object.values(AUTH_ROUTES),
  ACCOUNT: Object.values(ACCOUNT_ROUTES),
  ADMIN: Object.values(ADMIN_ROUTES),
}

export const PRELOAD_ROUTES = [
  PUBLIC_ROUTES.SHOP,
  PUBLIC_ROUTES.PORTFOLIO,
  PUBLIC_ROUTES.SERVICES,
  PUBLIC_ROUTES.VIRTUAL_DESIGN,
  PUBLIC_ROUTES.ABOUT,
  PUBLIC_ROUTES.CONTACT,
  PUBLIC_ROUTES.BLOG,
]