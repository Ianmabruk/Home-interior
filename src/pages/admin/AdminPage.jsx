import { useState, useEffect } from 'react'
import { useLocation, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Image,
  ShoppingBag,
  Sparkles,
  Video,
  Package,
  MessageSquare,
  Settings,
  LogOut,
  ChevronDown,
  X,
  Book,
  Users,
  Globe,
  FileText,
  Heart,
  CircleDot,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@context/AuthContext'
import { usePushNotifications } from '@hooks/usePushNotifications'
import { Sidebar } from '@components/admin/Sidebar'
import { AdminLoginPage } from './AdminLoginPage'

const ADMIN_NAV = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
  { id: 'about', label: 'About', icon: Users, to: '/admin/about' },
  { id: 'hero-images', label: 'Hero Images', icon: Image, to: '/admin/hero-images' },
  { id: 'portfolio', label: 'Portfolio', icon: Image, to: '/admin/portfolio' },
  { id: 'virtual-design', label: 'E-Design Packages', icon: Video, to: '/admin/virtual-designs' },
  { id: 'services', label: 'Services', icon: Sparkles, to: '/admin/services' },
  { id: 'socials', label: 'Socials', icon: Globe, to: '/admin/socials' },
  { id: 'shop', label: 'Shop', icon: ShoppingBag, to: '/admin/shop' },
  { id: 'blog', label: 'Blog', icon: Book, to: '/admin/blog' },
  { id: 'orders', label: 'Orders', icon: Package, to: '/admin/orders' },
  { id: 'consultations', label: 'Consultations', icon: MessageSquare, to: '/admin/consultations' },
  { id: 'work-with-us', label: 'Work With Us', icon: FileText, to: '/admin/work-with-us' },
  { id: 'testimonials', label: 'Testimonials', icon: Heart, to: '/admin/testimonials' },
  { id: 'circular-tabs', label: 'Circular Tabs', icon: CircleDot, to: '/admin/circular-tabs' },
  { id: 'settings', label: 'Settings', icon: Settings, to: '/admin/settings' },
]

export const AdminPage = () => {
  const { user, isAdmin, loading, logout } = useAuth()
  const push = usePushNotifications()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 1000))
    const id = idleCallback(() => {
      const prefetches = [
        () => import('@components/admin/ShopDashboard').then((m) => ({ default: m.default })),
        () => import('@components/admin/OrderDashboard').then((m) => ({ default: m.default })),
        () => import('@components/admin/BlogDashboard').then((m) => ({ default: m.default })),
        () => import('@components/admin/DashboardOverview').then((m) => ({ default: m.default })),
      ]
      prefetches.forEach((fn) => fn().catch(() => {}))
    })
    return () => {
      if (window.cancelIdleCallback) {
        window.cancelIdleCallback(id)
      } else {
        clearTimeout(id)
      }
    }
  }, [])

  if (loading) {
    console.log('[admin] loading state, token present:', !!localStorage.getItem('hok_access_token'))
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
      </div>
    )
  }

  if (!isAdmin) {
    console.log('[admin] not admin, user:', user ? { id: user.id, email: user.email, role: user.role } : null)
    return <AdminLoginPage />
  }

  const currentRoute = [...ADMIN_NAV]
    .sort((a, b) => b.to.length - a.to.length)
    .find((nav) => location.pathname.startsWith(nav.to)) || ADMIN_NAV[0]

  return (
    <div className="min-h-screen bg-[var(--bg)] flex">
      <Sidebar
        items={ADMIN_NAV}
        currentRoute={currentRoute.id}
        onNavigate={() => setSidebarOpen(false)}
        open={sidebarOpen}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        onLogout={logout}
      />
      <div className="flex-1 flex flex-col lg:ml-0">
        <header className="fixed top-0 left-0 right-0 z-40 bg-[var(--card)]/80 backdrop-blur-xl border-b border-[var(--border)]/50 lg:ml-64 shadow-[0_8px_32px_rgba(42,36,31,0.04)]">
          <div className="flex items-center justify-between h-16 px-4 md:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)]"
                aria-label="Toggle menu"
              >
                {sidebarOpen ? <X size={24} strokeWidth={1.5} /> : <ChevronDown size={24} strokeWidth={1.5} />}
              </button>
              <h1 className="font-display text-xl font-medium text-[var(--primary)] hidden lg:block">
                {currentRoute.label}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {!push.supported ? null : push.permission === 'denied' ? (
                  <span
                    title={push.reason}
                    className="text-xs text-[var(--error)] whitespace-nowrap cursor-help underline decoration-dotted"
                  >
                    Notifications blocked
                  </span>
                ) : push.subscribed ? (
                  <span className="text-xs text-[var(--success)] whitespace-nowrap" title="Push notifications enabled">
                    Notifications enabled
                  </span>
                ) : null}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => push.subscribe()}
                  disabled={push.loading || !push.supported}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed ${
                    push.subscribed
                      ? 'bg-[var(--success)] text-white hover:bg-[var(--success)]/90'
                      : 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90'
                  }`}
                  aria-label={push.subscribed ? 'Notifications enabled' : 'Enable notifications'}
                >
                  {push.loading ? (
                    <>
                      <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="19" y2="12" y1="12" x2="5" />
                      </svg>
                      Enabling...
                    </>
                  ) : push.subscribed ? (
                    'Enabled'
                  ) : (
                    'Enable Notifications'
                  )}
                </motion.button>
              </div>
              <span className="hidden md:block text-sm text-[var(--primary)]">
                {user?.fullName || 'Admin'}
              </span>
              <button
                onClick={logout}
                className="p-2 rounded-lg text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)]"
                aria-label="Logout"
              >
                <LogOut size={20} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 pt-16 lg:pt-20 lg:ml-0 px-4 md:px-8 py-8 overflow-y-auto min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-50 bg-[var(--primary)]/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  )
}

export default AdminPage
