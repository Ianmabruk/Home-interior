import { Link } from 'react-router-dom'
import OptimizedImage from '@components/common/OptimizedImage'
import { getBlogImageUrl } from '@utils/blogHelpers'

export const BlogCard = ({ blog, priority = false }) => {
  const imageUrl = getBlogImageUrl(blog)

  return (
    <article className="group relative flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500">
      <Link to={`/blog/${blog.slug || blog.id}`} className="block">
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl">
          {imageUrl ? (
            <OptimizedImage
              src={imageUrl}
              alt={blog.title}
              className="h-full w-full transition duration-700 group-hover:scale-105"
              crop="fill"
              objectFit="cover"
              objectPosition="center"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              width={600}
              height={600}
              priority={priority}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[var(--secondary)]/20 to-[var(--accent)]/10 flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="text-[var(--primary)]/20">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M4 19.5V5.5A2.5 2.5 0 0 1 6.5 3H13" />
                <line x1="8" y1="7" x2="16" y2="7" />
                <line x1="8" y1="11" x2="13" y2="11" />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
      </Link>

      <div className="p-5 flex-1 flex flex-col">
        {blog.category && (
          <span className="text-xs font-medium text-[var(--primary)]/40 mb-2">{blog.category}</span>
        )}
        <h3 className="font-display text-lg md:text-xl font-medium text-[var(--primary)] leading-tight line-clamp-2 mb-4">
          <Link to={`/blog/${blog.slug || blog.id}`} className="hover:text-[var(--accent)] transition-colors">
            {blog.title}
          </Link>
        </h3>
        <Link
          to={`/blog/${blog.slug || blog.id}`}
          className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors"
        >
          View Article
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </article>
  )
}

export default BlogCard