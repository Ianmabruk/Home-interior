import { motion } from 'framer-motion'
import { Instagram, Facebook } from 'lucide-react'
import { FaTiktok, FaPinterest } from 'react-icons/fa'
import { ArrowRight } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] } }),
}

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/hokinteriors',
    icon: Instagram,
    desc: 'Follow our visual journey through luxury interiors.',
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@hokinteriors',
    icon: FaTiktok,
    desc: 'Watch behind-the-scenes design reels and walkthroughs.',
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/share/14i3V8Sw7uo',
    icon: Facebook,
    desc: 'Stay connected with our latest projects and stories.',
  },
  {
    label: 'Pinterest',
    href: 'https://www.pinterest.com/hokinterior',
    icon: FaPinterest,
    desc: 'Explore curated mood boards and design inspiration.',
  },
]

export const SocialsPage = () => {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <section className="section-pad bg-soft-cream">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mb-16 md:mb-24 text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Follow Us</p>
            <h1 className="font-display text-4xl font-semibold leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
              Socials
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
              Join our design community across platforms and see how we bring luxury interiors to life.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {socialLinks.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={fadeUp}
                  custom={index}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-60px' }}
                  className="group flex flex-col items-center text-center rounded-3xl border border-[var(--border)] bg-white p-8 transition-all duration-500 hover:border-[var(--accent)]/60 hover:shadow-[0_25px_80px_rgba(42,36,31,0.12)] hover:-translate-y-1"
                >
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#E6D8C9]/60 text-[#2A241F] transition-all duration-500 group-hover:bg-[#E89A43] group-hover:text-white group-hover:scale-105 mb-6">
                    <Icon size={32} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-xl md:text-2xl font-normal text-[#2A241F] leading-tight mb-2 group-hover:text-[#E89A43] transition-colors">
                    {item.label}
                  </h3>
                  <p className="text-sm text-[#2A241F]/60 leading-relaxed mb-6">{item.desc}</p>
                  <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]">
                    Give Me A Follow
                    <ArrowRight size={12} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </motion.a>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

export default SocialsPage
