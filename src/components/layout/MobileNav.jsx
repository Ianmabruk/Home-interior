import { Home, ShoppingBag, Briefcase, Info } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Home', icon: Home, exact: true },
  { to: '/shop', label: 'Shop', icon: ShoppingBag },
  { to: '/virtual-interior-design', label: 'Virtual', icon: Briefcase },
  { to: '/about', label: 'About', icon: Info },
]

export const MobileNav = () => {
  const location = useLocation()

  const isActive = (to, exact) => {
    if (exact && location.pathname === to) return true
    if (!exact && to !== '/' && location.pathname.startsWith(to)) return true
    return false
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border md:hidden safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.to, item.exact)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 min-w-[64px] ${
                active
                  ? 'text-accent'
                  : 'text-textSecondary hover:text-textPrimaryDark'
              }`}
              aria-label={item.label}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.5}
              />
              <span className={`text-2xs font-medium ${active ? 'text-accent' : 'text-textSecondary'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
