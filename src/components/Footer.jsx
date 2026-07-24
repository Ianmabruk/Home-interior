import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Instagram, Facebook, ArrowRight } from 'lucide-react'
import { FaTiktok, FaPinterest } from 'react-icons/fa'
import { api } from '../services/api'

export const Footer = () => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')

  const socialLinks = [
    { icon: FaTiktok, href: 'https://www.tiktok.com/@hokinteriors', label: 'TikTok', ariaLabel: 'Follow us on TikTok' },
    { icon: Instagram, href: 'https://www.instagram.com/hokinteriors', label: 'Instagram', ariaLabel: 'Follow us on Instagram' },
    { icon: Facebook, href: 'https://www.facebook.com/share/14i3V8Sw7uo', label: 'Facebook', ariaLabel: 'Follow us on Facebook' },
    { icon: FaPinterest, href: 'https://www.pinterest.com/hokinterior', label: 'Pinterest', ariaLabel: 'Follow us on Pinterest' },
  ]

  const handleSubscribe = async (e) => {
    e.preventDefault()
    setStatus('')
    try {
      await api.post('/content/newsletter', { email })
      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <footer className="relative bg-footer-bg text-footer-text" role="contentinfo">
      <div className="relative z-10 container-wide px-6 md:px-12 lg:px-20 py-16 md:py-24 lg:py-32">
        <div className="space-y-16 md:space-y-20">
          {/* Section 1: Branding - Centered */}
          <div className="text-center animate-fade-up" style={{ animationDelay: '0s' }}>
            <Link to="/" className="inline-block group" aria-label="HOK Interiors - Home">
              <p className="font-display text-3xl md:text-4xl lg:text-5xl font-medium tracking-[0.25em] leading-tight text-white transition-colors duration-300 group-hover:text-orange-accent">
                HOK Interiors
              </p>
            </Link>
          </div>

          {/* Section 2: Follow Us */}
          <div className="text-center animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="font-display text-xl md:text-2xl font-normal text-white mb-6">Follow Us</h3>
            <div className="flex items-center justify-center gap-4 md:gap-6">
              {socialLinks.map((social, index) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.ariaLabel}
                  className="social-icon group relative flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full border border-white/20 transition-all duration-500 hover:border-orange-accent hover:bg-orange-accent/10 hover:text-orange-accent hover:scale-110 active:scale-95"
                  style={{ animationDelay: `${index * 0.08}s` }}
                  role="listitem"
                >
                  <social.icon size={22} md={24} strokeWidth={1.5} className="transition-colors duration-300 group-hover:text-orange-accent" aria-hidden="true" />
                  <span className="absolute inset-0 rounded-full border border-transparent transition-all duration-300 group-hover:border-orange-accent group-hover:scale-110" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Section 3: Contact Us */}
          <div className="text-center animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="font-display text-xl md:text-2xl font-normal text-white mb-6">Contact Us</h3>
            <div className="space-y-3 text-base md:text-lg text-white/70">
              <p className="flex items-center justify-center gap-2">
                <span className="text-orange-accent" aria-hidden="true">📞</span>
                <a href="tel:+254700000000" className="hover:text-orange-accent transition-colors">+254 700 000 000</a>
              </p>
              <p className="flex items-center justify-center gap-2">
                <span className="text-orange-accent" aria-hidden="true">✉</span>
                <a href="mailto:info@hokinteriors.com" className="hover:text-orange-accent transition-colors">info@hokinteriors.com</a>
              </p>
            </div>
          </div>

          {/* Section 4: Newsletter */}
          <div className="text-center animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <h3 className="font-display text-xl md:text-2xl font-normal text-white mb-3">Newsletter</h3>
            <p className="text-sm text-white/50 mb-6 max-w-md mx-auto">Subscribe to receive the latest updates and offers.</p>
            <form onSubmit={handleSubscribe} className="max-w-md mx-auto space-y-3">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="Email Address"
                className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white placeholder:text-white/40 outline-none transition-all duration-300 focus:border-orange-accent focus:bg-white/10"
              />
              <button
                type="submit"
                className="w-full rounded-full bg-orange-accent px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:bg-orange-hover hover:shadow-lg"
              >
                Join Mailing List
              </button>
            </form>
            {status === 'success' && (
              <p className="text-xs text-white/70 mt-3">Thank you for subscribing.</p>
            )}
            {status === 'error' && (
              <p className="text-xs text-white/70 mt-3">Subscription failed. Please try again.</p>
            )}
          </div>

          {/* Copyright */}
          <div className="animate-fade-up mt-12 md:mt-16 pt-8 md:pt-12 border-t border-white/10 text-center" style={{ animationDelay: '0.4s' }}>
            <p className="text-[11px] uppercase tracking-widest text-white/30">
              &copy; {new Date().getFullYear()} HOK INTERIOR DESIGNS. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer