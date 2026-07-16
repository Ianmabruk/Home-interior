import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, User, LogIn, UserPlus, Home, ShoppingBag, Sparkles, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_ITEMS = [
  { to: '/shop', label: 'Shop', icon: ShoppingBag },
  { to: '/virtual-interior-design', label: 'Virtual Interior Design', icon: Sparkles },
  { to: '/about', label: 'About', icon: Info },
]

const USER_DROPDOWN_ITEMS = [
  { to: '/login', label: 'Login', icon: LogIn },
  { to: '/register', label: 'Register', icon: UserPlus },
  { to: '/account', label: 'My Account', icon: Home },
]

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [location])

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden" role="navigation" aria-label="Mobile navigation">
        <div className="bg-cream/95 backdrop-blur-xl border-t border-linen/40 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
          <div className="grid grid-cols-4 h-16">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                  location.pathname === item.to
                    ? 'text-forest'
                    : 'text-espresso/70 hover:text-bronze'
                }`}
                aria-current={location.pathname === item.to ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => setMobileOpen((p) => !p)}
              className="relative flex flex-col items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-espresso/70 hover:text-bronze transition-colors"
              aria-expanded="false"
              aria-label="Account menu"
              aria-controls="mobile-account-menu"
            >
              <User size={16} strokeWidth={1.5} />
              <span className="hidden">Account</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Desktop Header */}
      <header
        className={`fixed left-0 right-0 top-0 z-50 hidden md:flex transition-all duration-500 ${
          scrolled
            ? 'bg-cream/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)]'
            : 'bg-cream/80 backdrop-blur-xl'
        }`}
      >
        <div className="container-wide flex items-center justify-between px-6 md:px-12 lg:px-20">
          <Link to="/" className="flex-shrink-0 leading-tight group" aria-label="HOK Interior Designs - Home">
            <p className="font-['Playfair_Display'] text-2xl md:text-3xl font-semibold tracking-wide text-espresso transition-colors duration-300 group-hover:text-forest">
              HOK
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-bronze transition-colors duration-300 group-hover:text-bronzeDark">
              Interior Designs
            </p>
          </Link>

          <nav className="hidden items-center gap-2 md:flex lg:gap-4" role="navigation" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`relative px-4 py-2.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.12em] transition-all duration-300 ${
                  location.pathname === item.to
                    ? 'bg-forest text-cream shadow-[0_4px_20px_rgba(31,77,58,0.2)]'
                    : 'text-espresso/80 hover:bg-linen/60 hover:text-forest'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="w-px h-8 bg-linen/40 mx-2 hidden lg:block" aria-hidden="true" />
            <div className="relative" role="menu" aria-label="User menu">
              <button
                onClick={() => setUserMenuOpen((p) => !p)}
                className="flex items-center gap-2 rounded-full px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-espresso/80 transition-all duration-300 hover:bg-linen/60 hover:text-forest"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                aria-label="User menu"
              >
                <User size={14} strokeWidth={1.5} />
                <span className="hidden sm:inline">Account</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-52 bg-cream rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-linen overflow-hidden z-50"
                    role="menu"
                  >
                    {USER_DROPDOWN_ITEMS.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-espresso hover:bg-linen/60 transition-colors"
                          role="menuitem"
                        >
                          <Icon size={16} strokeWidth={1.5} className="text-bronze" />
                          {item.label}
                        </Link>
                      )
                    })}
                  </motion.div>
                </>
              )}
            </div>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/virtual-interior-design"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-cream transition-all duration-300 hover:bg-forestDark hover:shadow-[0_8px_30px_rgba(31,77,58,0.15)] hover:-translate-y-0.5"
              style={{ height: '48px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              Book Consultation
            </Link>
          </div>
        </div>
      </header>
    </>
  )
}