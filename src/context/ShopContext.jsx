import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { api } from '../services/api'

const ShopContext = createContext(null)

export function ShopProvider({ children }) {
  const [cart, setCart] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [loading] = useState(false)

  const fetchCart = useCallback(async () => {
    try {
      const res = await api.get('/cart')
      setCart(res.data || [])
    } catch {
      setCart([])
    }
  }, [])

  const fetchWishlist = useCallback(async () => {
    try {
      const res = await api.get('/wishlist')
      setWishlist(res.data || [])
    } catch {
      setWishlist([])
    }
  }, [])

  useEffect(() => {
    fetchCart()
    fetchWishlist()
  }, [fetchCart, fetchWishlist])

  const addToCart = useCallback(async (product, variant, quantity = 1) => {
    const res = await api.post('/cart', { productId: product._id, variantId: variant?._id, quantity })
    setCart(res.data || [])
    return res.data
  }, [])

  const removeFromCart = useCallback(async (productId, variantId) => {
    const res = await api.delete(`/cart/${productId}`, { data: { variantId } })
    setCart(res.data || [])
    return res.data
  }, [])

  const setCartQuantity = useCallback(async (productId, quantity, variantId) => {
    const res = await api.patch(`/cart/${productId}`, { quantity, variantId })
    setCart(res.data || [])
    return res.data
  }, [])

  const clearCart = useCallback(async () => {
    await api.delete('/cart')
    setCart([])
  }, [])

  const addToWishlist = useCallback(async (productId) => {
    const res = await api.post('/wishlist', { productId })
    setWishlist(res.data || [])
    return res.data
  }, [])

  const removeFromWishlist = useCallback(async (productId) => {
    const res = await api.delete(`/wishlist/${productId}`)
    setWishlist(res.data || [])
    return res.data
  }, [])

  const toggleWishlist = useCallback(async (product) => {
    const isInWishlist = wishlist.some((item) => item._id === product._id)
    if (isInWishlist) {
      await removeFromWishlist(product._id)
    } else {
      await addToWishlist(product._id)
    }
  }, [wishlist, addToWishlist, removeFromWishlist])

  const value = useMemo(
    () => ({
      cart,
      wishlist,
      loading,
      addToCart,
      removeFromCart,
      setCartQuantity,
      clearCart,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      fetchCart,
      fetchWishlist,
    }),
    [cart, wishlist, loading, addToCart, removeFromCart, setCartQuantity, clearCart, addToWishlist, removeFromWishlist, toggleWishlist, fetchCart, fetchWishlist],
  )

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  const ctx = useContext(ShopContext)
  if (!ctx) {
    throw new Error('useShop must be used within ShopProvider')
  }
  return ctx
}