/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useCallback, useState } from 'react'
import { api } from '../services/api'
import { useAuth } from './AuthContext'

const ShopContext = createContext(null)

export const ShopProvider = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [cart, setCart] = useState([])
  const [wishlist, setWishlist] = useState([])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    Promise.all([api.get('/users/wishlist'), api.get('/users/cart')])
      .then(([wishlistRes, cartRes]) => {
        setWishlist(wishlistRes.data?.products || [])
        const mappedCart = (cartRes.data?.items || []).map((entry) => ({
          ...(entry.product || {}),
          quantity: entry.quantity,
        }))
        setCart(mappedCart)
      })
      .catch(() => {
        setWishlist([])
      })
  }, [isAuthenticated])

  const addToCart = useCallback((product, quantity = 1) => {
    if (isAuthenticated) {
      api.post('/users/cart', { productId: product._id, quantity }).then((res) => {
        const mapped = (res.data?.items || []).map((entry) => ({ ...(entry.product || {}), quantity: entry.quantity }))
        setCart(mapped)
      }).catch(() => {})
    }

    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id)
      if (existing) {
        return prev.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }
      return [...prev, { ...product, quantity }]
    })
  }, [isAuthenticated])

  const removeFromCart = useCallback((productId) => {
    if (isAuthenticated) {
      api.delete(`/users/cart/${productId}`).then((res) => {
        const mapped = (res.data?.items || []).map((entry) => ({ ...(entry.product || {}), quantity: entry.quantity }))
        setCart(mapped)
      }).catch(() => {})
    }

    setCart((prev) => prev.filter((item) => item._id !== productId))
  }, [isAuthenticated])

  const setCartQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    if (isAuthenticated) {
      api.patch('/users/cart', { productId, quantity }).then((res) => {
        const mapped = (res.data?.items || []).map((entry) => ({ ...(entry.product || {}), quantity: entry.quantity }))
        setCart(mapped)
      }).catch(() => {})
    }

    setCart((prev) => prev.map((item) => (item._id === productId ? { ...item, quantity } : item)))
  }, [isAuthenticated, removeFromCart])

  const toggleWishlist = useCallback((product) => {
    if (isAuthenticated) {
      api.post('/users/wishlist/toggle', { productId: product._id }).then((res) => {
        setWishlist(res.data?.products || [])
      }).catch(() => {})
    }

    setWishlist((prev) => {
      const exists = prev.find((item) => item._id === product._id)
      return exists ? prev.filter((item) => item._id !== product._id) : [...prev, product]
    })
  }, [isAuthenticated])

  const value = useMemo(
    () => ({
      cart,
      wishlist,
      addToCart,
      removeFromCart,
      setCartQuantity,
      toggleWishlist,
      cartTotal: cart.reduce((sum, item) => sum + (item.discountPrice || item.price) * item.quantity, 0),
    }),
    [cart, wishlist, addToCart, removeFromCart, setCartQuantity, toggleWishlist],
  )

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export const useShop = () => {
  const ctx = useContext(ShopContext)
  if (!ctx) {
    throw new Error('useShop must be used within ShopProvider')
  }
  return ctx
}
