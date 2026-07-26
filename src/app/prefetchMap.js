const prefetchMap = {
  '/portfolio': () => import('../pages/public/PortfolioPage'),
  '/virtual-design': () => import('../pages/public/VirtualDesignPage'),
  '/services': () => import('../pages/public/ServicesPage'),
  '/about': () => import('../pages/public/AboutPage'),
  '/shop': () => import('../pages/public/ShopPage'),
  '/contact': () => import('../pages/public/ContactPage'),
}

export { prefetchMap }
export function getPrefetchMap() {
  return prefetchMap
}

export default prefetchMap
