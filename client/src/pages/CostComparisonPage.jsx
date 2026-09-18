import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import DashboardShell from '../components/dashboard/DashboardShell.jsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import Spinner from '../components/Spinner.jsx'
import CartDrawer from '../components/materials/CartDrawer.jsx'
import ProductImage from '../components/materials/ProductImage.jsx'
import { CartIcon, SearchIcon, CheckCircleIcon, LocationIcon, StarIcon, TruckIcon } from '../components/materials/materialIcons.jsx'
import { apiFetch } from '../utils/api.js'

function formatPrice(n) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function hashString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

// Illustrative only — we don't track real customer reviews yet, so this is
// a deterministic stand-in derived from the listing id (same id always shows
// the same count, rather than a random number that changes on every render).
function reviewCountFor(id) {
  return 20 + (hashString(id) % 480)
}

// We don't have a real delivery-charge field on shops — flat placeholder
// used consistently across the comparison cards and the cost calculator.
const DELIVERY_CHARGE = 50

const SORT_OPTIONS = [
  { value: 'lowestPrice', label: 'Lowest Price' },
  { value: 'highestRated', label: 'Highest Rated' },
  { value: 'fastestDelivery', label: 'Fastest Delivery' },
  { value: 'bestValue', label: 'Best Value' },
]

const MAX_COMPARE = 4

