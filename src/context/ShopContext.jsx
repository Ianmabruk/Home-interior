import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { api } from '../services/api'
import { useAuth } from './AuthContext'

const ShopContext = createContext(null)
const LOCAL_CART_KEY = 'hok_local_cart'
const LOCAL_WISHLIST_KEY = 'hok_local_wishlist'

const getLocalCart = () => {
  try {
    const raw = localStorage.getItem(LOCAL_CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const setLocalCart = (items) => {
  localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items))
}

const getLocalWishlist = () => {
  try {
    const raw = localStorage.getItem(LOCAL_WISHLIST_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const setLocalWishlist = (items) => {
  localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(items))
}

export function ShopProvider({ children }) {
  const [cart, setCart] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(false)
  const { isAuthenticated } = useAuth()
  const isAuthRef = useRef(isAuthenticated)
  useEffect(() => {
    isAuthRef.current = isAuthenticated
  }, [isAuthenticated])

  const fetchCart = useCallback(async () => {
    if (!isAuthRef.current) {
      setCart(getLocalCart())
      return
    }
    try {
      const res = await api.get('/users/cart')
      const items = Array.isArray(res.data) ? res.data : (res.data?.items || [])
      setCart(items)
      setLocalCart(items)
    } catch {
      setCart(getLocalCart())
    }
  }, [])

  const fetchWishlist = useCallback(async () => {
    if (!isAuthRef.current) {
      setWishlist(getLocalWishlist())
      return
    }
    try {
      const res = await api.get('/users/wishlist')
      setWishlist(Array.isArray(res.data) ? res.data : [])
    } catch {
      setWishlist(getLocalWishlist())
    }
  }, [])

  useEffect(() => {
    fetchCart()
    fetchWishlist()
  }, [fetchCart, fetchWishlist])

  const addToCart = useCallback(async (product, variant, quantity = 1) => {
    const cartItem = {
      _id: product._id,
      id: product._id,
      name: product.name,
      category: product.category || '',
      image: product.images?.[0] || product.mainImage || '',
      selectedVariant: variant || null,
      quantity,
      price: variant?.price || product.discountPrice || product.price || 0,
      discountPrice: product.discountPrice || null,
    }

    if (!isAuthenticated) {
      const local = getLocalCart()
      const existingIndex = local.findIndex(
        (item) => item._id === cartItem._id && JSON.stringify(item.selectedVariant) === JSON.stringify(cartItem.selectedVariant)
      )
      if (existingIndex >= 0) {
        local[existingIndex].quantity += quantity
      } else {
        local.push(cartItem)
      }
      setLocalCart(local)
      setCart(local)
      return local
    }

    setLoading(true)
    try {
      const res = await api.post('/users/cart', { productId: product._id, variant, quantity })
      const items = Array.isArray(res.data) ? res.data : (res.data?.items || [])
      setCart(items)
      setLocalCart(items)
      return items
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  const removeFromCart = useCallback(async (productId, variant) => {
    if (!isAuthenticated) {
      const local = getLocalCart().filter(
        (item) => !(item._id === productId && JSON.stringify(item.selectedVariant) === JSON.stringify(variant))
      )
      setLocalCart(local)
      setCart(local)
      return local
    }

    setLoading(true)
    try {
      const res = await api.delete(`/users/cart/${productId}`, { data: { variant } })
      const items = Array.isArray(res.data) ? res.data : (res.data?.items || [])
      setCart(items)
      setLocalCart(items)
      return items
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  const setCartQuantity = useCallback(async (productId, quantity, variant) => {
    if (quantity <= 0) {
      return removeFromCart(productId, variant)
    }

    if (!isAuthenticated) {
      const local = getLocalCart()
      const idx = local.findIndex(
        (item) => item._id === productId && JSON.stringify(item.selectedVariant) === JSON.stringify(variant)
      )
      if (idx >= 0) {
        local[idx].quantity = quantity
        setLocalCart(local)
        setCart(local)
      }
      return local
    }

    setLoading(true)
    try {
      const res = await api.patch(`/users/cart/${productId}`, { quantity, variant })
      const items = Array.isArray(res.data) ? res.data : (res.data?.items || [])
      setCart(items)
      setLocalCart(items)
      return items
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, removeFromCart])

  const clearCart = useCallback(async () => {
    setLocalCart([])
    setCart([])
    if (isAuthenticated) {
      try {
        await api.delete('/users/cart')
      } catch {
        // ignore
      }
    }
  }, [isAuthenticated])

  const mergeLocalCart = useCallback(async () => {
    if (!isAuthenticated) return
    const local = getLocalCart()
    if (local.length === 0) return

    for (const item of local) {
      try {
        await api.post('/users/cart', {
          productId: item._id,
          variant: item.selectedVariant,
          quantity: item.quantity,
        })
      } catch {
        // ignore merge errors
      }
    }
    setLocalCart([])
    await fetchCart()
  }, [isAuthenticated, fetchCart])

  const addToWishlist = useCallback(async (productId) => {
    if (!isAuthenticated) {
      const local = getLocalWishlist()
      if (!local.some((item) => item._id === productId)) {
        local.push({ _id: productId, id: productId })
        setLocalWishlist(local)
        setWishlist(local)
      }
      return local
    }

    const res = await api.post('/users/wishlist', { productId })
    setWishlist(Array.isArray(res.data) ? res.data : [])
    return res.data
  }, [isAuthenticated])

  const removeFromWishlist = useCallback(async (productId) => {
    if (!isAuthenticated) {
      const local = getLocalWishlist().filter((item) => item._id !== productId)
      setLocalWishlist(local)
      setWishlist(local)
      return local
    }

    const res = await api.delete(`/users/wishlist/${productId}`)
    setWishlist(Array.isArray(res.data) ? res.data : [])
    return res.data
  }, [isAuthenticated])

  const toggleWishlist = useCallback(async (product) => {
    const inWishlist = Array.isArray(wishlist) && wishlist.some((item) => item._id === product._id)
    if (inWishlist) {
      await removeFromWishlist(product._id)
    } else {
      await addToWishlist(product._id)
    }
  }, [wishlist, addToWishlist, removeFromWishlist])

  useEffect(() => {
    if (isAuthenticated) {
      mergeLocalCart()
    }
  }, [isAuthenticated, mergeLocalCart])

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
      mergeLocalCart,
    }),
    [cart, wishlist, loading, addToCart, removeFromCart, setCartQuantity, clearCart, addToWishlist, removeFromWishlist, toggleWishlist, fetchCart, fetchWishlist, mergeLocalCart]
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
