import { useState, memo } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@services/api'
import { SocialIcons } from '@components/common/SocialIcons'

export const Footer = memo(() => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')

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
    <footer className="relative bg-[var(--footer-bg)] text-[var(--footer-text)]" role="contentinfo">
      <div className="relative z-10 container-wide px-6 md:px-12 lg:px-20 py-16 md:py-24 lg:py-32">
        <div className="space-y-16 md:space-y-20">
          {/* Section 1: Branding - Centered */}
          <div className="text-center animate-fade-up" style={{ animationDelay: '0s' }}>
            <Link to="/" className="inline-block group" aria-label="HOK Interiors - Home">
              <p className="font-display text-3xl md:text-4xl lg:text-5xl font-medium tracking-[0.25em] leading-tight text-white transition-colors duration-300 group-hover:text-[var(--accent)]">
                HOK Interiors
              </p>
            </Link>
          </div>

          {/* Section 3: Newsletter */}
          <div className="text-center animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="font-display text-xl md:text-2xl font-normal text-white mb-3">Join Mailing List</h3>
            <p className="text-sm text-white/50 mb-6 max-w-md mx-auto">Subscribe to receive the latest updates and offers.</p>
            <form onSubmit={handleSubscribe} className="max-w-md mx-auto space-y-3">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="Email Address"
                className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white placeholder:text-white/40 outline-none transition-all duration-300 focus:border-[var(--accent)] focus:bg-white/10"
              />
              <button
                type="submit"
                className="w-full rounded-full bg-[var(--accent)] px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:bg-[var(--accent)] hover:shadow-lg"
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

          {/* Section 4: Get in Touch */}
          <div className="text-center animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="font-display text-xl md:text-2xl font-normal text-white mb-6">Get in Touch</h3>
            <div className="space-y-3 text-base md:text-lg text-white/70">
              <p className="flex items-center justify-center gap-2">
                <span className="text-[var(--accent)]" aria-hidden="true">📞</span>
                <a href="tel:+254723057487" className="hover:text-[var(--accent)] transition-colors">07-23-05-74-87</a>
              </p>
              <p className="flex items-center justify-center gap-2">
                <span className="text-[var(--accent)]" aria-hidden="true">✉</span>
                 <a href="mailto:info@hokinteriors.co.ke" className="hover:text-[var(--accent)] transition-colors">info@hokinteriors.co.ke</a>
              </p>
            </div>
          </div>

          {/* Section 5: Social */}
          <div className="text-center animate-fade-up" style={{ animationDelay: '0.25s' }}>
            <h3 className="font-display text-xl md:text-2xl font-normal text-white mb-6">Follow Us</h3>
            <SocialIcons dark className="justify-center" />
          </div>

          {/* Copyright */}
          <div className="animate-fade-up mt-12 md:mt-16 pt-8 md:pt-12 border-t border-white/10 text-center" style={{ animationDelay: '0.3s' }}>
            <p className="text-[11px] uppercase tracking-widest text-white/30">
              &copy; {new Date().getFullYear()} HOK INTERIOR DESIGNS. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
})

export default Footer