function CostComparisonPage() {
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [categoryFilters, setCategoryFilters] = useState(new Set())
  const [locationFilter, setLocationFilter] = useState('all')
  const [minRating, setMinRating] = useState(0)
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [deliveryOnly, setDeliveryOnly] = useState(false)
  const [sortBy, setSortBy] = useState('lowestPrice')
  const [compareIds, setCompareIds] = useState(new Set())
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [viewListing, setViewListing] = useState(null)
  const [calcListingId, setCalcListingId] = useState(null)
  const [calcQuantity, setCalcQuantity] = useState(1)

  const [cart, setCart] = useState({})
  const [cartOpen, setCartOpen] = useState(false)
  const [placingShopId, setPlacingShopId] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiFetch('/api/materials/shops')
        setShops(data.shops)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const listings = useMemo(
    () =>
      shops.flatMap((shop) =>
        shop.products.map((p) => ({
          ...p,
          shopId: shop.id,
          shopName: shop.name,
          shopAddress: shop.address,
          shopCategory: shop.category,
          shopLocation: shop.location,
          shopRating: shop.rating,
          shopDistanceKm: shop.distanceKm,
          shopDeliveryAvailable: shop.deliveryAvailable,
          shopDeliveryEtaHours: shop.deliveryEtaHours,
        }))
      ),
    [shops]
  )
  const listingById = useMemo(() => new Map(listings.map((l) => [l.id, l])), [listings])

  const categories = useMemo(() => [...new Set(shops.map((s) => s.category))].sort(), [shops])
  const locations = useMemo(() => [...new Set(shops.map((s) => s.location))].sort(), [shops])

  const min = priceMin.trim() === '' ? null : Number(priceMin)
  const max = priceMax.trim() === '' ? null : Number(priceMax)

  const filteredListings = useMemo(() => {
    const q = query.trim().toLowerCase()
    let result = listings.filter((l) => {
      if (q && !l.name.toLowerCase().includes(q) && !l.shopCategory.toLowerCase().includes(q) && !l.shopName.toLowerCase().includes(q)) return false
      if (categoryFilters.size > 0 && !categoryFilters.has(l.shopCategory)) return false
      if (locationFilter !== 'all' && l.shopLocation !== locationFilter) return false
      if (minRating > 0 && (l.shopRating ?? 0) < minRating) return false
      if (min !== null && l.price < min) return false
      if (max !== null && l.price > max) return false
      if (inStockOnly && l.stockStatus === 'out_of_stock') return false
      if (deliveryOnly && !l.shopDeliveryAvailable) return false
      return true
    })

    result = [...result].sort((a, b) => {
      if (sortBy === 'lowestPrice') return a.price - b.price
      if (sortBy === 'highestRated') return (b.shopRating ?? 0) - (a.shopRating ?? 0)
      if (sortBy === 'fastestDelivery') {
        if (a.shopDeliveryAvailable !== b.shopDeliveryAvailable) return a.shopDeliveryAvailable ? -1 : 1
        return (a.shopDeliveryEtaHours ?? 999) - (b.shopDeliveryEtaHours ?? 999)
      }
      // bestValue: rating per rupee, higher is better
      const scoreA = (a.shopRating ?? 3.5) / a.price
      const scoreB = (b.shopRating ?? 3.5) / b.price
      return scoreB - scoreA
    })
    return result
  }, [listings, query, categoryFilters, locationFilter, minRating, min, max, inStockOnly, deliveryOnly, sortBy])

  useEffect(() => {
    // Keep the calculator's selection in sync with the currently filtered
    // list — otherwise changing search/filters can leave it silently
    // pointing at a product that's no longer shown anywhere on the page.
    if (filteredListings.length === 0) return
    const stillVisible = filteredListings.some((l) => l.id === calcListingId)
    if (!stillVisible) setCalcListingId(filteredListings[0].id)
  }, [filteredListings, calcListingId])

  const toggleCategory = (cat) => {
    setCategoryFilters((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const clearFilters = () => {
    setCategoryFilters(new Set())
    setLocationFilter('all')
    setMinRating(0)
    setPriceMin('')
    setPriceMax('')
    setInStockOnly(false)
    setDeliveryOnly(false)
  }

  const toggleCompare = (id) => {
    setCompareIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < MAX_COMPARE) next.add(id)
      return next
    })
  }

  const increment = (productId) => setCart((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }))
  const decrement = (productId) =>
    setCart((prev) => {
      const next = { ...prev }
      const qty = (next[productId] || 0) - 1
      if (qty <= 0) delete next[productId]
      else next[productId] = qty
      return next
    })

  const cartGroups = useMemo(() => {
    const groups = new Map()
    for (const [productId, quantity] of Object.entries(cart)) {
      if (quantity <= 0) continue
      const listing = listingById.get(productId)
      if (!listing) continue
      if (!groups.has(listing.shopId)) groups.set(listing.shopId, { shopId: listing.shopId, shopName: listing.shopName, items: [], subtotal: 0 })
      const group = groups.get(listing.shopId)
      group.items.push({ ...listing, quantity })
      group.subtotal += listing.price * quantity
    }
    return [...groups.values()]
  }, [cart, listingById])

  const cartCount = Object.values(cart).reduce((sum, q) => sum + q, 0)
  const cartTotal = cartGroups.reduce((sum, g) => sum + g.subtotal, 0)

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3200)
  }

  const handlePlaceOrder = async (shopId) => {
    const group = cartGroups.find((g) => g.shopId === shopId)
    if (!group) return
    setPlacingShopId(shopId)
    try {
      const data = await apiFetch('/api/materials/orders', {
        method: 'POST',
        body: JSON.stringify({ shopId, items: group.items.map((i) => ({ productId: i.id, quantity: i.quantity })) }),
      })
      setCart((prev) => {
        const next = { ...prev }
        for (const item of group.items) delete next[item.id]
        return next
      })
      showToast(`Order placed with ${group.shopName} — check Calendar for delivery`)
      void data
    } catch (err) {
      showToast(err.message)
    } finally {
      setPlacingShopId(null)
    }
  }

  const handleBuyNow = async (listing) => {
    setPlacingShopId(listing.shopId)
    try {
      await apiFetch('/api/materials/orders', {
        method: 'POST',
        body: JSON.stringify({ shopId: listing.shopId, items: [{ productId: listing.id, quantity: 1 }] }),
      })
      showToast(`Order placed for ${listing.name} — check Calendar for delivery`)
    } catch (err) {
      showToast(err.message)
    } finally {
      setPlacingShopId(null)
    }
  }

  const calcListing = calcListingId ? listingById.get(calcListingId) : null
  const calcSubtotal = calcListing ? calcListing.price * calcQuantity : 0
  const calcDelivery = calcListing?.shopDeliveryAvailable ? DELIVERY_CHARGE : 0
  const calcTotal = calcSubtotal + calcDelivery

  return (
    <DashboardShell>
      {({ onMenuClick }) => (
        <>
          <DashboardHeader
            onMenuClick={onMenuClick}
            title="Material Cost Comparison"
            subtitle="Compare material prices and choose cost-effective options."
          />

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px] flex-1">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search materials, brands, suppliers..."
                className="w-full rounded-full border border-ink/15 bg-navy-900/60 py-2.5 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-gold-500/50"
              />
            </div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="rounded-full border border-ink/15 bg-navy-900/60 px-3.5 py-2.5 text-xs font-medium text-ink outline-none focus:border-gold-500/50"
            >
              <option value="all">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-full border border-ink/15 bg-navy-900/60 px-3.5 py-2.5 text-xs font-medium text-ink outline-none focus:border-gold-500/50"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-1.5 rounded-full bg-gold-500 px-4 py-2.5 text-xs font-semibold text-charcoal hover:bg-gold-400"
            >
              <CartIcon className="h-4 w-4" /> Cart
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors duration-150 ${
                  sortBy === opt.value ? 'border-gold-500/50 bg-gold-500/10 text-gold-300' : 'border-ink/10 text-ink/60 hover:border-ink/20'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {error && <p className="mt-5 text-sm text-red-400">{error}</p>}

          {loading ? (
            <div className="mt-16 flex justify-center">
              <Spinner className="h-6 w-6 text-ink/40" />
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[220px_1fr_280px]">
              {/* Filters sidebar */}
              <div className="rounded-2xl border border-ink/10 bg-navy-900/50 p-4 xl:order-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">Filters</p>
                  <button onClick={clearFilters} className="text-xs font-medium text-gold-300 hover:text-gold-200">Clear All</button>
                </div>

                <p className="mt-4 text-xs font-medium uppercase tracking-wider text-ink/40">Category ({categories.length})</p>
                <div className="mt-2 max-h-48 space-y-1.5 overflow-y-auto">
                  {categories.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 text-sm text-ink/70">
                      <input
                        type="checkbox"
                        checked={categoryFilters.has(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="h-3.5 w-3.5 rounded border-ink/20 bg-navy-900 accent-gold-500"
                      />
                      {cat}
                    </label>
                  ))}
                </div>

                <p className="mt-4 text-xs font-medium uppercase tracking-wider text-ink/40">Price Range</p>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    placeholder="Min"
                    className="w-full rounded-lg border border-ink/10 bg-navy-950/40 px-2.5 py-1.5 text-xs text-ink outline-none placeholder:text-ink/35"
                  />
                  <span className="text-ink/30">–</span>
                  <input
                    type="number"
                    min="0"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    placeholder="Max"
                    className="w-full rounded-lg border border-ink/10 bg-navy-950/40 px-2.5 py-1.5 text-xs text-ink outline-none placeholder:text-ink/35"
                  />
                </div>

                <p className="mt-4 text-xs font-medium uppercase tracking-wider text-ink/40">Rating</p>
                <div className="mt-2 space-y-1">
                  {[4.5, 4, 3.5].map((r) => (
                    <label key={r} className="flex items-center gap-2 text-sm text-ink/70">
                      <input
                        type="radio"
                        name="minRating"
                        checked={minRating === r}
                        onChange={() => setMinRating(r)}
                        className="h-3.5 w-3.5 accent-gold-500"
                      />
                      <span className="flex items-center gap-1">
                        <StarIcon className="h-3.5 w-3.5 text-gold-300" /> {r}+ &amp; up
                      </span>
                    </label>
                  ))}
                  <label className="flex items-center gap-2 text-sm text-ink/70">
                    <input
                      type="radio"
                      name="minRating"
                      checked={minRating === 0}
                      onChange={() => setMinRating(0)}
                      className="h-3.5 w-3.5 accent-gold-500"
                    />
                    Any rating
                  </label>
                </div>

                <div className="mt-4 space-y-2 border-t border-ink/10 pt-3">
                  <label className="flex items-center gap-2 text-sm text-ink/70">
                    <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="h-3.5 w-3.5 rounded border-ink/20 bg-navy-900 accent-gold-500" />
                    In Stock Only
                  </label>
                  <label className="flex items-center gap-2 text-sm text-ink/70">
                    <input type="checkbox" checked={deliveryOnly} onChange={(e) => setDeliveryOnly(e.target.checked)} className="h-3.5 w-3.5 rounded border-ink/20 bg-navy-900 accent-gold-500" />
                    Delivery Available
                  </label>
                </div>
              </div>

              {/* Product grid */}
              <div className="xl:order-2">
                <p className="text-xs text-ink/40">Showing {filteredListings.length} result{filteredListings.length === 1 ? '' : 's'}{query ? ` for "${query}"` : ''}</p>

                {filteredListings.length === 0 ? (
                  <p className="mt-10 text-center text-sm text-ink/40">No materials match your filters.</p>
                ) : (
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                    {filteredListings.slice(0, 60).map((listing, i) => {
                      const quantity = cart[listing.id] || 0
                      const outOfStock = listing.stockStatus === 'out_of_stock'
                      const isComparing = compareIds.has(listing.id)
                      return (
                        <motion.div
                          key={listing.id}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.2) }}
                          className="flex flex-col gap-2.5 rounded-2xl border border-ink/10 bg-navy-900/50 p-4"
                        >
                          <div className="flex items-start justify-between">
                            <label className="flex items-center gap-1.5 text-[11px] text-ink/50">
                              <input
                                type="checkbox"
                                checked={isComparing}
                                onChange={() => toggleCompare(listing.id)}
                                disabled={!isComparing && compareIds.size >= MAX_COMPARE}
                                className="h-3.5 w-3.5 rounded border-ink/20 bg-navy-900 accent-gold-500"
                              />
                              Compare
                            </label>
                            {sortBy === 'lowestPrice' && i === 0 && (
                              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Lowest Price</span>
                            )}
                          </div>

                          <ProductImage product={listing} className="h-28 w-full rounded-xl object-cover" />

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gold-300/80">{listing.shopName}</p>
                            <p className="mt-0.5 text-sm text-ink/90">{listing.name}</p>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-ink/50">
                            {listing.shopRating != null && (
                              <span className="flex items-center gap-1">
                                <StarIcon className="h-3.5 w-3.5 text-gold-300" /> {listing.shopRating.toFixed(1)}
                              </span>
                            )}
                            <span>({reviewCountFor(listing.id)} reviews)</span>
                          </div>

                          <p className="font-display text-lg font-semibold text-gold-300">
                            {formatPrice(listing.price)} <span className="text-xs font-normal text-ink/40">/ {listing.unit}</span>
                          </p>

                          <span
                            className={`inline-block w-fit rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              outOfStock ? 'bg-red-500/10 text-red-300' : listing.stockStatus === 'low_stock' ? 'bg-amber-500/10 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'
                            }`}
                          >
                            {outOfStock ? 'Out of stock' : listing.stockStatus === 'low_stock' ? 'Low stock' : 'In stock'}
                          </span>

                          <div className="flex items-center gap-1.5 text-[11px] text-ink/45">
                            <TruckIcon className="h-3.5 w-3.5" />
                            {listing.shopDeliveryAvailable ? `Delivery in ~${listing.shopDeliveryEtaHours}h · ${formatPrice(DELIVERY_CHARGE)}` : 'Pickup only'}
                          </div>

                          <div className="mt-1 flex items-center gap-2">
                            <button
                              onClick={() => setViewListing(listing)}
                              className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/70 hover:border-ink/30 hover:text-ink"
                            >
                              View
                            </button>
                            {quantity === 0 ? (
                              <button
                                onClick={() => increment(listing.id)}
                                disabled={outOfStock}
                                className="flex-1 rounded-lg border border-gold-500/40 px-3 py-1.5 text-xs font-semibold text-gold-300 hover:bg-gold-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Add to Cart
                              </button>
                            ) : (
                              <div className="flex flex-1 items-center justify-center gap-2">
                                <button onClick={() => decrement(listing.id)} className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-500 text-charcoal hover:bg-gold-400">−</button>
                                <span className="w-4 text-center text-sm text-ink">{quantity}</span>
                                <button onClick={() => increment(listing.id)} disabled={outOfStock} className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-500 text-charcoal hover:bg-gold-400 disabled:opacity-40">+</button>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleBuyNow(listing)}
                            disabled={outOfStock || placingShopId === listing.shopId}
                            className="rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-charcoal hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Buy Now
                          </button>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Cost calculator */}
              <div className="rounded-2xl border border-ink/10 bg-navy-900/50 p-4 xl:order-3 xl:h-fit xl:sticky xl:top-6">
                <p className="text-sm font-semibold text-ink">Cost Calculator</p>
                <div className="mt-3">
                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-ink/40">Material</label>
                  <select
                    value={calcListingId || ''}
                    onChange={(e) => setCalcListingId(e.target.value)}
                    className="w-full rounded-lg border border-ink/15 bg-navy-950/40 px-2.5 py-2 text-xs text-ink outline-none"
                  >
                    {filteredListings.slice(0, 60).map((l) => (
                      <option key={l.id} value={l.id}>{l.shopName} — {l.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-3">
                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-ink/40">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={calcQuantity}
                    onChange={(e) => setCalcQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full rounded-lg border border-ink/15 bg-navy-950/40 px-2.5 py-2 text-xs text-ink outline-none"
                  />
                </div>
                {calcListing && (
                  <div className="mt-4 space-y-1.5 border-t border-ink/10 pt-3 text-xs text-ink/60">
                    <div className="flex justify-between"><span>Unit Price</span><span>{formatPrice(calcListing.price)}</span></div>
                    <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(calcSubtotal)}</span></div>
                    <div className="flex justify-between"><span>Delivery Charge</span><span>{calcDelivery ? formatPrice(calcDelivery) : 'Free'}</span></div>
                    <div className="mt-2 flex justify-between border-t border-ink/10 pt-2 text-sm font-semibold text-ink">
                      <span>Estimated Total</span>
                      <span className="text-gold-300">{formatPrice(calcTotal)}</span>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => calcListing && setCart((prev) => ({ ...prev, [calcListing.id]: (prev[calcListing.id] || 0) + calcQuantity }))}
                  disabled={!calcListing}
                  className="mt-4 w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-charcoal hover:bg-gold-400 disabled:opacity-50"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          )}

          <AnimatePresence>
            {compareIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 rounded-full border border-gold-500/30 bg-navy-900 px-5 py-3 text-sm shadow-2xl"
              >
                <span className="text-ink/70">Compare Selected Materials ({compareIds.size})</span>
                <button
                  onClick={() => setShowCompareModal(true)}
                  disabled={compareIds.size < 2}
                  className="rounded-full bg-gold-500 px-4 py-1.5 text-xs font-semibold text-charcoal disabled:opacity-40"
                >
                  Compare
                </button>
                <button onClick={() => setCompareIds(new Set())} className="text-xs text-ink/40 hover:text-ink/70">Clear</button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showCompareModal && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCompareModal(false)} className="fixed inset-0 z-40 bg-black/70" />
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="fixed inset-4 z-50 mx-auto flex max-w-4xl flex-col overflow-hidden rounded-2xl border border-ink/10 bg-navy-900 shadow-2xl sm:inset-x-8 sm:inset-y-10"
                >
                  <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
                    <p className="font-display text-sm font-semibold text-ink">Compare Materials</p>
                    <button onClick={() => setShowCompareModal(false)} className="text-ink/40 hover:text-ink">✕</button>
                  </div>
                  <div className="flex-1 overflow-auto p-5">
                    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${compareIds.size}, minmax(180px, 1fr))` }}>
                      {[...compareIds].map((id) => {
                        const l = listingById.get(id)
                        if (!l) return null
                        return (
                          <div key={id} className="rounded-xl border border-ink/10 bg-navy-950/40 p-3">
                            <ProductImage product={l} className="h-24 w-full rounded-lg object-cover" />
                            <p className="mt-2 text-xs font-medium text-gold-300/80">{l.shopName}</p>
                            <p className="text-sm text-ink/90">{l.name}</p>
                            <p className="mt-2 font-display text-base font-semibold text-gold-300">{formatPrice(l.price)} <span className="text-[10px] font-normal text-ink/40">/ {l.unit}</span></p>
                            <div className="mt-2 space-y-1 text-xs text-ink/55">
                              <p>Rating: {l.shopRating != null ? l.shopRating.toFixed(1) : 'N/A'}</p>
                              <p>Location: {l.shopLocation}</p>
                              <p>Stock: {l.stockStatus.replace('_', ' ')}</p>
                              <p>Delivery: {l.shopDeliveryAvailable ? `~${l.shopDeliveryEtaHours}h` : 'Pickup only'}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {viewListing && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewListing(null)} className="fixed inset-0 z-40 bg-black/70" />
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-ink/10 bg-navy-900 p-5 shadow-2xl"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gold-300/80">{viewListing.shopName}</p>
                      <p className="font-display text-base font-semibold text-ink">{viewListing.name}</p>
                    </div>
                    <button onClick={() => setViewListing(null)} className="text-ink/40 hover:text-ink">✕</button>
                  </div>
                  <ProductImage product={viewListing} className="mt-3 h-40 w-full rounded-xl object-cover" />
                  <p className="mt-3 font-display text-xl font-semibold text-gold-300">
                    {formatPrice(viewListing.price)} <span className="text-xs font-normal text-ink/40">/ {viewListing.unit}</span>
                  </p>
                  <div className="mt-3 space-y-1.5 text-sm text-ink/60">
                    <p className="flex items-center gap-1.5"><LocationIcon className="h-4 w-4 text-ink/40" /> {viewListing.shopAddress || viewListing.shopLocation}</p>
                    {viewListing.shopRating != null && <p className="flex items-center gap-1.5"><StarIcon className="h-4 w-4 text-gold-300" /> {viewListing.shopRating.toFixed(1)} ({reviewCountFor(viewListing.id)} reviews)</p>}
                    <p className="flex items-center gap-1.5"><TruckIcon className="h-4 w-4 text-ink/40" /> {viewListing.shopDeliveryAvailable ? `Delivery in ~${viewListing.shopDeliveryEtaHours}h` : 'Pickup only'}</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => { increment(viewListing.id); setViewListing(null) }} className="flex-1 rounded-lg border border-gold-500/40 px-3 py-2 text-sm font-semibold text-gold-300 hover:bg-gold-500/10">Add to Cart</button>
                    <button onClick={() => { handleBuyNow(viewListing); setViewListing(null) }} className="flex-1 rounded-lg bg-gold-500 px-3 py-2 text-sm font-semibold text-charcoal hover:bg-gold-400">Buy Now</button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <CartDrawer
            open={cartOpen}
            onClose={() => setCartOpen(false)}
            groups={cartGroups}
            onIncrement={increment}
            onDecrement={decrement}
            onPlaceOrder={handlePlaceOrder}
            placingShopId={placingShopId}
          />

          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 340, damping: 26 }}
                className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-gold-500/40 bg-navy-900 px-5 py-2.5 text-sm text-ink shadow-2xl"
              >
                <span className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-emerald-400" /> {toast}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </DashboardShell>
  )
}

export default CostComparisonPage
