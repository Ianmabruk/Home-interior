import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ShoppingBag,
  User,
  LogIn,
  UserPlus,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Package,
  CreditCard,
  LayoutGrid,
  MonitorSmartphone,
  Share2,
  Mail,
  Sparkles,
  Home,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useShop } from '../context/ShopContext'
import hokLogoWebP from '../assets/hok-logo.webp'
import hokLogoPng from '../assets/hok png logo.png'

const NAV_ITEMS = [
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/services', label: 'Services' },
  { to: '/virtual-design', label: 'Virtual Designs' },
  { to: '/about', label: 'About' },
]

const FULLSCREEN_MENU_ITEMS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/portfolio', label: 'Portfolio', icon: LayoutGrid },
  { to: '/services', label: 'Services', icon: Sparkles },
  { to: '/virtual-design', label: 'Virtual Designs', icon: MonitorSmartphone },
  { to: '/shop', label: 'Shop', icon: ShoppingBag },
  { to: '/about', label: 'About', icon: User },
  { to: '/socials', label: 'Socials', icon: Share2 },
  { to: '/contact', label: 'Contact', icon: Mail },
]

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const { cart, removeFromCart, setCartQuantity } = useShop()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navRef = useRef(null)
  const userMenuRef = useRef(null)
  const cartRef = useRef(null)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        setCartOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const handleEsc = (e) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [mobileOpen])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleLogout = async () => {
    await logout()
    setUserMenuOpen(false)
  }

  const cartItems = cart || []
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const menuVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.1 },
    },
    exit: { opacity: 0, transition: { staggerChildren: 0.04, staggerDirection: -1 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <>
      <header
        ref={navRef}
        className={`relative w-full z-50 transition-all duration-300 sticky top-0 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl border-b border-[#E6D8C9]/40 shadow-[0_8px_32px_rgba(27,23,20,0.08)]'
            : 'bg-white/70 backdrop-blur-lg border-b border-[#E6D8C9]/30'
        }`}
        role="banner"
      >
      {/* DESKTOP HEADER - EXACTLY PRESERVED */}
      <div className="container-wide mx-auto px-4 md:px-8 lg:px-12">
        <div className="hidden md:flex items-center justify-between h-[88px] md:h-[96px] gap-4 md:gap-8 relative">
          <Link
            to="/"
            className="flex-shrink-0 leading-tight group -ml-4 md:-ml-8 flex items-center"
            aria-label="HOK Interiors - Home"
          >
            <picture>
              <source srcSet={hokLogoWebP} type="image/webp" />
              <img
                src={hokLogoPng}
                alt="HOK Interiors"
                className="h-[34px] sm:h-[38px] md:h-[48px] lg:h-[50px] w-auto object-contain transition-all duration-300 group-hover:scale-102"
                loading="eager"
                width={200}
                height={50}
              />
            </picture>
            <span
              className="ml-3 md:ml-4 text-[16px] md:text-[18px] font-semibold tracking-[0.06em] text-[#8B5E3C] whitespace-nowrap"
              style={{ fontFamily: "'Cormorant Garamond', 'Cormorant Garamond Fallback', serif" }}
            >
              HOK Interiors
            </span>
          </Link>

          <nav className="flex items-center justify-center flex-1" role="navigation" aria-label="Main navigation">
            <div
              className="flex items-center gap-2 md:gap-4 lg:gap-6 animate-fade-in"
              style={{ animationDelay: '0.05s' }}
            >
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.to
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onMouseEnter={() => {
                      const map = {
                        '/portfolio': () => import('../pages/public/PortfolioPage'),
                        '/services': () => import('../pages/public/ServicesPage'),
                        '/virtual-design': () => import('../pages/public/VirtualDesignPage'),
                        '/about': () => import('../pages/public/AboutPage'),
                      }
                      map[item.to]?.().catch(() => {})
                    }}
                    className={`relative flex items-center rounded-full px-4 py-2.5 md:px-5 md:py-3 text-[10px] md:text-[11px] font-medium uppercase tracking-[0.15em] transition-all duration-300 nav-link-underline ${isActive ? 'text-[#E89A43]' : 'text-[#2A241F]/70 hover:text-[#2A241F]'} focus:outline-none focus:ring-2 focus:ring-[#E89A43]/20`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="transition-transform hover:scale-[1.02] active:scale-[0.98]">
                      {item.label}
                    </span>
                  </Link>
                )
              })}

              <div className="w-px h-8 md:h-10 bg-[#E6D8C9]/40 mx-2 md:mx-4 hidden lg:block" aria-hidden="true" />

              <div className="flex items-center gap-3">
                <Link
                  to="/shop"
                  className="relative p-2 rounded-full text-[#2A241F]/70 transition-colors hover:bg-[#E6D8C9]/50 hover:text-[#2A241F]"
                  aria-label="Shop"
                >
                  <ShoppingBag size={20} md={22} strokeWidth={1.5} aria-hidden="true" />
                </Link>

                <div className="relative" ref={cartRef}>
                  <button
                    onClick={() => setCartOpen((p) => !p)}
                    className="relative p-2 rounded-full text-[#2A241F]/70 transition-all duration-300 hover:bg-[#E6D8C9]/50 hover:text-[#2A241F] active:scale-95"
                    aria-label={`Shopping cart${totalItems > 0 ? ` with ${totalItems} items` : ''}`}
                    aria-expanded={cartOpen}
                    aria-haspopup="true"
                  >
                    <Package size={20} md={22} strokeWidth={1.5} aria-hidden="true" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-5 rounded-full bg-[#E89A43] text-white text-[10px] font-semibold flex items-center justify-center px-1.5 animate-badge-in">
                        {totalItems > 99 ? '99+' : totalItems}
                      </span>
                    )}
                  </button>

                  {cartOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40 animate-fade-in"
                        onClick={() => setCartOpen(false)}
                        aria-hidden="true"
                      />
                      <div
                        className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-[0_20px_40px_rgba(42,36,31,0.15)] border border-[#E6D8C9]/60 overflow-hidden z-50 backdrop-blur-xl bg-white/95 animate-fade-in"
                        role="menu"
                      >
                        <div className="p-4 border-b border-[#E6D8C9]/40 flex items-center justify-between">
                          <h3 className="font-display text-lg font-normal text-[#2A241F]">Shopping Cart</h3>
                          <span className="text-sm text-[#2A241F]/50">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                        </div>

                        {cartItems.length === 0 ? (
                          <div className="p-8 text-center">
                            <ShoppingBag size={32} strokeWidth={1} className="mx-auto text-[#E6D8C9] mb-3" />
                            <p className="font-display text-lg text-[#2A241F]/30">Your cart is empty</p>
                            <p className="mt-1 text-sm text-[#2A241F]/40">Add pieces from the shop to start your order</p>
                            <Link
                              to="/shop"
                              onClick={() => setCartOpen(false)}
                              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-2xs font-semibold uppercase tracking-widest border border-[#E89A43] text-[#E89A43] hover:bg-[#E89A43] hover:text-white hover:border-[#E89A43] rounded-full transition"
                            >
                              Shop Now
                            </Link>
                          </div>
                        ) : (
                          <>
                            <div className="max-h-80 overflow-y-auto p-4 space-y-3">
                              {cartItems.map((item) => (
                                 <div
                                   key={`${item._id}-${item.selectedVariant?.color || 'default'}`}
                                   className="flex gap-3 rounded-xl border border-[#E6D8C9]/40 bg-white/50 p-3 transition-colors hover:border-[#E89A43]/40"
                                 >
                                   <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                                     <img
                                       src={item.selectedVariant?.image || item.image || item.images?.[0]?.url}
                                       alt={item.name}
                                       className="h-full w-full object-cover"
                                     />
                                   </div>
                                   <div className="flex-1 min-w-0">
                                     <p className="text-2xs font-medium uppercase tracking-widest text-[#E89A43]">{item.category}</p>
                                     <h4 className="mt-0.5 font-display text-base font-medium text-[#2A241F] truncate">
                                       <Link to={`/shop/${item._id}`} className="hover:text-[#E89A43] transition-colors" onClick={() => setCartOpen(false)}>
                                         {item.name}
                                       </Link>
                                     </h4>
                                     {item.selectedVariant && (
                                       <div className="mt-0.5 flex items-center gap-1.5">
                                         <span className="h-3 w-3 rounded-full border border-[#2A241F]/10" style={{ backgroundColor: item.selectedVariant.colorHex || '#ccc' }} />
                                         <span className="text-xs text-[#2A241F]/60">{item.selectedVariant.color}</span>
                                       </div>
                                     )}
                                     <p className="mt-1 text-sm font-medium text-[#2A241F]">${Number(item.selectedVariant?.price || item.discountPrice || item.price || 0).toFixed(2)}</p>
                                   </div>
                                  <div className="flex flex-col items-end gap-1.5">
                                    <button
                                      onClick={() => removeFromCart(item._id, item.selectedVariant)}
                                      className="p-1.5 rounded-lg text-[#2A241F]/40 hover:text-[#E89A43] hover:bg-[#E6D8C9]/30 transition-colors"
                                      aria-label="Remove from cart"
                                    >
                                      <X size={14} strokeWidth={1.5} />
                                    </button>
                                    <div className="flex items-center rounded-full border border-[#E6D8C9]/60 bg-white">
                                      <button
                                        onClick={() => setCartQuantity(item._id, item.quantity - 1, item.selectedVariant)}
                                        disabled={item.quantity <= 1}
                                        className="flex h-8 w-8 items-center justify-center text-[#2A241F]/50 transition hover:text-[#2A241F] disabled:opacity-30 disabled:cursor-not-allowed"
                                        aria-label="Decrease quantity"
                                      >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                      </button>
                                      <span className="min-w-8 text-center text-sm font-medium text-[#2A241F]">{item.quantity}</span>
                                      <button
                                        onClick={() => setCartQuantity(item._id, item.quantity + 1, item.selectedVariant)}
                                        className="flex h-8 w-8 items-center justify-center text-[#2A241F]/50 transition hover:text-[#2A241F]"
                                        aria-label="Increase quantity"
                                      >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="border-t border-[#E6D8C9]/40 p-4 space-y-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-[#2A241F]/55">Subtotal</span>
                                <span className="font-medium text-[#2A241F]">${cartItems.reduce((sum, item) => sum + Number(item.selectedVariant?.price || item.discountPrice || item.price || 0) * item.quantity, 0).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-[#2A241F]/55">Shipping</span>
                                <span className="font-medium text-[#2A241F]">Free</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-[#2A241F]/55">Tax</span>
                                <span className="font-medium text-[#2A241F]">Calculated at checkout</span>
                              </div>
                              <div className="border-t border-[#E6D8C9]/40 pt-3">
                                <div className="flex justify-between text-lg font-semibold text-[#2A241F]">
                                  <span>Total</span>
                                  <span>${cartItems.reduce((sum, item) => sum + Number(item.selectedVariant?.price || item.discountPrice || item.price || 0) * item.quantity, 0).toFixed(2)}</span>
                                </div>
                              </div>
                              <Link
                                to="/cart"
                                onClick={() => setCartOpen(false)}
                                className="w-full flex items-center justify-center gap-2 rounded-full bg-[#2A241F] px-6 py-3 text-xs font-medium uppercase tracking-widest text-white transition hover:bg-[#2A241F]/90 hover:shadow-lg"
                              >
                                <Package size={14} strokeWidth={1.5} />
                                View Cart
                              </Link>
                              <Link
                                to="/checkout"
                                onClick={() => setCartOpen(false)}
                                className="w-full flex items-center justify-center gap-2 rounded-full border border-[#E6D8C9] bg-white px-6 py-3 text-xs font-medium uppercase tracking-widest text-[#2A241F]/70 transition hover:border-[#E89A43] hover:text-[#E89A43]"
                              >
                                <CreditCard size={14} strokeWidth={1.5} />
                                Checkout
                              </Link>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="relative" role="menu" aria-label="User menu" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((p) => !p)}
                    className="p-2.5 md:p-3 rounded-full text-[#2A241F]/70 transition-all duration-300 hover:bg-[#E6D8C9]/50 hover:text-[#2A241F]"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    aria-label="User menu"
                  >
                    <User size={18} md={20} strokeWidth={1.5} aria-hidden="true" className="transition-colors duration-300" />
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40 animate-fade-in"
                        onClick={() => setUserMenuOpen(false)}
                        aria-hidden="true"
                      />
                      <div
                        className="absolute right-0 mt-3 w-56 md:w-64 bg-white rounded-2xl shadow-[0_20px_40px_rgba(42,36,31,0.15)] border border-[#E6D8C9]/60 overflow-hidden z-50 backdrop-blur-xl bg-white/95 animate-fade-in"
                        role="menu"
                      >
                        {isAuthenticated && user ? (
                          <>
                            <Link
                              to="/account"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#2A241F] hover:bg-[#E6D8C9]/40 transition-colors"
                              role="menuitem"
                            >
                              <LayoutDashboard size={16} strokeWidth={1.5} className="text-[#E89A43]" aria-hidden="true" />
                              My Account
                            </Link>
                            <hr className="my-2 border-[#E6D8C9]/40" />
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm font-medium text-[#C62828] hover:bg-[#C62828]/5 transition-colors"
                              role="menuitem"
                            >
                              <LogOut size={16} strokeWidth={1.5} className="text-[#C62828]" aria-hidden="true" />
                              Logout
                            </button>
                          </>
                        ) : (
                          <>
                            <Link
                              to="/login"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#2A241F] hover:bg-[#E6D8C9]/40 transition-colors"
                              role="menuitem"
                            >
                              <LayoutDashboard size={16} strokeWidth={1.5} className="text-[#E89A43]" aria-hidden="true" />
                              My Account
                            </Link>
                            <hr className="my-2 border-[#E6D8C9]/40" />
                            <Link
                              to="/register"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#2A241F] hover:bg-[#E6D8C9]/40 transition-colors"
                              role="menuitem"
                            >
                              <UserPlus size={16} strokeWidth={1.5} className="text-[#E89A43]" aria-hidden="true" />
                              Sign Up
                            </Link>
                            <Link
                              to="/login"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#2A241F] hover:bg-[#E6D8C9]/40 transition-colors border-t border-[#E6D8C9]/40"
                              role="menuitem"
                            >
                              <LogIn size={16} strokeWidth={1.5} className="text-[#E89A43]" aria-hidden="true" />
                              Log In
                            </Link>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </nav>
        </div>

        {/* MOBILE HEADER - CENTERED LOGO + HAMBURGER */}
        <div className="flex md:hidden items-center justify-center h-[170px] relative">
          <Link
            to="/"
            className="flex flex-col items-center leading-none group"
            aria-label="HOK Interiors - Home"
          >
            <picture>
              <source srcSet={hokLogoWebP} type="image/webp" />
              <img
                src={hokLogoPng}
                alt="HOK Interiors"
                className="h-[170px] w-[170px] object-contain transition-all duration-300 group-hover:scale-102"
                loading="eager"
                width={170}
                height={170}
              />
            </picture>
          </Link>

          <button
            className="absolute text-[#2A241F] transition-all duration-300 hover:bg-[#E6D8C9]/50 active:scale-90"
            style={{ top: '20px', right: '16px', width: '48px', height: '48px', padding: '6px' }}
            onClick={() => setMobileOpen((p) => !p)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={36} strokeWidth={3} /> : <Menu size={36} strokeWidth={3} />}
          </button>
        </div>
      </div>
    </header>

      {/* FULLSCREEN MOBILE MENU - rendered outside header to avoid stacking context issues */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="fixed inset-0 z-[9998] md:hidden bg-[#2A241F]/50 backdrop-blur-md"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 z-[9999] md:hidden w-full h-full bg-[#FAF8F4] shadow-2xl"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between px-6 h-[72px] border-b border-[#E6D8C9]/40">
                  <span className="text-[11px] font-semibold tracking-[0.2em] text-[#8B5E3C]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Menu
                  </span>
                  <button
                    className="p-2 rounded-full text-[#2A241F] transition-all duration-300 hover:bg-[#E6D8C9]/50 active:scale-90"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close menu"
                  >
                    <X size={24} strokeWidth={1.5} />
                  </button>
                </div>

                <motion.nav
                  variants={menuVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex-1 overflow-y-auto px-6 py-8"
                  role="navigation"
                  aria-label="Mobile navigation"
                >
                  <div className="space-y-1">
                    {FULLSCREEN_MENU_ITEMS.map((item) => {
                      const isActive = location.pathname === item.to
                      const Icon = item.icon
                      return (
                        <motion.div key={item.to} variants={itemVariants}>
                          <Link
                            to={item.to}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-5 rounded-2xl px-5 py-4.5 transition-all duration-300 ${
                              isActive
                                ? 'bg-[#E89A43]/10 text-[#E89A43]'
                                : 'text-[#2A241F] hover:bg-[#E6D8C9]/40'
                            }`}
                            aria-current={isActive ? 'page' : undefined}
                          >
                            <span className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-300 ${
                              isActive ? 'bg-[#E89A43]/15 text-[#E89A43]' : 'bg-[#E6D8C9]/40 text-[#2A241F]/70'
                            }`}>
                              <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                            </span>
                            <span className="font-display text-lg md:text-xl font-normal tracking-wide">
                              {item.label}
                            </span>
                          </Link>
                        </motion.div>
                      )
                    })}
                  </div>

                  <div className="mt-10 space-y-4">
                    {isAuthenticated && user ? (
                      <motion.button
                        variants={itemVariants}
                        onClick={() => { handleLogout(); setMobileOpen(false) }}
                        className="flex items-center gap-5 rounded-2xl px-5 py-4.5 text-[#C62828] hover:bg-[#C62828]/5 transition-all duration-300 w-full"
                      >
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E6D8C9]/40 text-[#C62828]">
                          <LogOut size={20} strokeWidth={1.5} aria-hidden="true" />
                        </span>
                        <span className="font-display text-lg md:text-xl font-normal tracking-wide">Logout</span>
                      </motion.button>
                    ) : (
                      <motion.div variants={itemVariants} className="space-y-3">
                        <Link
                          to="/login"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-center gap-2 rounded-full border border-[#2A241F]/20 bg-white px-6 py-3.5 text-sm font-medium text-[#2A241F] transition-all duration-300 hover:border-[#E89A43] hover:text-[#E89A43]"
                        >
                          <LogIn size={16} strokeWidth={1.5} aria-hidden="true" />
                          Log In
                        </Link>
                        <Link
                          to="/register"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-center gap-2 rounded-full bg-[#2A241F] px-6 py-3.5 text-sm font-medium text-white transition-all duration-300 hover:bg-[#2A241F]/90"
                        >
                          <UserPlus size={16} strokeWidth={1.5} aria-hidden="true" />
                          Sign Up
                        </Link>
                      </motion.div>
                    )}
                  </div>
                </motion.nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
