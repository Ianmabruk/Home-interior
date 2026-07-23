import { Link } from 'react-router-dom'
import { Instagram, Facebook, ArrowRight } from 'lucide-react'
import { FaTiktok, FaPinterest } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'

export const Footer = () => {
  const { user } = useAuth()

  const socialLinks = [
    { icon: FaTiktok, href: 'https://www.tiktok.com/@hokinteriors', label: 'TikTok', ariaLabel: 'Follow us on TikTok' },
    { icon: Instagram, href: 'https://www.instagram.com/hokinteriors', label: 'Instagram', ariaLabel: 'Follow us on Instagram' },
    { icon: Facebook, href: 'https://www.facebook.com/share/14i3V8Sw7uo', label: 'Facebook', ariaLabel: 'Follow us on Facebook' },
    { icon: FaPinterest, href: 'https://www.pinterest.com/hokinterior', label: 'Pinterest', ariaLabel: 'Follow us on Pinterest' },
  ]

  const quickLinks = [
    { to: '/portfolio', label: 'Portfolio' },
    { to: '/services', label: 'Services' },
    { to: '/virtual-design', label: 'Virtual Designs' },
    { to: '/about', label: 'About Us' },
    { to: '/account', label: 'My Account', auth: true },
    { to: '/register', label: 'Register', guest: true },
    { to: '/login', label: 'Login', guest: true },
  ]

  const filteredQuickLinks = quickLinks.filter(link => {
    if (link.auth && !user) return false
    if (link.guest && user) return false
    return true
  })

  return (
    <footer className="relative bg-footer-bg text-footer-text" role="contentinfo">
      <div className="relative z-10 container-wide px-6 md:px-12 lg:px-20 py-16 md:py-24 lg:py-32">
        <div
          className="animate-fade-up grid gap-12 md:gap-16 lg:grid-cols-2 xl:grid-cols-4"
        >
          <div
            className="animate-fade-up lg:col-span-2 xl:col-span-1 space-y-6"
            style={{ animationDelay: '0s' }}
          >
            <Link to="/" className="inline-block group" aria-label="HOK INTERIOR DESIGNS - Home">
              <div className="flex flex-col items-start">
                <p className="font-display text-3xl md:text-4xl font-medium tracking-[0.25em] leading-tight text-white transition-colors duration-300 group-hover:text-orange-accent">
                  HOK
                </p>
                <p className="font-sans text-[11px] font-medium uppercase tracking-[0.35em] leading-none text-orange-accent -mt-1">
                  INTERIOR DESIGNS
                </p>
              </div>
            </Link>
            <p className="font-display text-lg md:text-xl leading-relaxed text-white/60 max-w-xs">
              Creating timeless interiors that transform spaces into experiences.
            </p>
            <div className="space-y-3 text-sm text-white/50">
              <p>+254 700 000 000</p>
              <p>info@hokinteriors.com</p>
              <p className="hidden md:block">Nairobi, Kenya</p>
            </div>
          </div>

          <div
            className="animate-fade-up space-y-4"
            style={{ animationDelay: '0.1s' }}
          >
            <h3 className="font-display text-xl font-normal text-white">Quick Links</h3>
            <nav aria-label="Footer navigation">
              <ul className="space-y-3" role="list">
                {filteredQuickLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-white/70 hover:text-orange-accent transition-colors duration-300 group inline-flex items-center gap-2"
                    >
                      {link.label}
                      <ArrowRight size={12} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1 text-orange-accent opacity-0 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div
            className="animate-fade-up space-y-4"
            style={{ animationDelay: '0.3s' }}
          >
            <h3 className="font-display text-xl font-normal text-white">Follow Us</h3>
            <p className="text-sm text-white/50">Join our design community</p>
            <div className="flex items-center gap-3 md:gap-4 pt-2">
              {socialLinks.map((social, index) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.ariaLabel}
                  className="social-icon group relative flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full border border-white/20 transition-all duration-500 hover:border-orange-accent hover:bg-orange-accent/10 hover:text-orange-accent hover:scale-110 active:scale-95"
                  style={{ animationDelay: `${0.3 + index * 0.08}s` }}
                  role="listitem"
                >
                  <social.icon size={22} md={24} strokeWidth={1.5} className="transition-colors duration-300 group-hover:text-orange-accent" aria-hidden="true" />
                  <span className="absolute inset-0 rounded-full border border-transparent transition-all duration-300 group-hover:border-orange-accent group-hover:scale-110" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div
          className="animate-fade-up mt-16 md:mt-24 pt-8 md:pt-12 border-t border-white/10 text-center"
          style={{ animationDelay: '0.5s' }}
        >
          <p className="text-[11px] uppercase tracking-widest text-white/30">
            &copy; {new Date().getFullYear()} HOK INTERIOR DESIGNS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
