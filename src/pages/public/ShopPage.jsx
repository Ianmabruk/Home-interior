import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '@services/api'
import { getOptimizedUrl } from '@utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { clearApiCache } from '@services/api'
import { PageMeta } from '@hooks/usePageMeta'
import { useShop } from '@context/ShopContext'
import { useCurrency } from '@context/CurrencyContext'

const SkeletonShop = () => (
  <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--accent)]/5 px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="mb-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Shop</p>
        <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
          Shop Collection
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
        {[1, 2, 3, 4, 5, 6].map((i) => (
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
)

const ALLOWED_CATEGORIES = ['Wall Artwork', 'Mirrors', 'Throw Pillows']

export const ShopPage = ({ category }) => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(category || 'all')
  const { addToCart, addToWishlist, wishlist, cart } = useShop()
  const { formatPrice } = useCurrency()
  const navigate = useNavigate()

  const loadProducts = useCallback(async () => {
    try {
      const params = filter !== 'all' ? { category: filter } : {}
      const res = await api.get('/products', { params })
      setProducts(res.data || [])
    } catch (err) {
      console.warn('[SHOP] Failed to load:', err?.message)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'products-changed') {
        clearApiCache('/products')
        loadProducts()
      }
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadProducts])

  const categories = useMemo(() => {
    const present = new Set(products.map((p) => p.category).filter(Boolean))
    return ['all', ...ALLOWED_CATEGORIES.filter((c) => present.has(c))]
  }, [products])

  const displayProducts = useMemo(() => {
    if (filter === 'all') return products.filter((p) => ALLOWED_CATEGORIES.includes(p.category))
    return products.filter((p) => p.category === filter)
  }, [products, filter])

  const [selectedVariants, setSelectedVariants] = useState({})

  const handleAddToCart = async (product) => {
    const variant = selectedVariants[product._id] || product.variants?.[0]
    await addToCart(product, variant, 1)
  }

  const handleBuyNow = async (product) => {
    const variant = selectedVariants[product._id] || product.variants?.[0]
    await addToCart(product, variant, 1)
    navigate('/checkout')
  }

  const handleVariantChange = (productId, variant) => {
    setSelectedVariants((prev) => ({ ...prev, [productId]: variant }))
  }

  const getVariantColor = (variant) => variant?.colorHex || variant?.color || '#cccccc'

  const handleAddToWishlist = async (product) => {
    await addToWishlist(product._id)
  }

  const isInWishlist = (productId) => Array.isArray(wishlist) && wishlist.some((item) => item._id === productId)
  const isInCart = (productId) => Array.isArray(cart) && cart.some((item) => item._id === productId)

  if (loading) {
    return <main><SkeletonShop /></main>
  }

  return (
    <main>
      <PageMeta
        title="Shop Collection — HOK Interior Designs"
        description="Discover timeless furniture and decor pieces curated for luxury living."
      />
      <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-12 md:py-16">
        <div className="container-wide">
          <div className="flex flex-wrap items-center gap-3 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium uppercase tracking-wide transition-all duration-300 ${
                  filter === cat
                    ? 'bg-[var(--primary)] text-white shadow-[0_4px_16px_rgba(42,36,31,0.2)]'
                    : 'bg-white border border-[var(--border)] text-[var(--primary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {displayProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--secondary)]/30 text-[var(--primary)]/30">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              </div>
              <h3 className="font-display text-2xl md:text-3xl text-[var(--primary)] mb-2">No products found</h3>
              <p className="text-[var(--primary)]/60 max-w-md">Try selecting a different category to browse our collection.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
                {displayProducts.map((product, index) => (
                  <motion.article
                    key={product._id || product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className="group flex flex-col items-center"
                  >
                    <Link to={`/shop/${product._id || product.id}`} className="block w-full">
                      <div className="relative w-full max-w-sm mx-auto mb-6">
                        <div className="relative rounded-full overflow-hidden bg-[var(--secondary)]/30 group-hover:shadow-[0_20px_40px_rgba(42,36,31,0.15)] transition-all duration-500">
                          {product.images?.[0] ? (
                            <img
                              src={getOptimizedUrl(typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url, { width: 600, crop: 'limit' })}
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
                         {product.variants && product.variants.length > 1 && (
                           <div className="flex items-center justify-center gap-2 mb-4">
                             {product.variants.map((variant) => {
                               const selected = selectedVariants[product._id]?._id === variant._id
                               return (
                                 <button
                                   key={variant._id || variant.id}
                                   onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVariantChange(product._id, variant) }}
                                   className={`h-6 w-6 rounded-full border-2 transition-all duration-200 ${
                                     selected ? 'border-[var(--accent)] shadow-[0_0_0_2px_rgba(232,154,67,0.3)]' : 'border-transparent hover:border-[var(--border)]'
                                   }`}
                                   style={{ backgroundColor: getVariantColor(variant) }}
                                   aria-label={`Select ${variant.color}`}
                                   title={variant.color}
                                 />
                               )
                             })}
                           </div>
                         )}
                          <p className="text-lg font-semibold text-[var(--primary)] mb-4">
                           {formatPrice(product.discountPrice || product.price || 0)}
                         </p>
                         <div className="flex items-center justify-center gap-3">
                           <button
                             onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToWishlist(product) }}
                             className={`p-3 rounded-full transition-all duration-300 ${isInWishlist(product._id) ? 'bg-[var(--error)]/10 text-[var(--error)]' : 'bg-white border border-[var(--border)] text-[var(--primary)]/60 hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-white hover:shadow-[0_4px_16px_rgba(232,154,67,0.3)]'} `}
                             aria-label={isInWishlist(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                           >
                             <svg width="20" height="20" viewBox="0 0 24 24" fill={isInWishlist(product._id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                               <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                             </svg>
                           </button>
                           <button
                             onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleBuyNow(product) }}
                             className="px-5 py-2.5 rounded-full bg-[var(--primary)] text-white text-xs font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-lg active:scale-95"
                           >
                             Buy Now
                           </button>
                           <button
                             onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(product) }}
                             className={`p-3 rounded-full transition-all duration-300 ${isInCart(product._id) ? 'bg-[var(--accent)] text-white' : 'bg-white border border-[var(--border)] text-[var(--primary)]/60 hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-white hover:shadow-[0_4px_16px_rgba(232,154,67,0.3)]'} `}
                             aria-label={isInCart(product._id) ? 'In cart' : 'Add to cart'}
                           >
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                               <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                               <line x1="3" y1="6" x2="21" y2="6" />
                               <path d="M16 10a4 4 0 0 1-8 0" />
                             </svg>
                           </button>
                         </div>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  )
}

export default ShopPage