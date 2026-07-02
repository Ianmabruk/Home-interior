import { BedDouble, BriefcaseBusiness, Building2, Lamp, Sparkles, Sofa, TreePalm, UtensilsCrossed } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ProductCard } from '../../components/shop/ProductCard'
import { api } from '../../services/api'
import { SHOP_CATEGORIES } from '../../utils/constants'

export const ShopPage = () => {
  const [allProducts, setAllProducts] = useState([])
  const [category, setCategory] = useState('')
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  useEffect(() => {
    api
      .get('/products', { params: { sort: '-createdAt', limit: 100 } })
      .then((res) => {
        setAllProducts(res.data.items || [])
      })
      .catch(() => {
        setAllProducts([])
      })
  }, [])

  const products = useMemo(() => {
    let next = [...allProducts]

    if (query) {
      const q = query.toLowerCase()
      next = next.filter((item) => [item.name, item.description, item.category, item.sku].join(' ').toLowerCase().includes(q))
    }

    if (category) {
      next = next.filter((item) => item.category === category)
    }

    if (minPrice) {
      next = next.filter((item) => (item.discountPrice || item.price) >= Number(minPrice))
    }

    if (maxPrice) {
      next = next.filter((item) => (item.discountPrice || item.price) <= Number(maxPrice))
    }

    next.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return next
  }, [allProducts, category, query, minPrice, maxPrice])

  const categoryIcons = {
    'Living Room': Sofa,
    Kitchen: UtensilsCrossed,
    Bedroom: BedDouble,
    Dining: UtensilsCrossed,
    Outdoor: TreePalm,
    Commercial: Building2,
    Decor: Sparkles,
    Lighting: Lamp,
    Office: BriefcaseBusiness,
    'Custom Designs': Sparkles,
  }

  const selectedIcon = categoryIcons[category] || Sparkles
  const SelectedIcon = selectedIcon

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <h1 className="font-display text-5xl">Shop Collection</h1>
      <div className="mt-6 rounded-2xl border border-black/10 bg-white p-4 md:p-6">
        <div className="grid gap-3 md:grid-cols-4">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search curated products..." className="rounded-xl border border-black/15 bg-cream px-4 py-3 text-sm md:col-span-2" />
          <div className="relative">
            <button
              type="button"
              onClick={() => setCategoryOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-xl border border-black/15 bg-cream px-3 py-3 text-sm"
            >
              <span className="flex items-center gap-2">
                <SelectedIcon size={16} />
                {category || 'All Categories'}
              </span>
              <span className="text-xs text-ink/60">{categoryOpen ? 'Close' : 'Open'}</span>
            </button>

            {categoryOpen ? (
              <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-black/10 bg-white p-1 shadow-soft">
                <button
                  type="button"
                  onClick={() => {
                    setCategory('')
                    setCategoryOpen(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-cream"
                >
                  <Sparkles size={16} />
                  All Categories
                </button>
                {SHOP_CATEGORIES.map((item) => {
                  const Icon = categoryIcons[item] || Sparkles
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setCategory(item)
                        setCategoryOpen(false)
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-cream"
                    >
                      <Icon size={16} />
                      {item}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
          <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min price" className="rounded-xl border border-black/15 bg-cream px-3 py-3 text-sm" />
          <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max price" className="rounded-xl border border-black/15 bg-cream px-3 py-3 text-sm" />
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  )
}
