import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { getOptimizedUrl, buildSrcSet } from '../utils/cloudinaryHelpers'

export const MobilePreviewCard = ({ to, label, imageUrl, alt }) => (
  <Link to={to} className="block">
    <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 shadow-[0_10px_40px_rgba(42,36,31,0.06)]">
      {imageUrl && (
        <img
          src={getOptimizedUrl(imageUrl, { width: 640 })}
          srcSet={buildSrcSet(imageUrl) || undefined}
          sizes="100vw"
          alt={alt}
          className="h-64 w-full object-cover transition duration-700"
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
    <div className="mt-4 text-center">
      <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]">
        {label}
        <ArrowRight size={14} strokeWidth={1.5} />
      </span>
    </div>
  </Link>
)
