import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useShop } from '../../context/ShopContext'

export const WishlistPage = () => {
  const { wishlist, toggleWishlist, addToCart } = useShop()
  const { isAuthenticated } = useAuth()

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <h1 className="font-display text-5xl">Wishlist</h1>
      {!wishlist.length ? (
        <div className="mt-8 rounded-2xl border border-dashed border-black/25 bg-white p-8 text-center">
          <p className="font-display text-3xl">Your wishlist is empty</p>
          <p className="mt-2 text-sm text-ink/65">Save products to revisit your favorites.</p>
          {!isAuthenticated ? <p className="mt-2 text-xs uppercase tracking-[0.14em] text-orange">Browse freely. Sign in later to preserve items.</p> : null}
          <Link to="/shop" className="mt-4 inline-block rounded-full bg-orange px-6 py-3 text-xs uppercase tracking-[0.16em]">Browse Shop</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {wishlist.map((item) => (
            <article key={item._id} className="overflow-hidden rounded-2xl border border-black/10 bg-white">
              <img src={item.images?.[0]?.url} alt={item.name} className="h-64 w-full object-cover" />
              <div className="space-y-2 p-4">
                <h2 className="font-display text-3xl">{item.name}</h2>
                <p className="text-sm text-ink/70">${item.discountPrice || item.price}</p>
                <div className="flex gap-2">
                  <button onClick={() => addToCart(item, 1)} className="rounded-full bg-ink px-4 py-2 text-xs uppercase tracking-[0.14em] text-white">Add to cart</button>
                  <button onClick={() => toggleWishlist(item)} className="rounded-full border border-ink px-4 py-2 text-xs uppercase tracking-[0.14em]">Remove</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
