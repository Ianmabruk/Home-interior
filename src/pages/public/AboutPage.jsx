import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Award, Leaf, Users, Target, PenTool, Layers, Shield, Heart, MapPin, SparklesIcon } from 'lucide-react'
import { api } from '../../services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'
import PositionedImage from '../../components/common/PositionedImage'
import { PageMeta } from '../../hooks/usePageMeta'

export const AboutPage = () => {
  const [about, setAbout] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadAbout = () => {
    api.get('/about')
      .then((res) => setAbout(res.data))
      .catch(() => setAbout(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadAbout() }, [])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'about-changed') loadAbout()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <div className="h-[70vh] w-full bg-[var(--secondary)]/50" />
        <div className="section-pad container-wide px-6 md:px-12 lg:px-20">
          <div className="grid gap-16 md:grid-cols-2">
            <div className="space-y-6">
              <div className="skeleton h-8 w-32" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-3/4" />
            </div>
            <div className="space-y-4">
              <div className="skeleton h-32 w-full rounded-2xl" />
              <div className="skeleton h-32 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!about) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[var(--bg)] px-6">
        <div className="text-center max-w-lg">
          <h1 className="font-display text-6xl font-normal text-[var(--primary)]">About</h1>
          <p className="mt-6 text-base text-[var(--primary)]/55 leading-relaxed">
            About content has not been configured yet. The admin can add the company story, mission, vision, values, and gallery images from the <strong className="text-[var(--primary)]">Admin Dashboard \u2192 About</strong> section.
          </p>
          <Link to="/" className="btn-luxury-primary mt-8 inline-block">Go Home</Link>
        </div>
      </div>
    )
  }

  // All content now comes from the admin dashboard
  const values = about.values ? about.values.split('\n').filter(v => v.trim()).map((val, i) => ({
    icon: [Award, Leaf, Users, Target, PenTool, Layers][i] || Award,
    title: val.split(':')[0] || val,
    desc: val.split(':')[1] || val
  })) : []

  const whyChooseHok = about.whyChooseHok ? about.whyChooseHok.split('\n').filter(v => v.trim()).map((val, i) => ({
    icon: [Shield, Heart, SparklesIcon, Award, Users, MapPin][i] || Shield,
    title: val.split(':')[0] || val,
    desc: val.split(':')[1] || val
  })) : []

  const areasServed = about.areasServed ? about.areasServed.split('\n').filter(v => v.trim()) : []
  const team = about.team ? (typeof about.team === 'string' ? JSON.parse(about.team) : about.team) : []

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <PageMeta title="About Us — HOK Interior Designs" description="Learn about HOK Interior Designs — our story, philosophy, and design team." />
      {/* Hero Header */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden bg-[var(--primary)]">
        <div className="absolute inset-0">
          {about.aboutImageUrl && (
            <PositionedImage
              src={about.aboutImageUrl}
              alt="About HOK Interior Designs"
              settings={about.mediaSettings}
              className="h-full w-full"
              loading="eager"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/90 via-[var(--primary)]/50 to-transparent" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/40 to-transparent" />
        <div className="relative z-10 flex h-full items-end">
          <div className="container-wide px-6 pb-16 md:px-12 lg:px-20 lg:pb-24">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]/80 mb-4">Our Story</p>
              <h1 className="font-display text-5xl font-normal leading-[0.95] text-white md:text-7xl lg:text-8xl">
                {about.heading || 'About HOK'}
              </h1>
              <p className="mt-6 max-w-xl text-base text-white/70 leading-relaxed">
                {about.heroSubtitle || 'Redefining luxury interiors with timeless elegance and meticulous attention to detail since 2010.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story + Values */}
      <section className="section-pad bg-[var(--bg)]">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <div className="grid gap-16 lg:grid-cols-2">
            <div className="space-y-6 max-w-3xl">
              {about.story && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Our Story</p>
                  <p className="text-lg leading-[1.8] text-[var(--primary)]">{about.story}</p>
                </div>
              )}
              {about.companyDescription && (
                <p className="text-base leading-[1.8] text-[var(--primary)]/55">{about.companyDescription}</p>
              )}
              {about.location && (
                <div className="pt-4">
                  <p className="text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/40 mb-1">Location</p>
                  <p className="text-sm text-[var(--primary)]/60">{about.location}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {values.map((value, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-6 transition-all duration-500 hover:border-[var(--accent)]/60 hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)]"
                >
                  <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <value.icon size={28} strokeWidth={1.2} className="text-[var(--accent)] mb-4" />
                  <h3 className="font-display text-xl font-normal text-[var(--primary)]">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--primary)]/55">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mission + Vision Cards */}
          <div className="mt-20 grid gap-6 md:grid-cols-2">
            {about.mission && (
              <div className="relative overflow-hidden rounded-3xl bg-white p-8 md:p-10 shadow-[0_2px_16px_rgba(42,36,31,0.04)] border border-[var(--border)]">
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[var(--accent)] via-[var(--secondary)] to-[var(--accent)]" />
                <div className="pl-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Target size={24} strokeWidth={1.5} className="text-[var(--accent)]" />
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]">Mission</p>
                  </div>
                  <p className="text-base leading-[1.8] text-[var(--primary)]/65">{about.mission}</p>
                </div>
              </div>
            )}
            {about.vision && (
              <div className="relative overflow-hidden rounded-3xl bg-white p-8 md:p-10 shadow-[0_2px_16px_rgba(42,36,31,0.04)] border border-[var(--border)]">
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[var(--secondary)] via-[var(--accent)] to-[var(--secondary)]" />
                <div className="pl-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Award size={24} strokeWidth={1.5} className="text-[var(--accent)]" />
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]">Vision</p>
                  </div>
                  <p className="text-base leading-[1.8] text-[var(--primary)]/65">{about.vision}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Why Choose HOK */}
      {whyChooseHok.length > 0 && (
        <section className="section-pad bg-[var(--bg)]">
          <div className="container-wide px-6 md:px-12 lg:px-20">
            <div className="mb-16 md:mb-24 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Why Choose HOK</p>
              <h2 className="font-display text-4xl font-normal leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
                The HOK Difference
              </h2>
              <p className="mt-6 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
                We don&apos;t just design spaces \u2014 we craft experiences that transform how you live, work, and feel.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {whyChooseHok.map((item, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-6 md:p-8 transition-all duration-500 hover:border-[var(--accent)]/60 hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)]"
                >
                  <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <item.icon size={28} strokeWidth={1.2} className="text-[var(--accent)] mb-4" />
                  <h3 className="font-display text-xl font-normal text-[var(--primary)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--primary)]/55">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Areas Served */}
            {areasServed.length > 0 && (
              <div className="mt-24">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--primary)] via-[var(--primary)]/90 to-[var(--primary)]/70 p-8 md:p-12 lg:p-16 text-center">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,154,67,0.2),transparent_60%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(230,211,203,0.1),transparent_60%)]" />
                  <div className="relative z-10">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--secondary)]/50 mb-4">We Serve</p>
                    <h3 className="font-display text-4xl md:text-5xl font-normal text-white mb-8">
                      Across Kenya & East Africa
                    </h3>
                    <p className="mt-6 max-w-2xl mx-auto text-base text-white/60 leading-relaxed mb-10">
                      From Nairobi to the Coast, Western Kenya to the Rift Valley \u2014 and across borders to Tanzania, Uganda, and Rwanda.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                      {areasServed.map((area, i) => (
                        <span
                          key={i}
                          className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium transition-all duration-300 hover:bg-white/20 hover:border-white/40"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Team Section */}
      {team.length > 0 && (
        <section className="section-pad bg-[var(--secondary)]/50">
          <div className="container-wide px-6 md:px-12 lg:px-20">
            <div className="mb-16 md:mb-24 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Our Team</p>
              <h2 className="font-display text-4xl font-normal leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
                The People Behind HOK
              </h2>
              <p className="mt-6 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
                A collective of passionate designers, architects, and project managers dedicated to creating exceptional spaces.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {team.map((member) => (
                <div
                  key={member.name}
                  className="group relative overflow-hidden bg-white rounded-3xl shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500 border border-[var(--border)]"
                >
                  <div className="relative aspect-square overflow-hidden">
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={member.name}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[var(--secondary)]/30 to-[var(--accent)]/10 flex items-center justify-center text-[var(--primary)]/30">
                        <Users size={40} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/80 via-[var(--primary)]/30 to-transparent opacity-70 transition-all duration-700 group-hover:opacity-90" />
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                      <h3 className="font-display text-xl font-normal">{member.name}</h3>
                      <p className="text-sm text-white/80 mt-1">{member.role}</p>
                      <p className="text-xs text-white/60 mt-2">{member.bio}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Process Timeline */}
      {about.process && about.process.length > 0 && (
        <section className="section-pad bg-[var(--bg)]">
          <div className="container-wide px-6 md:px-12 lg:px-20">
            <div className="mb-16 md:mb-24 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Our Process</p>
              <h2 className="font-display text-4xl font-normal leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl">
                From Vision to Reality
              </h2>
              <p className="mt-6 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
                A seamless journey that transforms your space with precision and elegance.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {about.process.map((step, i) => (
                <div
                  key={i}
                  className="relative group"
                >
                  <div className="relative overflow-hidden rounded-3xl bg-white p-8 md:p-10 shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500 border border-[var(--border)]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--accent)]/10 to-[var(--accent)]/5 border border-[var(--accent)]/20 group-hover:border-[var(--accent)] group-hover:bg-gradient-to-br group-hover:from-[var(--accent)]/20 group-hover:to-[var(--accent)]/10 transition-all duration-500">
                        {(step.icon ? step.icon : Users) && <step.icon size={24} strokeWidth={1.5} className="text-[var(--accent)]" />}
                      </div>
                      
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] text-center mb-2">{String(i + 1).padStart(2, '0')}</p>
                      <h3 className="font-display text-xl font-normal text-[var(--primary)] text-center mb-3">{step.title}</h3>
                      <p className="text-sm leading-relaxed text-[var(--primary)]/60 text-center">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Brand Stats */}
      {about.statistics && (
        <section className="section-pad bg-[var(--primary)]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,154,67,0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(230,211,203,0.08),transparent_60%)]" />
          <div className="relative section-pad">
            <div className="container-wide px-6 md:px-12 lg:px-20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {about.statistics.split('\n').filter(v => v.trim()).map((stat, i) => {
                  const [value, label] = stat.split(':')
                  return (
                    <div key={i} className="text-center">
                      <p className="font-display text-5xl md:text-6xl font-normal text-white">{value}</p>
                      <p className="mt-2 text-sm text-white/60 uppercase tracking-widest">{label || stat}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-[var(--primary)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,154,67,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(230,211,203,0.08),transparent_60%)]" />
        <div className="relative section-pad">
          <div className="container-narrow px-6 text-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--secondary)]/50 mb-4">Ready to Begin?</p>
              <h2 className="font-display text-5xl font-normal text-white md:text-6xl lg:text-7xl leading-[1.05]">
                Let&apos;s Create<br />Something Beautiful
              </h2>
              <p className="mt-6 max-w-md mx-auto text-base text-white/50 leading-relaxed">
                Transform your space with our expert interior design services. Schedule a consultation today.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link to="/portfolio" className="btn-luxury-primary group">
                  View Our Work <ArrowRight size={14} strokeWidth={1.5} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link to="/virtual-design" className="btn-luxury-secondary group">
                  Virtual Showroom
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage