import { lazy, Suspense, memo, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from '@components/layout/Layout'
import { ProtectedRoute } from './ProtectedRoute'
import { ErrorBoundary } from '@components/common/ErrorBoundary'
import { usePrefetchOnIdle } from '@hooks/useRoutePrefetch'

const RouteFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
  </div>
)

const ErrorFallback = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
    <p className="font-display text-2xl text-[var(--primary)]">Failed to load page</p>
    <button onClick={() => window.location.reload()} className="mt-4 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-medium uppercase tracking-widest text-white transition hover:bg-[var(--accent)]/90">
      Reload Page
    </button>
  </div>
)

const ScrollToTop = () => {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Lazy-loaded page components with caching
const routeCache = new Map()

const lazyWithCache = (importFn, cacheKey) => {
  return lazy(async () => {
    if (routeCache.has(cacheKey)) {
      return routeCache.get(cacheKey)
    }
    const module = await importFn()
    routeCache.set(cacheKey, module)
    return module
  })
}

// Public pages
const HomePage = lazyWithCache(() => import('@pages/public/HomePage'), 'home')
const PortfolioPage = lazyWithCache(() => import('@pages/public/PortfolioPage'), 'portfolio')
const PortfolioDetailPage = lazyWithCache(() => import('@pages/public/PortfolioDetailPage').then(m => ({ default: m.PortfolioDetailPage })), 'portfolio-detail')
const ShopPage = lazyWithCache(() => import('@pages/public/ShopPage'), 'shop')
const ProductDetailPage = lazyWithCache(() => import('@pages/public/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })), 'product-detail')
const ServicesPage = lazyWithCache(() => import('@pages/public/ServicesPage'), 'services')
const VirtualDesignPage = lazyWithCache(() => import('@pages/public/VirtualDesignPage'), 'virtual-design')
const VirtualDesignDetailPage = lazyWithCache(() => import('@pages/public/VirtualDesignDetailPage').then(m => ({ default: m.VirtualDesignDetailPage })), 'virtual-design-detail')
const AboutPage = lazyWithCache(() => import('@pages/public/AboutPage'), 'about')
const ContactPage = lazyWithCache(() => import('@pages/public/ContactPage'), 'contact')
const SocialsPage = lazyWithCache(() => import('@pages/public/SocialsPage'), 'socials')
const ChatPage = lazyWithCache(() => import('@pages/public/ChatPage').then(m => ({ default: m.ChatPage })), 'chat')
const NotFoundPage = lazyWithCache(() => import('@pages/public/NotFoundPage').then(m => ({ default: m.NotFoundPage })), 'not-found')

// Auth pages
const AuthShell = lazyWithCache(() => import('@pages/auth/AuthShell').then(m => ({ default: m.AuthShell })), 'auth-shell')
const LoginPage = lazyWithCache(() => import('@pages/auth/LoginPage').then(m => ({ default: m.LoginPage })), 'login')
const RegisterPage = lazyWithCache(() => import('@pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })), 'register')
const ForgotPasswordPage = lazyWithCache(() => import('@pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })), 'forgot-password')
const ResetPasswordPage = lazyWithCache(() => import('@pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })), 'reset-password')

// Account pages
const AccountPage = lazyWithCache(() => import('@pages/account/AccountPage').then(m => ({ default: m.AccountPage })), 'account')
const CartPage = lazyWithCache(() => import('@pages/account/CartPage').then(m => ({ default: m.CartPage })), 'cart')
const WishlistPage = lazyWithCache(() => import('@pages/account/WishlistPage').then(m => ({ default: m.WishlistPage })), 'wishlist')
  const CheckoutPage = lazyWithCache(() => import('@pages/account/CheckoutPage').then(m => ({ default: m.CheckoutPage })), 'checkout')
  const OrdersPage = lazyWithCache(() => import('@pages/account/OrdersPage').then(m => ({ default: m.OrdersPage })), 'orders')

// Admin pages
const AdminPage = lazyWithCache(() => import('@pages/admin/AdminPage').then(m => ({ default: m.AdminPage })), 'admin')
const DashboardOverview = lazyWithCache(() => import('@components/admin/DashboardOverview').then(m => ({ default: m.DashboardOverview })), 'dashboard-overview')
const PortfolioDashboard = lazyWithCache(() => import('@components/admin/PortfolioDashboard').then(m => ({ default: m.default })), 'portfolio-dashboard')
const VirtualDesignDashboard = lazyWithCache(() => import('@components/admin/VirtualDesignDashboard').then(m => ({ default: m.default })), 'virtual-design-dashboard')
const ServicesDashboard = lazyWithCache(() => import('@components/admin/ServicesDashboard').then(m => ({ default: m.default })), 'services-dashboard')
const ShopDashboard = lazyWithCache(() => import('@components/admin/ShopDashboard').then(m => ({ default: m.default })), 'shop-dashboard')
const HeroImagesDashboard = lazyWithCache(() => import('@components/admin/HeroImagesDashboard').then(m => ({ default: m.default })), 'hero-images-dashboard')
const ConsultationDashboard = lazyWithCache(() => import('@components/admin/ConsultationDashboard').then(m => ({ default: m.default })), 'consultation-dashboard')
const OrderDashboard = lazyWithCache(() => import('@components/admin/OrderDashboard').then(m => ({ default: m.default })), 'order-dashboard')
const SettingsDashboard = lazyWithCache(() => import('@components/admin/SettingsDashboard').then(m => ({ default: m.default })), 'settings-dashboard')

const ErrorBoundaryRoute = memo(({ element }) => (
  <ErrorBoundary fallback={<ErrorFallback />}>
    {element}
  </ErrorBoundary>
))

const PrefetchOnIdle = () => {
  const { prefetch } = usePrefetchOnIdle()

  useEffect(() => {
    const prefetchRoutes = [
      () => import('@pages/public/ShopPage'),
      () => import('@pages/public/PortfolioPage'),
      () => import('@pages/public/ServicesPage'),
      () => import('@pages/public/VirtualDesignPage'),
      () => import('@pages/public/AboutPage'),
    ]

    const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 1000))
    const id = idleCallback(() => {
      prefetchRoutes.forEach((p) => prefetch(p))
    })

    return () => {
      if (window.cancelIdleCallback) {
        window.cancelIdleCallback(id)
      } else {
        clearTimeout(id)
      }
    }
  }, [prefetch])

  return null
}

export const AppRouter = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ErrorBoundaryRoute element={<HomePage />} />} />
          <Route path="/shop" element={<ErrorBoundaryRoute element={<ShopPage />} />} />
          <Route path="/shop/mirror" element={<ErrorBoundaryRoute element={<ShopPage category="mirror" />} />} />
          <Route path="/shop/artwork" element={<ErrorBoundaryRoute element={<ShopPage category="artwork" />} />} />
          <Route path="/shop/throw-pillows" element={<ErrorBoundaryRoute element={<ShopPage category="throw-pillows" />} />} />
          <Route path="/shop/:id" element={<ErrorBoundaryRoute element={<ProductDetailPage />} />} />
          <Route path="/portfolio" element={<ErrorBoundaryRoute element={<PortfolioPage />} />} />
          <Route path="/portfolio/:id" element={<ErrorBoundaryRoute element={<PortfolioDetailPage />} />} />
          <Route path="/about" element={<ErrorBoundaryRoute element={<AboutPage />} />} />
          <Route path="/services" element={<ErrorBoundaryRoute element={<ServicesPage />} />} />
          <Route path="/virtual-design" element={<ErrorBoundaryRoute element={<VirtualDesignPage />} />} />
          <Route path="/virtual-design/:id" element={<ErrorBoundaryRoute element={<VirtualDesignDetailPage />} />} />
          <Route path="/socials" element={<ErrorBoundaryRoute element={<SocialsPage />} />} />
          <Route path="/contact" element={<ErrorBoundaryRoute element={<ContactPage />} />} />
          <Route path="/chat" element={<ErrorBoundaryRoute element={<ChatPage />} />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/account" element={<ErrorBoundaryRoute element={<AccountPage />} />}>
              <Route path="orders" element={<ErrorBoundaryRoute element={<OrdersPage />} />} />
              <Route path="wishlist" element={<ErrorBoundaryRoute element={<AccountPage />} />} />
            </Route>
            <Route path="/wishlist" element={<ErrorBoundaryRoute element={<WishlistPage />} />} />
            <Route path="/cart" element={<ErrorBoundaryRoute element={<CartPage />} />} />
            <Route path="/checkout" element={<ErrorBoundaryRoute element={<CheckoutPage />} />} />
            <Route path="/orders" element={<ErrorBoundaryRoute element={<OrdersPage />} />} />
          </Route>

          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin" element={<ErrorBoundaryRoute element={<AdminPage />} />}>
              <Route index element={<ErrorBoundaryRoute element={<DashboardOverview />} />} />
              <Route path="hero-images" element={<ErrorBoundaryRoute element={<HeroImagesDashboard />} />} />
              <Route path="portfolio" element={<ErrorBoundaryRoute element={<PortfolioDashboard />} />} />
              <Route path="virtual-designs" element={<ErrorBoundaryRoute element={<VirtualDesignDashboard />} />} />
              <Route path="services" element={<ErrorBoundaryRoute element={<ServicesDashboard />} />} />
              <Route path="shop" element={<ErrorBoundaryRoute element={<ShopDashboard />} />} />
              <Route path="orders" element={<ErrorBoundaryRoute element={<OrderDashboard />} />} />
              <Route path="consultations" element={<ErrorBoundaryRoute element={<ConsultationDashboard />} />} />
              <Route path="settings" element={<ErrorBoundaryRoute element={<SettingsDashboard />} />} />
            </Route>
          </Route>
        </Route>

        <Route element={<AuthShell />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ScrollToTop />
      <PrefetchOnIdle />
    </Suspense>
  )
}