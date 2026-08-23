import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ChevronRight, ChevronLeft, LogOut } from 'lucide-react'

export const Sidebar = ({ items = [], currentRoute, onNavigate, open, collapsed, onToggleCollapse, onLogout }) => {
  const location = useLocation()
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (collapsed) {
    return (
      <motion.aside
        initial={{ width: 0 }}
        animate={{ width: 72 }}
        className="fixed left-0 top-0 bottom-0 z-50 bg-white border-r border-[#E6D8C9]/30 flex flex-col overflow-hidden transition-all duration-300"
        style={{ width: 72 }}
      >
        <div className="flex h-16 items-center justify-center border-b border-[#E6D8C9]/30">
          <Link to="/admin" className="p-2 rounded-lg text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)]">
            <LayoutDashboard size={24} strokeWidth={1.5} />
          </Link>
        </div>
        <button
          onClick={onToggleCollapse}
          className="mx-3 mt-4 p-2 rounded-lg text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)]"
          aria-label="Expand sidebar"
        >
          <ChevronRight size={20} strokeWidth={1.5} />
        </button>
      </motion.aside>
    )
  }

  const shouldAnimate = !isDesktop

  return (
    <>
      {open && isDesktop === false && (
        <div
          className="fixed inset-0 z-40 bg-[var(--primary)]/50 lg:hidden"
          onClick={onNavigate}
        />
      )}
      <motion.aside
        initial={shouldAnimate ? { x: -300 } : false}
        animate={shouldAnimate ? { x: open ? 0 : -300 } : { x: 0 }}
        transition={shouldAnimate ? { type: 'spring', stiffness: 300, damping: 30 } : undefined}
        className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-white border-r border-[#E6D8C9]/30 flex flex-col lg:static lg:z-auto lg:w-64"
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-[#E6D8C9]/30 lg:justify-center">
          <Link to="/admin" className="flex items-center gap-2 text-[var(--primary)] hover:text-[var(--accent)] transition-colors">
            <LayoutDashboard size={24} strokeWidth={1.5} />
            <span className="font-display text-lg font-medium hidden lg:block">Admin</span>
          </Link>
          <button
            onClick={onToggleCollapse}
            className="lg:hidden p-2 rounded-lg text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)]"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Admin navigation">
          {items.map((item) => {
            const isActive = location.pathname.startsWith(item.to) || currentRoute === item.id
            const Icon = item.icon
            return (
              <Link
                key={item.id}
                to={item.to}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)] shadow-[0_4px_16px_rgba(232,154,67,0.15)]'
                    : 'text-[var(--primary)]/70 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[#E6D8C9]/30 space-y-2">
          <a
            href={import.meta.env.VITE_CLIENT_URL || window.location.origin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)] transition-all duration-200"
          >
            <LayoutDashboard size={20} strokeWidth={1.5} />
            <span className="font-medium">View Site</span>
          </a>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)] transition-all duration-200"
            >
              <LogOut size={20} strokeWidth={1.5} />
              <span className="font-medium">Logout</span>
            </button>
          )}
        </div>
      </motion.aside>
    </>
  )
}

export default Sidebar
