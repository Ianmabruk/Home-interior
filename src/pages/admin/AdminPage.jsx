import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
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
} from 'lucide-react'
import { useAuth } from '@context/AuthContext'
import { Sidebar } from '@components/admin/Sidebar'

const ADMIN_NAV = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
  { id: 'about', label: 'About', icon: Users, to: '/admin/about' },
  { id: 'hero-images', label: 'Hero Images', icon: Image, to: '/admin/hero-images' },
  { id: 'portfolio', label: 'Portfolio', icon: Image, to: '/admin/portfolio' },
  { id: 'virtual-design', label: 'Virtual Designs', icon: Video, to: '/admin/virtual-designs' },
  { id: 'services', label: 'Services', icon: Sparkles, to: '/admin/services' },
  { id: 'socials', label: 'Socials', icon: Globe, to: '/admin/socials' },
  { id: 'shop', label: 'Shop', icon: ShoppingBag, to: '/admin/shop' },
  { id: 'blog', label: 'Blog', icon: Book, to: '/admin/blog' },
  { id: 'orders', label: 'Orders', icon: Package, to: '/admin/orders' },
  { id: 'consultations', label: 'Consultations', icon: MessageSquare, to: '/admin/consultations' },
  { id: 'settings', label: 'Settings', icon: Settings, to: '/admin/settings' },
]

export const AdminPage = () => {
  const { user, isAdmin, logout } = useAuth()
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

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-display text-3xl font-semibold text-[var(--primary)] mb-3">Access Denied</h1>
          <p className="text-[var(--primary)]/60 mb-6">You do not have permission to access the admin dashboard.</p>
          <Link to="/" className="btn-luxury-primary inline-flex items-center gap-2">
            Go Home
          </Link>
        </div>
      </main>
    )
  }

  const currentRoute = ADMIN_NAV.find((nav) => location.pathname.startsWith(nav.to)) || ADMIN_NAV[0]

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
        <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#E6D8C9]/30 lg:ml-64">
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
              <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-[var(--secondary)]/30 text-[var(--primary)]/60 text-sm">
                <span>{user?.fullName || 'Admin'}</span>
              </div>
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

        <main className="flex-1 pt-16 lg:pt-20 lg:ml-0 px-4 md:px-8 py-8">
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
