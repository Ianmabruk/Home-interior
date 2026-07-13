import { motion } from 'framer-motion'
import LazyVideo from './LazyVideo'
import PositionedImage from './PositionedImage'
import { getOptimizedVideoUrl, getVideoPosterUrl } from '../../utils/cloudinaryHelpers'

// Premium cinematic showcase for the homepage Projects section (FIX #6 / #7).
//  - Videos are muted, autoplay, loop and play inline the instant they scroll
//    into view (LazyVideo handles near-viewport loading + pause when offscreen).
//  - Images get a slow Ken Burns zoom/pan (CSS `ken-burns`) so static projects
//    still feel cinematic. Both use Cloudinary f_auto/q_auto optimisation and
//    lazy loading, so the homepage stays fast on mobile/tablet/desktop.
//  - NO text overlays / titles / labels — media only, per the design spec.

const getFirstMedia = (project) => {
  if (Array.isArray(project.media) && project.media.length) return project.media[0]
  if (project.videoUrl) return { type: 'video', url: project.videoUrl }
  if (project.coverImageUrl) return { type: 'image', url: project.coverImageUrl }
  return null
}

const KenBurnsImage = ({ src, settings, sizes }) => (
  <div className="absolute inset-0 overflow-hidden">
    <PositionedImage
      src={src}
      alt=""
      settings={settings}
      sizes={sizes}
      className="ken-burns h-full w-full"
      loading="lazy"
    />
  </div>
)

export const CinematicProjects = ({ projects = [] }) => {
  if (!projects.length) return null

  return (
    <div className="grid gap-2 md:gap-3">
      {projects.map((project, i) => {
        const media = getFirstMedia(project)
        const eager = i === 0 // first panel paints immediately (LCP)
        const isVideo = media?.type === 'video'
        return (
          <motion.div
            key={project._id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: (i % 2) * 0.05 }}
            className="group relative aspect-[16/10] w-full overflow-hidden bg-linen md:aspect-[16/9]"
          >
            {isVideo ? (
              <LazyVideo
                src={getOptimizedVideoUrl(media.url, { width: 1280 })}
                poster={getVideoPosterUrl(media.url, { width: 1280 })}
                className="h-full w-full object-cover"
                eager={eager}
              />
            ) : media?.type === 'image' ? (
              <KenBurnsImage src={media.url} settings={project.mediaSettings} sizes="(min-width:768px) 100vw, 100vw" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-linen">
                <p className="text-sm text-ink/30">No media</p>
              </div>
            )}
            {/* Subtle vignette for depth — no text. */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          </motion.div>
        )
      })}
    </div>
  )
}

export default CinematicProjects
