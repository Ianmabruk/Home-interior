import { memo } from 'react'
import { ScrollReveal } from '../../hooks/useScrollReveal'

const ContactSection = memo(({ contactInfo }) => {
  const phoneNumbers = contactInfo?.phoneNumbers || ['+254 723 057 487']
  const emails = contactInfo?.emails || ['info@hokinteriors.co.ke', 'info@hokinteriors.co.ke']
  const addresses = contactInfo?.addresses || ['Westlands, Nairobi, Kenya']
  const businessHours = contactInfo?.businessHours || 'Mon - Fri: 8:00 AM - 6:00 PM\nSat: 9:00 AM - 4:00 PM\nSun: Closed'

  return (
    <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--accent)]/5 px-6 md:px-12 lg:px-20 py-20 md:py-32">
      <div className="container-wide">
        <ScrollReveal>
          <div className="mb-16 md:mb-24 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Contact Us</p>
            <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
              Get In Touch
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
              We&apos;d love to hear from you. Reach out and let&apos;s start a conversation about your project.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-8 md:grid-cols-3 mb-16">
          <ScrollReveal delay={0} className="text-center md:text-left">
            <div className="mx-auto md:mx-0 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
            </div>
            <h3 className="font-display text-xl font-normal text-[var(--primary)] mb-2">Phone Numbers</h3>
            <div className="space-y-1 text-[var(--primary)]/60 leading-relaxed">
              {phoneNumbers.map((phone, i) => (
                <p key={i}>{phone}</p>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100} className="text-center md:text-left">
            <div className="mx-auto md:mx-0 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
            </div>
            <h3 className="font-display text-xl font-normal text-[var(--primary)] mb-2">Email Addresses</h3>
            <div className="space-y-1 text-[var(--primary)]/60 leading-relaxed">
              {emails.map((email, i) => (
                <p key={i}>{email}</p>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200} className="text-center md:text-left">
            <div className="mx-auto md:mx-0 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            </div>
            <h3 className="font-display text-xl font-normal text-[var(--primary)] mb-2">Office Location</h3>
            <div className="space-y-1 text-[var(--primary)]/60 leading-relaxed">
              {addresses.map((address, i) => (
                <p key={i}>{address}</p>
              ))}
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={300}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--primary)] via-[var(--primary)]/90 to-[var(--primary)]/70 p-8 md:p-12 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,154,67,0.2),transparent_60%)]" />
            <div className="relative z-10">
              <div className="mx-auto md:mx-0 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm text-white border border-white/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-normal text-white mb-4">Business Hours</h3>
              <pre className="text-white/70 leading-relaxed whitespace-pre-wrap text-left max-w-md mx-auto">
                {businessHours}
              </pre>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
})

ContactSection.displayName = 'ContactSection'

export default ContactSection