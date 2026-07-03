import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useShop } from '../../context/ShopContext'

export const CartPage = () => {
  const navigate = useNavigate()
  const { cart, removeFromCart, setCartQuantity, cartTotal } = useShop()
  const { isAuthenticated } = useAuth()

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <h1 className="font-display text-5xl">Shopping Cart</h1>
      {!cart.length ? (
        <div className="mt-8 rounded-2xl border border-dashed border-black/25 bg-white p-8 text-center">
          <p className="font-display text-3xl">Your cart is empty</p>
          <p className="mt-2 text-sm text-ink/65">Add pieces from the shop to start your order.</p>
          {!isAuthenticated ? <p className="mt-2 text-xs uppercase tracking-[0.14em] text-orange">Guests can browse freely and sign in later to sync their cart.</p> : null}
          <Link to="/shop" className="mt-4 inline-block rounded-full bg-orange px-6 py-3 text-xs uppercase tracking-[0.16em]">Shop now</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {cart.map((item) => (
              <article key={item._id} className="grid grid-cols-[96px_1fr] gap-4 rounded-2xl border border-black/10 bg-white p-4">
                <img src={item.images?.[0]?.url} alt={item.name} className="h-24 w-24 rounded-xl object-cover" />
                <div>
                  <h2 className="font-display text-3xl">{item.name}</h2>
                  <p className="text-sm text-ink/65">${item.discountPrice || item.price}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={() => setCartQuantity(item._id, item.quantity - 1)} className="h-8 w-8 rounded-full border border-ink">-</button>
                    <span className="min-w-8 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => setCartQuantity(item._id, item.quantity + 1)} className="h-8 w-8 rounded-full border border-ink">+</button>
                    <button onClick={() => removeFromCart(item._id)} className="ml-3 text-xs uppercase tracking-[0.14em] text-orange">Remove</button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="h-fit rounded-2xl border border-black/10 bg-white p-5">
            <h3 className="font-display text-3xl">Order Summary</h3>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span>Subtotal</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span>Shipping</span>
              <span>$0.00</span>
            </div>
            <div className="mt-4 border-t border-black/10 pt-4 text-sm font-semibold">
              <div className="flex items-center justify-between">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </div>
            <button onClick={() => navigate('/account')} className="mt-6 w-full rounded-full bg-ink px-4 py-3 text-xs uppercase tracking-[0.16em] text-white">Proceed to Checkout</button>
          </aside>
        </div>
      )}
    </div>
  )
}
