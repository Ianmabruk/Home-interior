import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { api } from '../services/api'
import { useAuth } from './AuthContext'

const ShopContext = createContext(null)

export function ShopProvider({ children }) {
  const [cart, setCart] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [loading] = useState(false)
  const { isAuthenticated } = useAuth()

  const fetchCart = useCallback(async () => {
    try {
      const res = await api.get('/users/cart')
      setCart(Array.isArray(res.data) ? res.data : [])
    } catch {
      setCart([])
    }
  }, [])

  const fetchWishlist = useCallback(async () => {
    try {
      const res = await api.get('/users/wishlist')
      setWishlist(Array.isArray(res.data) ? res.data : [])
    } catch {
      setWishlist([])
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    fetchCart()
    fetchWishlist()
  }, [isAuthenticated, fetchCart, fetchWishlist])

  const addToCart = useCallback(async (product, variant, quantity = 1) => {
    const res = await api.post('/users/cart', { productId: product._id, variant, quantity })
    setCart(Array.isArray(res.data) ? res.data : [])
    return res.data
  }, [])

  const removeFromCart = useCallback(async (productId, variant) => {
    const res = await api.delete(`/users/cart/${productId}`, { data: { variant } })
    setCart(Array.isArray(res.data) ? res.data : [])
    return res.data
  }, [])

  const setCartQuantity = useCallback(async (productId, quantity, variant) => {
    const res = await api.patch(`/users/cart/${productId}`, { quantity, variant })
    setCart(Array.isArray(res.data) ? res.data : [])
    return res.data
  }, [])

  const clearCart = useCallback(async () => {
    await api.delete('/users/cart')
    setCart([])
  }, [])

  const addToWishlist = useCallback(async (productId) => {
    const res = await api.post('/users/wishlist', { productId })
    setWishlist(Array.isArray(res.data) ? res.data : [])
    return res.data
  }, [])

  const removeFromWishlist = useCallback(async (productId) => {
    const res = await api.delete(`/users/wishlist/${productId}`)
    setWishlist(Array.isArray(res.data) ? res.data : [])
    return res.data
  }, [])

  const toggleWishlist = useCallback(async (product) => {
    const inWishlist = Array.isArray(wishlist) && wishlist.some((item) => item._id === product._id)
    if (inWishlist) {
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
    [cart, wishlist, loading, addToCart, removeFromCart, setCartQuantity, clearCart, addToWishlist, removeFromWishlist, toggleWishlist, fetchCart, fetchWishlist]
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