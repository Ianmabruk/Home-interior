import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'

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
  const [loading] = useState(false)

  const fetchCart = useCallback(async () => {
    setCart(getLocalCart())
  }, [])

  const fetchWishlist = useCallback(async () => {
    setWishlist(getLocalWishlist())
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
  }, [])

  const removeFromCart = useCallback(async (productId, variant) => {
    const local = getLocalCart().filter(
      (item) => !(item._id === productId && JSON.stringify(item.selectedVariant) === JSON.stringify(variant))
    )
    setLocalCart(local)
    setCart(local)
    return local
  }, [])

  const setCartQuantity = useCallback(async (productId, quantity, variant) => {
    if (quantity <= 0) {
      return removeFromCart(productId, variant)
    }

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
  }, [removeFromCart])

  const clearCart = useCallback(async () => {
    setLocalCart([])
    setCart([])
  }, [])

  const addToWishlist = useCallback(async (productId) => {
    const local = getLocalWishlist()
    if (!local.some((item) => item._id === productId)) {
      local.push({ _id: productId, id: productId })
      setLocalWishlist(local)
      setWishlist(local)
    }
    return local
  }, [])

  const removeFromWishlist = useCallback(async (productId) => {
    const local = getLocalWishlist().filter((item) => item._id !== productId)
    setLocalWishlist(local)
    setWishlist(local)
    return local
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
