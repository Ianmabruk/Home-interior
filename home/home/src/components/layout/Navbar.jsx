import { Heart, Menu, MessageCircle, ShoppingBag, User, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useShop } from '../../context/ShopContext'

const navItems = [
  { to: '/shop', label: 'Shop' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/about', label: 'About' },
  { to: '/virtual-interior-design', label: 'Virtual Showroom' },
]

export const Navbar = () => {
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { user, logout } = useAuth()
  const { wishlist, cart } = useShop()

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        <Link to="/" className="leading-tight">
          <p className="font-display text-3xl font-semibold text-ink">HOK</p>
          <p className="font-body text-sm uppercase tracking-[0.18em] text-orange">Interior Designs</p>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `font-body text-sm uppercase tracking-[0.16em] transition ${
                  isActive ? 'text-orange' : 'text-ink hover:text-orange'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/wishlist" className="relative rounded-full p-2 hover:bg-beige" aria-label="Wishlist">
            <Heart size={18} />
            <span className="absolute -right-1 -top-1 rounded-full bg-orange px-1 text-[10px] font-semibold">{wishlist.length}</span>
          </Link>
          <Link to="/cart" className="relative rounded-full p-2 hover:bg-beige" aria-label="Cart">
            <ShoppingBag size={18} />
            <span className="absolute -right-1 -top-1 rounded-full bg-orange px-1 text-[10px] font-semibold">{cart.length}</span>
          </Link>
          <Link to="/chat" className="rounded-full p-2 hover:bg-beige" aria-label="Chat"><MessageCircle size={18} /></Link>
          <div className="relative">
            <button
              className="rounded-full p-2 hover:bg-beige"
              aria-label="Profile"
              onClick={() => setProfileOpen((prev) => !prev)}
            >
              <User size={18} />
            </button>
            <AnimatePresence>
            {profileOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 mt-2 w-48 rounded-xl border border-black/10 bg-white p-2 shadow-soft"
              >
                {!user ? (
                  <>
                    <Link to="/login" className="block rounded-lg px-3 py-2 text-sm hover:bg-cream">Login</Link>
                    <Link to="/register" className="block rounded-lg px-3 py-2 text-sm hover:bg-cream">Register</Link>
                  </>
                ) : (
                  <>
                    <Link to="/account" className="block rounded-lg px-3 py-2 text-sm hover:bg-cream">My Account</Link>
                    {user.role === 'admin' ? (
                      <Link to="/admin" className="block rounded-lg px-3 py-2 text-sm hover:bg-cream">Admin Dashboard</Link>
                    ) : null}
                    <button onClick={logout} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-cream">Logout</button>
                  </>
                )}
              </motion.div>
            ) : null}
            </AnimatePresence>
          </div>
        </div>

        <button className="md:hidden" onClick={() => setOpen((prev) => !prev)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open ? (
        <div className="space-y-3 border-t border-black/10 bg-white p-4 md:hidden">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)} className="block text-sm uppercase tracking-[0.12em] text-ink">
              {item.label}
            </NavLink>
          ))}
          <NavLink to="/wishlist" onClick={() => setOpen(false)} className="block text-sm uppercase tracking-[0.12em] text-ink">Wishlist</NavLink>
          <NavLink to="/cart" onClick={() => setOpen(false)} className="block text-sm uppercase tracking-[0.12em] text-ink">Cart</NavLink>
          <NavLink to="/chat" onClick={() => setOpen(false)} className="block text-sm uppercase tracking-[0.12em] text-ink">Chat</NavLink>
          <div className="flex gap-4 pt-1">
            <Link to="/login" className="text-sm text-ink">Login</Link>
            <Link to="/register" className="text-sm text-orange">Register</Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}
