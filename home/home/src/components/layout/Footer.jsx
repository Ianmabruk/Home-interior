import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { SHOP_CATEGORIES } from '../../utils/constants'
import { SocialIcons } from '../common/SocialIcons'
import { NewsletterForm } from '../common/NewsletterForm'
import { api } from '../../services/api'

export const Footer = () => {
  const [about, setAbout] = useState(null)

  useEffect(() => {
    api
      .get('/content/about')
      .then((res) => setAbout(res.data))
      .catch(() => setAbout(null))
  }, [])

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4 md:px-8">
        {/* Brand + Explore */}
        <div>
          <div className="mb-5">
            <p className="font-display text-3xl font-semibold">HOK</p>
            <p className="text-xs uppercase tracking-[0.2em] text-orange">Interior Designs</p>
          </div>
          <h3 className="font-display text-xl text-white/80">Explore</h3>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li><Link to="/portfolio" className="hover:text-orange transition">Portfolio</Link></li>
            <li><Link to="/projects" className="hover:text-orange transition">Projects</Link></li>
            <li><Link to="/about" className="hover:text-orange transition">About</Link></li>
            <li><Link to="/virtual-interior-design" className="hover:text-orange transition">Virtual Showroom</Link></li>
            <li><Link to="/shop" className="hover:text-orange transition">Shop</Link></li>
            <li><Link to="/wishlist" className="hover:text-orange transition">Wishlist</Link></li>
            <li><Link to="/account" className="hover:text-orange transition">My Account</Link></li>
          </ul>
        </div>

        {/* Shop Categories */}
        <div>
          <h3 className="font-display text-xl">Shop Categories</h3>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/70">
            {SHOP_CATEGORIES.map((category) => (
              <li key={category}>
                <Link to={`/shop?category=${encodeURIComponent(category)}`} className="hover:text-orange transition">
                  {category}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact + Socials */}
        <div>
          <h3 className="font-display text-xl">Contact</h3>
          <div className="mt-3 space-y-2 text-sm text-white/70">
            {about?.location && <p>📍 {about.location}</p>}
            {about?.contactEmail && (
              <p>
                <a href={`mailto:${about.contactEmail}`} className="hover:text-orange transition">
                  {about.contactEmail}
                </a>
              </p>
            )}
            {!about?.location && !about?.contactEmail && (
              <p className="text-white/40">Contact info not configured</p>
            )}
          </div>
          <SocialIcons className="mt-5 justify-start" socials={about?.socials || {}} />
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="font-display text-xl">Newsletter</h3>
          <p className="mt-3 text-sm text-white/70">Get design notes and curated drops.</p>
          <div className="mt-4">
            <NewsletterForm />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} HOK Interior Designs. All rights reserved.
      </div>
    </footer>
  )
}
