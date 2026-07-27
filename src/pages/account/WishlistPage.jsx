import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Trash2, ShoppingBag } from 'lucide-react'
import { useShop } from '@context/ShopContext'
import { useCurrency } from '@context/CurrencyContext'
import { PageMeta } from '@hooks/usePageMeta'

export const WishlistPage = () => {
  const { wishlist, removeFromWishlist, addToCart, fetchWishlist } = useShop()
  const { formatPrice } = useCurrency()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWishlist()
  }, [fetchWishlist])

  useEffect(() => {
    if (wishlist !== undefined) {
      setLoading(false)
    }
  }, [wishlist])

  const handleAddToCart = async (product) => {
    await addToCart(product, product.variants?.[0], 1)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] py-12 md:py-20">
      <PageMeta
        title="Wishlist — HOK Interior Designs"
        description="Your saved items and favorites."
      />
      <div className="container-wide px-6 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 md:mb-16"
        >
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-[var(--primary)]">Wishlist</h1>
          <p className="mt-2 text-[var(--primary)]/60">{wishlist?.length || 0} saved item{wishlist?.length !== 1 ? 's' : ''}</p>
        </motion.div>

        {wishlist?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-[var(--secondary)]/30 text-[var(--primary)]/30">
              <Heart size={64} strokeWidth={1} />
            </div>
            <h2 className="font-display text-3xl font-medium text-[var(--primary)] mb-3">Your wishlist is empty</h2>
            <p className="text-[var(--primary)]/60 mb-8 max-w-md mx-auto">Start exploring and save items you love for later.</p>
            <Link to="/shop" className="btn-luxury-primary inline-flex items-center gap-2">
              <ShoppingBag size={14} strokeWidth={1.5} />
              Start Shopping
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wishlist.map((product, index) => (
              <motion.div
                key={product._id || product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="group relative bg-white rounded-3xl border border-[var(--border)]/40 overflow-hidden hover:shadow-[0_20px_40px_rgba(42,36,31,0.1)] transition-all duration-500"
              >
                <Link to={`/shop/${product._id || product.id}`} className="block">
                  <div className="aspect-[4/3] relative overflow-hidden bg-[var(--secondary)]/30">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[var(--primary)]/30">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <p className="text-2xs font-medium uppercase tracking-widest text-[var(--accent)] mb-2">{product.category}</p>
                    <h3 className="font-display text-lg font-medium text-[var(--primary)] line-clamp-1 group-hover:text-[var(--accent)] transition-colors">{product.name}</h3>
                    <p className="mt-2 text-xl font-semibold text-[var(--primary)]">{formatPrice(product.discountPrice || product.price || 0)}</p>
                  </div>
                </Link>
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="p-2 rounded-full bg-white/90 backdrop-blur-sm text-[var(--primary)]/60 hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 hover:text-white hover:bg-[var(--accent)] transition-all shadow-md"
                  >
                    <ShoppingBag size={18} strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => removeFromWishlist(product._id)}
                    className="p-2 rounded-full bg-white/90 backdrop-blur-sm text-[var(--primary)]/60 hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-all shadow-md"
                  >
                    <Trash2 size={18} strokeWidth={1.5} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default WishlistPage