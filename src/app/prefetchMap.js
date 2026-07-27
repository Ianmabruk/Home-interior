// Route prefetch mapping for hover-based prefetching
export const prefetchMap = {
  '/': () => import('../pages/public/HomePage'),
  '/shop': () => import('../pages/public/ShopPage'),
  '/portfolio': () => import('../pages/public/PortfolioPage'),
  '/services': () => import('../pages/public/ServicesPage'),
  '/virtual-design': () => import('../pages/public/VirtualDesignPage'),
  '/about': () => import('../pages/public/AboutPage'),
  '/contact': () => import('../pages/public/ContactPage'),
  '/socials': () => import('../pages/public/SocialsPage'),
  '/login': () => import('../pages/auth/LoginPage').then(m => ({ default: m.LoginPage })),
  '/register': () => import('../pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })),
  '/account': () => import('../pages/account/AccountPage').then(m => ({ default: m.AccountPage })),
  '/cart': () => import('../pages/account/CartPage').then(m => ({ default: m.CartPage })),
  '/wishlist': () => import('../pages/account/WishlistPage').then(m => ({ default: m.WishlistPage })),
  '/checkout': () => import('../pages/account/CheckoutPage').then(m => ({ default: m.CheckoutPage })),
}