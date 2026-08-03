import { Link } from 'react-router-dom'
import { getOptimizedUrl, buildSrcSet } from '@utils/cloudinaryHelpers'
import { formatDateShort, extractTags, getReadingTime, getBlogImageUrl } from '@utils/blogHelpers'

export const BlogCard = ({ blog, priority = false }) => {
  const imageUrl = getBlogImageUrl(blog)
  const readingTime = getReadingTime(blog?.content || blog?.description || '')
  const tags = extractTags(blog?.tags)

  return (
    <article className="group relative flex flex-col bg-white rounded-3xl overflow-hidden shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500">
      <Link to={`/blog/${blog.slug || blog.id}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          {imageUrl ? (
            <img
              src={getOptimizedUrl(imageUrl, { width: 800, crop: 'limit' }) || imageUrl}
              srcSet={buildSrcSet(imageUrl) || undefined}
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              alt={blog.title}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              width={800}
              height={600}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[var(--bg)] to-[var(--secondary)]/30 flex items-center justify-center text-[var(--primary)]/20">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
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

      <div className="p-6 md:p-8 flex-1 flex flex-col">
        <div className="mb-2 flex items-center gap-2 flex-wrap">
          {blog.published && (
            <span className="text-xs font-semibold uppercase tracking-wider text-green-600">Published</span>
          )}
          {blog.featured && (
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">Featured</span>
          )}
          {blog.category && (
            <span className="text-xs font-medium text-[var(--primary)]/40">{blog.category}</span>
          )}
        </div>

        <h3 className="font-display text-xl md:text-2xl font-medium text-[var(--primary)] leading-tight line-clamp-2 mb-3">
          <Link to={`/blog/${blog.slug || blog.id}`} className="hover:text-[var(--accent)] transition-colors">
            {blog.title}
          </Link>
        </h3>

        {blog.description && (
          <p className="text-sm text-[var(--primary)]/60 leading-relaxed line-clamp-3 mb-4">
            {blog.description}
          </p>
        )}

        {tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 mb-4">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full bg-[var(--secondary)]/30 text-[var(--primary)]/60"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-[var(--primary)]/50 mt-auto pt-4 border-t border-border/50">
          <span>{blog.author || 'HOK Interiors'}</span>
          <span>{readingTime} min read</span>
          <time dateTime={blog.publishDate || blog.createdAt}>
            {formatDateShort(blog.publishDate || blog.createdAt)}
          </time>
        </div>
      </div>
    </article>
  )
}

export default BlogCard
