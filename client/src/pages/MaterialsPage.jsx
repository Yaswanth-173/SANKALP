import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import DashboardShell from '../components/dashboard/DashboardShell.jsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import Spinner from '../components/Spinner.jsx'
import CartDrawer from '../components/materials/CartDrawer.jsx'
import ProductImage from '../components/materials/ProductImage.jsx'
import { ShopIcon, CartIcon, SearchIcon, CheckCircleIcon, LocationIcon, StarIcon, TruckIcon } from '../components/materials/materialIcons.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../utils/api.js'
import { ALL_LOCATIONS } from '../data/indianCities.js'

function formatPrice(n) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

// Nominatim sometimes returns a different name than what our shop directory
// uses for the same city — map the common ones onto our list.
const CITY_ALIASES = {
  bangalore: 'Bengaluru',
  bombay: 'Mumbai',
  'new delhi': 'Delhi',
  calcutta: 'Kolkata',
  mysore: 'Mysuru',
  benares: 'Varanasi',
  gurgaon: 'Gurugram',
}

function matchCityFromAddress(address) {
  if (!address) return null
  const candidates = [address.city, address.town, address.village, address.county, address.state_district, address.state]
  for (const candidate of candidates) {
    if (!candidate) continue
    const normalized = candidate.trim().toLowerCase()
    if (CITY_ALIASES[normalized]) return CITY_ALIASES[normalized]
    const exact = ALL_LOCATIONS.find((c) => c.toLowerCase() === normalized)
    if (exact) return exact
  }
  return null
}

function MaterialsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [shops, setShops] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState(() => user?.location || 'all')
  const [cart, setCart] = useState({}) // { [productId]: quantity }
  const [cartOpen, setCartOpen] = useState(false)
  const [placingShopId, setPlacingShopId] = useState(null)
  const [toast, setToast] = useState(null)
  const [showOrders, setShowOrders] = useState(false)
  const [appliedDefaultLocation, setAppliedDefaultLocation] = useState(false)
  const [locationSource, setLocationSource] = useState(null) // 'geo' | 'profile' | 'manual'
  const [detectingLocation, setDetectingLocation] = useState(
    () => typeof navigator !== 'undefined' && !!navigator.geolocation
  )
  const [geoUnavailable, setGeoUnavailable] = useState(false)
  const [showAllShops, setShowAllShops] = useState(false)
  const [coords, setCoords] = useState(null) // { lat, lng } — the customer's own device coordinates, for Haversine distance
  const [distanceFilter, setDistanceFilter] = useState('all') // 'all' | '5' | '10' | '25' | '50'
  const [minRating, setMinRating] = useState(0)
  const [deliveryOnly, setDeliveryOnly] = useState(false)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoUnavailable(true)
      return
    }
    setDetectingLocation(true)
    setGeoUnavailable(false)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          setCoords({ lat: latitude, lng: longitude })
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          )
          const data = await res.json()
          const matched = matchCityFromAddress(data?.address)
          if (matched) {
            setLocationFilter(matched)
            setLocationSource('geo')
            setAppliedDefaultLocation(true)
          } else {
            setGeoUnavailable(true)
          }
        } catch {
          setGeoUnavailable(true)
        } finally {
          setDetectingLocation(false)
        }
      },
      () => {
        setGeoUnavailable(true)
        setDetectingLocation(false)
      },
      { timeout: 8000, maximumAge: 10 * 60 * 1000 }
    )
  }

  // Try live geolocation first on load — it reflects where the customer
  // actually is right now, which takes priority over their saved profile city.
  useEffect(() => {
    detectCurrentLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The user's profile may still be loading when this page mounts (e.g. on
  // a hard refresh) — once it arrives, apply their saved city as a fallback
  // default, but only if live geolocation didn't already resolve one.
  useEffect(() => {
    if (appliedDefaultLocation) return
    if (locationSource === 'geo' || detectingLocation) return
    if (user?.location) {
      setLocationFilter(user.location)
      setLocationSource('profile')
      setAppliedDefaultLocation(true)
    }
  }, [user?.location, appliedDefaultLocation, locationSource, detectingLocation])

  // The customer can also change their city from the sidebar's location
  // picker while this page is already open — reflect that change right away.
  const prevUserLocationRef = useRef(user?.location)
  useEffect(() => {
    const changed = prevUserLocationRef.current !== user?.location
    prevUserLocationRef.current = user?.location
    if (changed && appliedDefaultLocation && user?.location) {
      setLocationFilter(user.location)
      setLocationSource('profile')
    }
  }, [user?.location, appliedDefaultLocation])

  useEffect(() => {
    ;(async () => {
      try {
        const shopsQuery = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : ''
        const [shopsData, ordersData] = await Promise.all([
          apiFetch(`/api/materials/shops${shopsQuery}`),
          apiFetch('/api/materials/orders'),
        ])
        setShops(shopsData.shops)
        setOrders(ordersData.orders)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
    // Re-fetch once live coordinates arrive so shops come back with a real
    // Haversine distanceKm and sorted nearest-first.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords])

  const allProducts = useMemo(
    () => shops.flatMap((s) => s.products.map((p) => ({ ...p, shopId: s.id, shopName: s.name }))),
    [shops]
  )
  const productById = useMemo(() => new Map(allProducts.map((p) => [p.id, p])), [allProducts])
  const categories = useMemo(() => [...new Set(shops.map((s) => s.category))], [shops])
  const locations = useMemo(() => [...new Set(shops.map((s) => s.location))].sort(), [shops])

  const min = priceMin.trim() === '' ? null : Number(priceMin)
  const max = priceMax.trim() === '' ? null : Number(priceMax)

  const visibleShops = useMemo(() => {
    const q = query.trim().toLowerCase()
    return shops
      .filter((s) => categoryFilter === 'all' || s.category === categoryFilter)
      .filter((s) => locationFilter === 'all' || s.location === locationFilter)
      .filter((s) => distanceFilter === 'all' || s.distanceKm === null || s.distanceKm <= Number(distanceFilter))
      .filter((s) => minRating === 0 || (s.rating ?? 0) >= minRating)
      .filter((s) => !deliveryOnly || s.deliveryAvailable)
      .map((s) => ({
        ...s,
        products: s.products.filter((p) => {
          if (q && !p.name.toLowerCase().includes(q)) return false
          if (inStockOnly && p.stockStatus === 'out_of_stock') return false
          if (min !== null && p.price < min) return false
          if (max !== null && p.price > max) return false
          return true
        }),
      }))
      .filter((s) => s.products.length > 0)
  }, [shops, categoryFilter, locationFilter, distanceFilter, minRating, deliveryOnly, inStockOnly, min, max, query])

  // With shops now covering ~450 towns/cities across India, rendering every
  // matching shop at once (e.g. under "All India") would be sluggish — cap
  // it until the customer narrows down by location/category/search or asks
  // to see everything.
  const SHOP_DISPLAY_CAP = 30
  const isCapped = !showAllShops && visibleShops.length > SHOP_DISPLAY_CAP
  const shownShops = isCapped ? visibleShops.slice(0, SHOP_DISPLAY_CAP) : visibleShops

  const cartGroups = useMemo(() => {
    const groups = new Map()
    for (const [productId, quantity] of Object.entries(cart)) {
      if (quantity <= 0) continue
      const product = productById.get(productId)
      if (!product) continue
      if (!groups.has(product.shopId)) groups.set(product.shopId, { shopId: product.shopId, shopName: product.shopName, items: [], subtotal: 0 })
      const group = groups.get(product.shopId)
      group.items.push({ ...product, quantity })
      group.subtotal += product.price * quantity
    }
    return [...groups.values()]
  }, [cart, productById])

  const cartCount = Object.values(cart).reduce((sum, q) => sum + q, 0)
  const cartTotal = cartGroups.reduce((sum, g) => sum + g.subtotal, 0)

  const increment = (productId) => setCart((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }))
  const decrement = (productId) =>
    setCart((prev) => {
      const next = { ...prev }
      const qty = (next[productId] || 0) - 1
      if (qty <= 0) delete next[productId]
      else next[productId] = qty
      return next
    })

  const handleBuyNow = async (shopId, product) => {
    setPlacingShopId(shopId)
    try {
      const data = await apiFetch('/api/materials/orders', {
        method: 'POST',
        body: JSON.stringify({ shopId, items: [{ productId: product.id, quantity: 1 }] }),
      })
      setOrders((prev) => [data.order, ...prev])
      setToast(`Order placed for ${product.name} — check Calendar for delivery`)
      setTimeout(() => setToast(null), 3200)
    } catch (err) {
      setToast(err.message)
      setTimeout(() => setToast(null), 3200)
    } finally {
      setPlacingShopId(null)
    }
  }

  const handlePlaceOrder = async (shopId) => {
    const group = cartGroups.find((g) => g.shopId === shopId)
    if (!group) return
    setPlacingShopId(shopId)
    try {
      const data = await apiFetch('/api/materials/orders', {
        method: 'POST',
        body: JSON.stringify({
          shopId,
          items: group.items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        }),
      })
      setOrders((prev) => [data.order, ...prev])
      setCart((prev) => {
        const next = { ...prev }
        for (const item of group.items) delete next[item.id]
        return next
      })
      setToast(`Order placed with ${group.shopName} — check Calendar for delivery`)
      setTimeout(() => setToast(null), 3200)
    } catch (err) {
      setToast(err.message)
      setTimeout(() => setToast(null), 3200)
    } finally {
      setPlacingShopId(null)
    }
  }

  return (
    <DashboardShell>
      {({ onMenuClick }) => (
        <>
          <DashboardHeader
            onMenuClick={onMenuClick}
            title="Material Details"
            subtitle="Browse materials from local shops, add to cart and order deliveries."
          />

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search materials…"
                className="w-full rounded-full border border-ink/15 bg-navy-900/60 py-2.5 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-gold-500/50"
              />
            </div>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <LocationIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/35" />
                <select
                  value={locationFilter}
                  onChange={(e) => {
                    setLocationFilter(e.target.value)
                    setLocationSource('manual')
                    setAppliedDefaultLocation(true)
                  }}
                  className="rounded-full border border-ink/15 bg-navy-900/60 py-2 pl-8 pr-3 text-xs font-medium text-ink outline-none focus:border-gold-500/50"
                >
                  <option value="all">All India</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowOrders((v) => !v)}
                className="rounded-full border border-ink/15 px-4 py-2 text-xs font-medium text-ink/70 hover:border-gold-500/40 hover:text-ink"
              >
                {showOrders ? 'Browse Materials' : `My Orders (${orders.length})`}
              </button>
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-1.5 rounded-full bg-gold-500 px-4 py-2 text-xs font-semibold text-charcoal hover:bg-gold-400"
              >
                <CartIcon className="h-4 w-4" /> Cart
                {cartCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {detectingLocation ? (
            <div className="mt-3 flex items-center gap-2 text-xs text-ink/40">
              <Spinner className="h-3.5 w-3.5" />
              Detecting your current location…
            </div>
          ) : locationSource === 'geo' && locationFilter !== 'all' ? (
            <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink/40">
              <LocationIcon className="h-3.5 w-3.5 text-gold-300" />
              Showing shops near <span className="text-ink/70">{locationFilter}</span> — detected from your current location.
              <button onClick={detectCurrentLocation} className="text-gold-300 hover:text-gold-200">Refresh</button>
            </p>
          ) : locationSource === 'profile' && locationFilter !== 'all' ? (
            <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink/40">
              Showing shops in <span className="text-ink/70">{locationFilter}</span> — your saved location.
              <button onClick={detectCurrentLocation} className="text-gold-300 hover:text-gold-200">Use current location instead</button>
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gold-500/20 bg-gold-500/5 px-4 py-2.5 text-sm text-ink/60">
              <span>
                {geoUnavailable
                  ? "Couldn't detect your current location — set your city instead."
                  : 'Set your city to automatically see shops near you.'}
              </span>
              <span className="flex items-center gap-3">
                <button onClick={detectCurrentLocation} className="font-medium text-gold-300 hover:text-gold-200">
                  📍 Use current location
                </button>
                <button
                  onClick={() => navigate('/dashboard/settings')}
                  className="font-medium text-gold-300 hover:text-gold-200"
                >
                  Set City →
                </button>
              </span>
            </div>
          )}

          {error && <p className="mt-5 text-sm text-red-400">{error}</p>}

          {loading ? (
            <div className="mt-16 flex justify-center">
              <Spinner className="h-6 w-6 text-ink/40" />
            </div>
          ) : showOrders ? (
            <div className="mt-6 space-y-3">
              {orders.length === 0 ? (
                <p className="mt-10 text-center text-sm text-ink/40">No orders yet.</p>
              ) : (
                orders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-ink/10 bg-navy-900/50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-xs text-ink/35">#{order.displayId}</p>
                        <p className="text-sm font-semibold text-ink">{order.shopName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gold-300">{formatPrice(order.totalAmount)}</p>
                        <p className="text-xs text-ink/40">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="mt-2.5 space-y-1 border-t border-ink/5 pt-2.5">
                      {order.items.map((item, i) => (
                        <p key={i} className="text-xs text-ink/55">
                          {item.quantity} × {item.productName} ({item.unit})
                        </p>
                      ))}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors duration-150 ${
                    categoryFilter === 'all' ? 'border-gold-500/50 bg-gold-500/10 text-gold-300' : 'border-ink/10 text-ink/60 hover:border-ink/20'
                  }`}
                >
                  All Materials
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors duration-150 ${
                      categoryFilter === cat ? 'border-gold-500/50 bg-gold-500/10 text-gold-300' : 'border-ink/10 text-ink/60 hover:border-ink/20'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={distanceFilter}
                  onChange={(e) => setDistanceFilter(e.target.value)}
                  disabled={!coords}
                  title={coords ? undefined : 'Enable current-location detection to filter by distance'}
                  className="rounded-full border border-ink/10 bg-navy-950/40 px-3 py-1.5 text-xs text-ink/70 outline-none disabled:opacity-40"
                >
                  <option value="all">Any distance</option>
                  <option value="5">Within 5 km</option>
                  <option value="10">Within 10 km</option>
                  <option value="25">Within 25 km</option>
                  <option value="50">Within 50 km</option>
                </select>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="rounded-full border border-ink/10 bg-navy-950/40 px-3 py-1.5 text-xs text-ink/70 outline-none"
                >
                  <option value={0}>Any rating</option>
                  <option value={4.5}>4.5★ &amp; up</option>
                  <option value={4}>4★ &amp; up</option>
                  <option value={3.5}>3.5★ &amp; up</option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="Min ₹"
                  className="w-20 rounded-full border border-ink/10 bg-navy-950/40 px-3 py-1.5 text-xs text-ink outline-none placeholder:text-ink/35"
                />
                <input
                  type="number"
                  min="0"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="Max ₹"
                  className="w-20 rounded-full border border-ink/10 bg-navy-950/40 px-3 py-1.5 text-xs text-ink outline-none placeholder:text-ink/35"
                />
                <button
                  onClick={() => setInStockOnly((v) => !v)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                    inStockOnly ? 'border-gold-500/50 bg-gold-500/10 text-gold-300' : 'border-ink/10 text-ink/60 hover:border-ink/20'
                  }`}
                >
                  In stock only
                </button>
                <button
                  onClick={() => setDeliveryOnly((v) => !v)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                    deliveryOnly ? 'border-gold-500/50 bg-gold-500/10 text-gold-300' : 'border-ink/10 text-ink/60 hover:border-ink/20'
                  }`}
                >
                  Delivery available
                </button>
              </div>

              {isCapped && (
                <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink/40">
                  Showing {SHOP_DISPLAY_CAP} of {visibleShops.length} shops — set your location or pick a category to narrow this down.
                  <button onClick={() => setShowAllShops(true)} className="font-medium text-gold-300 hover:text-gold-200">
                    Show all {visibleShops.length}
                  </button>
                </p>
              )}

              <div className="mt-6 space-y-6">
                {visibleShops.length === 0 && (
                  <p className="mt-10 text-center text-sm text-ink/40">No materials match your search.</p>
                )}
                {shownShops.map((shop, shopIndex) => (
                  <motion.div
                    key={shop.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(shopIndex * 0.05, 0.4), ease: [0.16, 1, 0.3, 1] }}
                    className="rounded-2xl border border-ink/10 bg-navy-900/50 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-500/10 text-gold-300">
                          <ShopIcon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="font-display text-sm font-semibold text-ink">{shop.name}</p>
                          <p className="text-xs text-ink/45">{shop.category} · {shop.location}</p>
                          {shop.address && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-ink/35">
                              <LocationIcon className="h-3 w-3 shrink-0" />
                              {shop.address}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs">
                        {shop.rating != null && (
                          <span className="flex items-center gap-1 rounded-full border border-ink/10 bg-navy-950/40 px-2.5 py-1 text-ink/70">
                            <StarIcon className="h-3.5 w-3.5 text-gold-300" />
                            {shop.rating.toFixed(1)}
                          </span>
                        )}
                        {shop.distanceKm != null && (
                          <span className="flex items-center gap-1 rounded-full border border-ink/10 bg-navy-950/40 px-2.5 py-1 text-ink/70">
                            <LocationIcon className="h-3.5 w-3.5 text-ink/40" />
                            {shop.distanceKm} km away
                          </span>
                        )}
                        <span
                          className={`flex items-center gap-1 rounded-full border px-2.5 py-1 ${
                            shop.deliveryAvailable ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-ink/10 bg-navy-950/40 text-ink/40'
                          }`}
                        >
                          <TruckIcon className="h-3.5 w-3.5" />
                          {shop.deliveryAvailable ? `Delivery in ~${shop.deliveryEtaHours}h` : 'Pickup only'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {shop.products.map((product) => {
                        const quantity = cart[product.id] || 0
                        const outOfStock = product.stockStatus === 'out_of_stock'
                        return (
                          <div key={product.id} className="flex flex-col gap-2.5 rounded-xl border border-ink/10 bg-navy-950/40 p-3">
                            <div className="flex items-center gap-3">
                              <ProductImage product={product} className="h-14 w-14" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm text-ink/90">{product.name}</p>
                                <p className="text-xs text-ink/40">{formatPrice(product.price)} / {product.unit}</p>
                                <span
                                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                    product.stockStatus === 'out_of_stock'
                                      ? 'bg-red-500/10 text-red-300'
                                      : product.stockStatus === 'low_stock'
                                        ? 'bg-amber-500/10 text-amber-300'
                                        : 'bg-emerald-500/10 text-emerald-300'
                                  }`}
                                >
                                  {product.stockStatus === 'out_of_stock' ? 'Out of stock' : product.stockStatus === 'low_stock' ? 'Low stock' : 'In stock'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {quantity === 0 ? (
                                <button
                                  onClick={() => increment(product.id)}
                                  disabled={outOfStock}
                                  className="flex-1 rounded-lg border border-gold-500/40 px-3 py-1.5 text-xs font-semibold text-gold-300 hover:bg-gold-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  Add to Cart
                                </button>
                              ) : (
                                <div className="flex flex-1 items-center justify-center gap-2">
                                  <button
                                    onClick={() => decrement(product.id)}
                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-500 text-charcoal hover:bg-gold-400"
                                  >
                                    −
                                  </button>
                                  <span className="w-4 text-center text-sm text-ink">{quantity}</span>
                                  <button
                                    onClick={() => increment(product.id)}
                                    disabled={outOfStock}
                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-500 text-charcoal hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                              <button
                                onClick={() => handleBuyNow(shop.id, product)}
                                disabled={outOfStock || placingShopId === shop.id}
                                className="flex-1 rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-charcoal hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Buy Now
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          <AnimatePresence>
            {cartCount > 0 && !cartOpen && !showOrders && (
              <motion.button
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                onClick={() => setCartOpen(true)}
                className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full bg-gold-500 px-5 py-3 text-sm font-semibold text-charcoal shadow-2xl hover:bg-gold-400"
              >
                <CartIcon className="h-4 w-4" />
                {cartCount} item{cartCount > 1 ? 's' : ''} · {formatPrice(cartTotal)}
                <span className="text-charcoal/70">View Cart</span>
              </motion.button>
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

export default MaterialsPage
