import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_ITEMS = [
  { to: '/shop', label: 'Shop' },
  { to: '/virtual-interior-design', label: 'Virtual Interior Design' },
  { to: '/about', label: 'About' },
]

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-primary/98 shadow-soft backdrop-blur-sm' : 'bg-primary/95 backdrop-blur-sm'
      }`}
    >
      <div className="container-wide flex items-center justify-between px-6 py-4 md:px-12 lg:px-20">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0 leading-tight">
          <p className="font-display text-2xl font-semibold tracking-wide text-textPrimaryDark md:text-3xl">HOK</p>
          <p className="text-2xs font-medium uppercase tracking-widest text-accent">Interior Designs</p>
        </Link>

        {/* Desktop Nav — center */}
        <nav className="hidden items-center gap-8 md:flex lg:gap-10">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative text-2xs font-medium uppercase tracking-widest transition-colors duration-200 after:absolute after:-bottom-0.5 after:left-0 after:h-px after:bg-textPrimaryDark after:transition-all after:duration-300 hover:scale-105 transform-gpu ${
                  isActive
                    ? 'text-textPrimaryDark after:w-full'
                    : 'text-textPrimaryDark/50 hover:text-textPrimaryDark after:w-0 hover:after:w-full'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Actions — right */}
        <div className="hidden items-center gap-4 md:flex">
          <Link
            to="/virtual-interior-design"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-darkBrown px-6 py-3 text-2xs font-medium uppercase tracking-widest text-white transition-all duration-200 hover:bg-textPrimaryDark hover:shadow-lg"
            style={{ height: '48px' }}
          >
            Book Consultation
          </Link>
        </div>

        {/* Mobile: Hamburger */}
        <button
          className="flex items-center justify-center p-2 text-textPrimaryDark md:hidden"
          onClick={() => setMobileOpen((p) => !p)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
        </button>
      </div>

      {/* Mobile slide-in menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-primary shadow-2xl md:hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-borderSubtle">
                <p className="font-display text-xl font-semibold text-textPrimaryDark">HOK</p>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 text-textPrimaryDark"
                  aria-label="Close menu"
                >
                  <X size={24} strokeWidth={1.5} />
                </button>
              </div>
              <nav className="flex flex-col px-6 py-8 gap-6">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className="text-lg font-display font-medium text-textPrimaryDark hover:text-accent transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="mt-4 pt-4 border-t border-borderSubtle">
                  <Link
                    to="/virtual-interior-design"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-darkBrown px-6 py-3 text-2xs font-medium uppercase tracking-widest text-white transition-all duration-200 hover:bg-textPrimaryDark w-full"
                    style={{ height: '48px' }}
                  >
                    Book Consultation
                  </Link>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
