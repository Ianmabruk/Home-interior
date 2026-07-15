import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { SHOP_CATEGORIES } from '../../utils/constants'
import { api } from '../../services/api'
import { Instagram, Facebook } from 'lucide-react'
import { SiTiktok } from 'react-icons/si'
import { SiPinterest } from 'react-icons/si'

const SOCIAL_LINKS = [
  {
    key: 'tiktok',
    Icon: SiTiktok,
    label: 'TikTok',
    url: 'https://www.tiktok.com/@esther.k.musa?_r=1&_t=ZS-97myTEWJqDZ',
  },
  {
    key: 'instagram',
    Icon: Instagram,
    label: 'Instagram',
    url: 'https://www.instagram.com/hokinteriors?igsh=OG1tZ2xuOG9mMWRl',
  },
  {
    key: 'facebook',
    Icon: Facebook,
    label: 'Facebook',
    url: 'https://www.facebook.com/share/14i3V8Sw7uo/?mibextid=wwXIfr',
  },
  {
    key: 'pinterest',
    Icon: SiPinterest,
    label: 'Pinterest',
    url: 'https://www.pinterest.com/hokinterior',
  },
]

export const Footer = () => {
  const [about, setAbout] = useState(null)

  useEffect(() => {
    api.get('/content/about').then((res) => setAbout(res.data)).catch(() => setAbout(null))
  }, [])

  return (
    <footer className="bg-footerBlack text-white">
      {/* Main footer grid */}
      <div className="container-wide grid gap-12 px-6 py-16 md:grid-cols-4 md:px-12 lg:px-20">
        {/* Brand + Social Media */}
        <div>
          <Link to="/">
            <p className="font-display text-3xl font-semibold text-white">HOK</p>
            <p className="text-2xs font-medium uppercase tracking-widest text-accent">Interior Designs</p>
          </Link>
          <p className="mt-5 text-sm leading-relaxed text-white/60">
            Crafting spaces that inspire — from concept to completion.
          </p>
          {/* Social Icons */}
          <div className="mt-6 flex items-center gap-3">
            {SOCIAL_LINKS.map(({ key, Icon, label, url }) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/70 transition-all duration-200 hover:scale-110 hover:border-accent hover:bg-accent/20 hover:text-accent hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <Icon size={18} strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>

        {/* Explore */}
        <div>
          <p className="text-2xs font-medium uppercase tracking-widest text-white/40 mb-5">Explore</p>
          <ul className="space-y-3 text-sm text-white/70">
             {[
              { to: '/shop', label: 'Shop' },
              { to: '/portfolio', label: 'Portfolio' },
              { to: '/virtual-interior-design', label: 'Virtual Interior Design' },
              { to: '/about', label: 'About' },
            ].map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="transition-colors hover:text-accent">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Shop Categories */}
        <div>
          <p className="text-2xs font-medium uppercase tracking-widest text-white/40 mb-5">Shop Categories</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-white/70">
            {SHOP_CATEGORIES.map((category) => (
              <li key={category}>
                <Link
                  to={`/shop?category=${encodeURIComponent(category)}`}
                  className="transition-colors hover:text-accent"
                >
                  {category}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="text-2xs font-medium uppercase tracking-widest text-white/40 mb-5">Contact</p>
          <div className="space-y-3 text-sm">
            {about?.location && (
              <p className="flex items-start gap-2 text-white/70">
                <span className="mt-0.5 text-accent">↟</span>
                {about.location}
              </p>
            )}
            {about?.contactEmail && (
              <p>
                <a href={`mailto:${about.contactEmail}`} className="text-white/70 transition hover:text-accent">
                  {about.contactEmail}
                </a>
              </p>
            )}
            {!about?.location && !about?.contactEmail && (
              <p className="text-white/30">Contact info not configured</p>
            )}
          </div>
          <div className="mt-8">
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 border border-white/20 px-5 py-2.5 text-2xs font-medium uppercase tracking-widest text-white/60 transition hover:border-accent hover:text-accent"
            >
              Get In Touch
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 px-6 py-5 md:px-12 lg:px-20">
        <div className="container-wide flex flex-col items-center justify-between gap-3 text-2xs text-white/40 md:flex-row">
          <p>© {new Date().getFullYear()} HOK Interior Designs. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/about" className="hover:text-accent transition-colors">Privacy</Link>
            <Link to="/about" className="hover:text-accent transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
