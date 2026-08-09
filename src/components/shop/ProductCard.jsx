import { memo, useState } from 'react'
import { Heart, ShoppingBag, Eye, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useShop } from '../../context/ShopContext'
import { useCurrency } from '../../context/CurrencyContext'
import PositionedImage from '../common/PositionedImage'

export const ProductCard = memo(({ product, onQuickView }) => {
  const { addToCart, toggleWishlist, wishlist } = useShop()
  const { formatPrice } = useCurrency()
  const variants = product.variants || []
  const defaultVariant = variants.length ? variants[0] : null
  const primaryImage =
    defaultVariant?.image ||
    (typeof product.images?.[0] === 'string' ? product.images[0] : product.images?.[0]?.url) ||
    ''
  const salePercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : null
  const isWishlisted = wishlist?.some((w) => w._id === product._id)
  const price = (defaultVariant?.price ?? product.discountPrice) || product.price
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  const handleAddToCart = async () => {
    if (adding || product.stock === 0) return
    setAdding(true)
    setAdded(false)
    try {
      await addToCart(product, defaultVariant ? { color: defaultVariant.color, colorHex: defaultVariant.colorHex, image: defaultVariant.image } : null, 1)
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } finally {
      setAdding(false)
    }
  }

   return (
    <article
      className="group relative overflow-hidden bg-white shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] rounded-3xl transition-all duration-500 hover:-translate-y-2"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--secondary)]">
        <PositionedImage
          src={primaryImage}
          alt={product.name}
          settings={{ fit: 'contain', position: 'center', zoom: 100 }}
          className="h-full w-full transition duration-700 group-hover:scale-105 bg-[var(--bg)]"
          loading="lazy"
          sizes="(min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
        />

        <div className="absolute left-4 top-4 flex flex-col gap-1.5">
          {salePercent && (
            <span className="bg-[var(--accent)] px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-white rounded-full shadow-md">
              −{salePercent}%
            </span>
          )}
          {product.stock === 0 && (
            <span className="bg-[var(--primary)] px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-white rounded-full shadow-md">
              Sold Out
            </span>
          )}
        </div>

        <div className="absolute right-4 top-4 flex flex-col gap-2 translate-x-10 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
          <button
            onClick={() => toggleWishlist(product)}
            className={`flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center bg-white rounded-full shadow-md transition hover:bg-[var(--secondary)] ${isWishlisted ? 'text-[var(--accent)]' : 'text-[var(--primary)]/50'}`}
            aria-label="Add to wishlist"
          >
            <Heart size={16} strokeWidth={1.5} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
            <button
             onClick={handleAddToCart}
             disabled={product.stock === 0 || adding}
             className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center bg-white rounded-full shadow-md text-[var(--primary)]/50 transition hover:bg-[var(--secondary)] disabled:opacity-40"
             aria-label="Add to cart"
           >
             {added ? (
               <CheckCircle size={16} strokeWidth={2} className="text-green-600" />
             ) : (
               <ShoppingBag size={16} strokeWidth={1.5} />
             )}
           </button>
          <button
            onClick={() => onQuickView?.(product)}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center bg-white rounded-full shadow-md text-[var(--primary)]/50 transition hover:bg-[var(--secondary)]"
            aria-label="Quick view"
          >
            <Eye size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="absolute inset-0 bg-[var(--primary)]/0 transition-all duration-500 group-hover:bg-[var(--primary)]/20" />
      </div>

      <div className="p-5">
        <p className="text-2xs font-medium uppercase tracking-widest text-[var(--accent)]">{product.category}</p>
        <h3 className="mt-2 font-display text-xl font-normal leading-snug text-[var(--primary)]">
          <Link to={`/shop/${product._id}`} className="hover:text-[var(--accent)] transition-colors">
            {product.name}
          </Link>
        </h3>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-medium text-[var(--primary)]">{formatPrice(price)}</span>
          {product.discountPrice && (
            <span className="text-sm text-[var(--primary)]/35 line-through">{formatPrice(product.price)}</span>
          )}
        </div>
        {variants.length > 1 && (
          <div className="mt-3 flex items-center gap-1.5">
            {variants.map((v) => (
              <span
                 key={v.id || v.color}
                className="h-3 w-3 rounded-full border border-[var(--border)]"
                style={{ backgroundColor: v.colorHex || '#ccc' }}
                title={v.color}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  )
})

ProductCard.displayName = 'ProductCard'

export default ProductCard
