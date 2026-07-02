import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { api } from '../../services/api'

export const AboutPage = () => {
  const [about, setAbout] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/content/about')
      .then((res) => setAbout(res.data))
      .catch(() => setAbout(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 md:px-8">
        <div className="h-12 w-48 animate-pulse rounded-xl bg-beige" />
        <div className="mt-6 h-[420px] w-full animate-pulse rounded-2xl bg-beige" />
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-4 animate-pulse rounded bg-beige" />)}
        </div>
      </div>
    )
  }

  if (!about) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 md:px-8">
        <h1 className="font-display text-5xl">About</h1>
        <p className="mt-6 text-sm text-ink/50">About content has not been configured yet.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-8">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-5xl md:text-6xl"
      >
        About HOK
      </motion.h1>

      {about.aboutImageUrl && (
        <motion.img
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          src={about.aboutImageUrl}
          alt="About HOK Interior Designs"
          className="mt-8 h-[420px] w-full rounded-3xl object-cover bg-beige shadow-soft"
          loading="lazy"
        />
      )}

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div>
          {about.story && (
            <>
              <p className="text-xs uppercase tracking-[0.24em] text-orange">Our Story</p>
              <p className="mt-3 text-base leading-relaxed text-ink/75">{about.story}</p>
            </>
          )}
          {about.companyDescription && (
            <p className="mt-4 text-base leading-relaxed text-ink/75">{about.companyDescription}</p>
          )}
        </div>

        <div className="space-y-4">
          {about.mission && (
            <div className="rounded-2xl border border-black/10 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-orange">Mission</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">{about.mission}</p>
            </div>
          )}
          {about.vision && (
            <div className="rounded-2xl border border-black/10 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-orange">Vision</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">{about.vision}</p>
            </div>
          )}
          {about.location && (
            <div className="rounded-2xl border border-black/10 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-orange">Location</p>
              <p className="mt-2 text-sm text-ink/75">{about.location}</p>
            </div>
          )}
          {about.contactEmail && (
            <div className="rounded-2xl border border-black/10 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-orange">Contact</p>
              <a
                href={`mailto:${about.contactEmail}`}
                className="mt-2 block text-sm text-ink/75 hover:text-orange"
              >
                {about.contactEmail}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
