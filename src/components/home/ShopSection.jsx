import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { api } from '@services/api'
import { getOptimizedUrl } from '@utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const SkeletonShop = memo(() => (
  <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--accent)]/5 px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="mb-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Shop</p>
        <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
          Shop Collection
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="group flex flex-col items-center">
            <div className="relative w-full max-w-sm mx-auto mb-6">
              <div className="relative rounded-full overflow-hidden bg-[var(--secondary)]/30 skeleton aspect-square" />
            </div>
            <div className="skeleton h-6 w-3/4 mb-2" />
            <div className="skeleton h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  </section>
))

SkeletonShop.displayName = 'SkeletonShop'

const ErrorShop = memo(({ onRetry }) => (
  <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--accent)]/5 px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="text-center py-12">
        <p className="font-display text-xl text-[var(--primary)]/60 mb-4">Unable to load shop</p>
        <button
          onClick={onRetry}
          className="btn-luxury-primary inline-flex items-center gap-2"
        >
          Retry
          <ArrowRight size={14} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  </section>
))

ErrorShop.displayName = 'ErrorShop'

export const ShopSection = memo(({ products = [] }) => {
  const [data, setData] = useState(products)
  const [loading, setLoading] = useState(!products.length)
  const [error, setError] = useState(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/products')
      setData(res.data || [])
    } catch (err) {
      setError(err?.message || 'Failed to load shop')
      console.warn('[SHOP SECTION] Failed to load:', err?.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!products.length) loadData()
  }, [products.length, loadData])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'products-changed') loadData()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadData])

  const displayProducts = useMemo(() => data.slice(0, 3), [data])

  if (loading) return <SkeletonShop />
  if (error) return <ErrorShop onRetry={loadData} />
  if (!displayProducts.length) return null

  return (
    <section id="shop" className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--accent)]/5 py-20 md:py-32">
      <div className="container-wide md:px-12 lg:px-20">
        <div className="mb-16 md:mb-24 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Shop</p>
          <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
            Shop Collection
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
            Curated pieces to elevate your space with timeless elegance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
          {data.slice(0, 3).map((product, index) => {
            const firstImage =
              typeof product.images?.[0] === 'string'
                ? product.images[0]
                : typeof product.images?.[0]?.url === 'string'
                ? product.images[0].url
                : null
            return (
              <div key={product._id || product.id || index} className="group flex flex-col items-center">
                <Link to={`/shop/${product._id || product.id}`} className="block w-full">
                  <div className="relative w-full max-w-sm mx-auto mb-6">
                    <div className="relative rounded-full overflow-hidden bg-[var(--secondary)]/30 group-hover:shadow-[0_20px_40px_rgba(42,36,31,0.15)] transition-all duration-500">
                      {firstImage ? (
                        <img
                          src={getOptimizedUrl(firstImage, { width: 600, crop: 'limit' })}
                          alt={product.name}
                          className="h-[320px] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="h-[320px] w-full flex items-center justify-center text-[var(--primary)]/30">
                          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-center w-full max-w-xs">
                    <p className="text-2xs font-medium uppercase tracking-widest text-[var(--accent)] mb-1">{product.category}</p>
                    <h3 className="font-display text-base md:text-lg font-medium text-[var(--primary)] leading-tight mb-3 group-hover:text-[var(--accent)] transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-lg font-semibold text-[var(--primary)] mb-4">
                      {product.discountPrice || product.price || 0}
                    </p>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <Link to="/shop" className="btn-luxury-primary group inline-flex items-center gap-2">
            View Full Collection
            <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  )
})

ShopSection.displayName = 'ShopSection'

export default ShopSection