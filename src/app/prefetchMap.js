// Route prefetch mapping for hover-based prefetching
export const prefetchMap = {
  '/': () => import('../pages/public/HomePage'),
  '/shop': () => import('../pages/public/ShopPage'),
  '/portfolio': () => import('../pages/public/PortfolioPage'),
  '/services': () => import('../pages/public/ServicesPage'),
  '/virtual-design': () => import('../pages/public/VirtualDesignPage'),
  '/about': () => import('../pages/public/AboutPage'),
  '/contact': () => import('../pages/public/ContactPage'),
  '/work-with-us': () => import('../pages/public/WorkWithUsPage'),
  '/testimonials': () => import('../pages/public/TestimonialsPage'),
  '/socials': () => import('../pages/public/SocialsPage'),
  '/login': () => import('../pages/auth/LoginPage').then(m => ({ default: m.LoginPage })),
  '/cart': () => import('../pages/account/CartPage').then(m => ({ default: m.CartPage })),
  '/checkout': () => import('../pages/account/CheckoutPage').then(m => ({ default: m.CheckoutPage })),
}