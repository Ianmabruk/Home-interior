import { User } from '../models/User.js'
import { Wishlist } from '../models/Wishlist.js'
import { Product } from '../models/Product.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId)
    .populate('wishlist')
    .populate('cart.product')
    .select('-passwordHash -refreshToken')
  res.json(user)
})

export const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.userId,
    {
      fullName: req.body.fullName,
      phone: req.body.phone,
      addresses: req.body.addresses,
    },
    { new: true },
  ).select('-passwordHash -refreshToken')

  res.json(user)
})

export const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user.userId }).populate('products')
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user.userId, products: [] })
  }

  res.json(wishlist)
})

export const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body
  const product = await Product.findById(productId)
  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }

  let wishlist = await Wishlist.findOne({ user: req.user.userId })
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user.userId, products: [] })
  }

  const existing = wishlist.products.find((id) => id.toString() === productId)
  if (existing) {
    wishlist.products = wishlist.products.filter((id) => id.toString() !== productId)
  } else {
    wishlist.products.push(productId)
  }

  await wishlist.save()
  await wishlist.populate('products')
  res.json(wishlist)
})

export const getCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).populate('cart.product')
  const cart = user?.cart || []
  const total = cart.reduce(
    (sum, item) => sum + (item.product?.discountPrice || item.product?.price || 0) * item.quantity,
    0,
  )

  res.json({ items: cart, total })
})

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body
  const product = await Product.findById(productId)
  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }

  const user = await User.findById(req.user.userId)
  const existing = user.cart.find((entry) => entry.product.toString() === productId)

  if (existing) {
    existing.quantity += Number(quantity)
  } else {
    user.cart.push({ product: productId, quantity: Number(quantity) })
  }

  await user.save()
  await user.populate('cart.product')

  const total = user.cart.reduce(
    (sum, item) => sum + (item.product?.discountPrice || item.product?.price || 0) * item.quantity,
    0,
  )

  res.json({ items: user.cart, total })
})

export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body
  const safeQuantity = Number(quantity)

  const user = await User.findById(req.user.userId)
  const existing = user.cart.find((entry) => entry.product.toString() === productId)
  if (!existing) {
    return res.status(404).json({ message: 'Cart item not found' })
  }

  if (safeQuantity <= 0) {
    user.cart = user.cart.filter((entry) => entry.product.toString() !== productId)
  } else {
    existing.quantity = safeQuantity
  }

  await user.save()
  await user.populate('cart.product')

  const total = user.cart.reduce(
    (sum, item) => sum + (item.product?.discountPrice || item.product?.price || 0) * item.quantity,
    0,
  )

  res.json({ items: user.cart, total })
})

export const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params
  const user = await User.findById(req.user.userId)

  user.cart = user.cart.filter((entry) => entry.product.toString() !== productId)
  await user.save()
  await user.populate('cart.product')

  const total = user.cart.reduce(
    (sum, item) => sum + (item.product?.discountPrice || item.product?.price || 0) * item.quantity,
    0,
  )

  res.json({ items: user.cart, total })
})
