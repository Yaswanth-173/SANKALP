import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import DashboardShell from '../components/dashboard/DashboardShell.jsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import Spinner from '../components/Spinner.jsx'
import CartDrawer from '../components/materials/CartDrawer.jsx'
import MapView from '../components/materials/MapView.jsx'
import { ShopIcon, CartIcon, SearchIcon, CheckCircleIcon, LocationIcon, StarIcon, TruckIcon } from '../components/materials/materialIcons.jsx'
import { apiFetch } from '../utils/api.js'
import { STATE_CITIES } from '../data/indianCities.js'
import { forwardGeocode, timeAgo, whatsappLink, directionsLink } from '../utils/geoSearch.js'

const RADIUS_OPTIONS = [
  { value: '5', label: '5 km' },
  { value: '10', label: '10 km' },
  { value: '25', label: '25 km' },
  { value: '50', label: '50 km' },
  { value: '100', label: '100 km' },
  { value: 'all', label: 'All India' },
]
const SORT_OPTIONS = [
  { value: 'distance', label: 'Nearest' },
  { value: 'price', label: 'Price' },
  { value: 'rating', label: 'Rating' },
  { value: 'stock', label: 'Stock availability' },
  { value: 'delivery', label: 'Delivery availability' },
]
const STOCK_LABEL = {
  IN_STOCK: { text: 'In Stock', dot: '🟢' },
  LIMITED: { text: 'Limited Stock', dot: '🟡' },
  OUT_OF_STOCK: { text: 'Out of Stock', dot: '🔴' },
  ON_REQUEST: { text: 'Available on Request', dot: '🟠' },
  UNKNOWN: { text: 'Stock not reported', dot: '⚪' },
}

function formatPrice(n) {
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function MaterialsPage() {
  const navigate = useNavigate()

  // --- Location ---
  const [coords, setCoords] = useState(null)
  const [locationLabel, setLocationLabel] = useState('')
  const [locationStatus, setLocationStatus] = useState('idle') // idle | detecting | granted | denied | unavailable
  const [showLocationPanel, setShowLocationPanel] = useState(false)
  const [manualState, setManualState] = useState('')
  const [manualCity, setManualCity] = useState('')
  const [manualPincode, setManualPincode] = useState('')
  const [manualApplied, setManualApplied] = useState(false)
  const [searchLocationText, setSearchLocationText] = useState('')
  const [searchingLocation, setSearchingLocation] = useState(false)
  const [radiusKm, setRadiusKm] = useState('10')

  // --- Search / filters ---
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [sort, setSort] = useState('distance')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [deliveryOnly, setDeliveryOnly] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [viewMode, setViewMode] = useState('list') // list | map

  // --- Results ---
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedSupplierId, setSelectedSupplierId] = useState(null)

  // --- Cart / compare / orders ---
  const [cart, setCart] = useState({})
  const [cartOpen, setCartOpen] = useState(false)
  const [placingSupplierId, setPlacingSupplierId] = useState(null)
  const [toast, setToast] = useState(null)
  const [compareIds, setCompareIds] = useState(new Set())
  const [compareOpen, setCompareOpen] = useState(false)
  const [showOrders, setShowOrders] = useState(false)
  const [orders, setOrders] = useState([])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400)
    return () => clearTimeout(t)
  }, [query])

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable')
      return
    }
    setLocationStatus('detecting')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude })
        setManualApplied(false)
        setLocationStatus('granted')
        setLocationLabel('Your current location')
        setShowLocationPanel(false)
      },
      () => setLocationStatus('denied'),
      { timeout: 8000, maximumAge: 10 * 60 * 1000 }
    )
  }

  useEffect(() => {
    detectCurrentLocation()
    apiFetch('/api/materials/categories').then((d) => setCategories(d.categories)).catch(() => {})
    apiFetch('/api/materials/orders').then((d) => setOrders(d.orders)).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyManualLocation = () => {
    if (!manualCity && !manualState && !manualPincode) return
    setCoords(null)
    setManualApplied(true)
    setLocationStatus('granted')
    setLocationLabel([manualCity, manualState].filter(Boolean).join(', ') || manualPincode)
    setShowLocationPanel(false)
  }

  const handleSearchLocation = async () => {
    if (!searchLocationText.trim()) return
    setSearchingLocation(true)
    const found = await forwardGeocode(searchLocationText)
    setSearchingLocation(false)
    if (!found) {
      setToast('Could not find that location. Try a nearby city or pincode instead.')
      setTimeout(() => setToast(null), 3200)
      return
    }
    setCoords({ lat: found.lat, lng: found.lng })
    setManualApplied(false)
    setLocationStatus('granted')
    setLocationLabel(found.label.split(',').slice(0, 2).join(', '))
    setShowLocationPanel(false)
  }

  useEffect(() => {
    if (locationStatus === 'idle' || locationStatus === 'detecting') return
    setLoading(true)
    setLoadError('')
    const params = new URLSearchParams()
    if (debouncedQuery.trim()) params.set('q', debouncedQuery.trim())
    if (categoryId) params.set('categoryId', categoryId)
    if (coords) {
      params.set('lat', coords.lat)
      params.set('lng', coords.lng)
    } else if (manualApplied) {
      if (manualCity) params.set('city', manualCity)
      if (manualState) params.set('state', manualState)
      if (manualPincode) params.set('pincode', manualPincode)
    }
    params.set('radiusKm', radiusKm)
    params.set('sort', sort)
    if (inStockOnly) params.set('inStockOnly', 'true')
    if (deliveryOnly) params.set('deliveryOnly', 'true')
    if (minRating) params.set('minRating', String(minRating))
    params.set('pageSize', '40')

    apiFetch(`/api/materials/search?${params.toString()}`)
      .then((d) => setResults(d.results))
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }, [debouncedQuery, categoryId, coords, manualApplied, manualCity, manualState, manualPincode, radiusKm, sort, inStockOnly, deliveryOnly, minRating, locationStatus])

  const itemsById = useMemo(() => new Map(results.map((r) => [r.supplierMaterialId, r])), [results])

  const cartGroups = useMemo(() => {
    const groups = new Map()
    for (const [id, quantity] of Object.entries(cart)) {
      if (quantity <= 0) continue
      const item = itemsById.get(id)
      if (!item || !item.price) continue
      if (!groups.has(item.supplier.id)) {
        groups.set(item.supplier.id, { shopId: item.supplier.id, shopName: item.supplier.businessName, items: [], subtotal: 0 })
      }
      const group = groups.get(item.supplier.id)
      group.items.push({ id, name: item.productName || item.material.name, unit: item.price.unit, price: item.price.price, imageUrl: item.material.imageUrl, quantity })
      group.subtotal += item.price.price * quantity
    }
    return [...groups.values()]
  }, [cart, itemsById])
  const cartCount = Object.values(cart).reduce((sum, q) => sum + q, 0)
  const cartTotal = cartGroups.reduce((sum, g) => sum + g.subtotal, 0)

  const increment = (id) => setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
  const decrement = (id) =>
    setCart((prev) => {
      const next = { ...prev }
      const qty = (next[id] || 0) - 1
      if (qty <= 0) delete next[id]
      else next[id] = qty
      return next
    })

  const toggleCompare = (id) => {
    setCompareIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 4) next.add(id)
      return next
    })
  }

  const handleBuyNow = async (item) => {
    setPlacingSupplierId(item.supplier.id)
    try {
      const data = await apiFetch('/api/materials/orders', {
        method: 'POST',
        body: JSON.stringify({ supplierId: item.supplier.id, items: [{ supplierMaterialId: item.supplierMaterialId, quantity: 1 }] }),
      })
      setOrders((prev) => [data.order, ...prev])
      setToast(`Order placed for ${item.productName || item.material.name} — check Calendar for delivery`)
      setTimeout(() => setToast(null), 3200)
    } catch (err) {
      setToast(err.message)
      setTimeout(() => setToast(null), 3200)
    } finally {
      setPlacingSupplierId(null)
    }
  }

  const handlePlaceOrder = async (supplierId) => {
    const group = cartGroups.find((g) => g.shopId === supplierId)
    if (!group) return
    setPlacingSupplierId(supplierId)
    try {
      const data = await apiFetch('/api/materials/orders', {
        method: 'POST',
        body: JSON.stringify({ supplierId, items: group.items.map((i) => ({ supplierMaterialId: i.id, quantity: i.quantity })) }),
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
      setPlacingSupplierId(null)
    }
  }

  const compareItems = results.filter((r) => compareIds.has(r.supplierMaterialId))
  const cityOptions = manualState ? STATE_CITIES[manualState] || [] : []

  let emptyState = null
  if (loadError) {
    emptyState = { title: 'Something went wrong', body: loadError, showRetry: true }
  } else if (locationStatus === 'denied' && !manualApplied) {
    emptyState = { title: "Location access denied", body: 'Select your location manually to see nearby suppliers.', showLocation: true }
  } else if (locationStatus === 'unavailable' && !manualApplied) {
    emptyState = { title: 'Location unavailable', body: 'Your browser could not provide a location. Select one manually.', showLocation: true }
  } else if (!loading && results.length === 0) {
    emptyState = {
      title: 'No material suppliers found',
      body: `No material suppliers found within ${radiusKm === 'all' ? 'India' : `${radiusKm} km`}${debouncedQuery ? ` for "${debouncedQuery}"` : ''}.`,
      showRadius: true,
      showLocation: true,
    }
  }

  return (
    <DashboardShell>
      {({ onMenuClick }) => (
        <>
          <DashboardHeader
            onMenuClick={onMenuClick}
            title="Materials Marketplace"
            subtitle="Search construction materials from suppliers near you, compare prices and order."
          />

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-ink/50">Deliver / Search near:</span>
              <button
                onClick={detectCurrentLocation}
                className="flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-3.5 py-1.5 text-xs font-medium text-gold-300 hover:bg-gold-500/15"
              >
                {locationStatus === 'detecting' ? <Spinner className="h-3.5 w-3.5" /> : <LocationIcon className="h-3.5 w-3.5" />}
                Use My Current Location
              </button>
              <button
                onClick={() => setShowLocationPanel((v) => !v)}
                className="rounded-full border border-ink/15 px-3.5 py-1.5 text-xs font-medium text-ink/70 hover:border-gold-500/40 hover:text-ink"
              >
                Select Location
              </button>
              {locationLabel && (
                <span className="rounded-full border border-ink/10 bg-navy-950/40 px-3 py-1.5 text-xs text-ink/60">
                  📍 {locationLabel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => navigate('/dashboard/materials/become-a-supplier')}
                className="rounded-full border border-ink/15 px-4 py-2 text-xs font-medium text-ink/70 hover:border-gold-500/40 hover:text-ink"
              >
                Become a Supplier
              </button>
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

          <AnimatePresence>
            {showLocationPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden rounded-xl border border-ink/10 bg-navy-900/50 p-4"
              >
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-ink/50">State</label>
                    <select
                      value={manualState}
                      onChange={(e) => { setManualState(e.target.value); setManualCity('') }}
                      className="rounded-lg border border-ink/15 bg-navy-950/60 px-3 py-2 text-xs text-ink outline-none focus:border-gold-500/50"
                    >
                      <option value="">Select state</option>
                      {Object.keys(STATE_CITIES).sort().map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-ink/50">City</label>
                    <select
                      value={manualCity}
                      onChange={(e) => setManualCity(e.target.value)}
                      disabled={!manualState}
                      className="rounded-lg border border-ink/15 bg-navy-950/60 px-3 py-2 text-xs text-ink outline-none focus:border-gold-500/50 disabled:opacity-40"
                    >
                      <option value="">Select city</option>
                      {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-ink/50">Pincode</label>
                    <input
                      value={manualPincode}
                      onChange={(e) => setManualPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="560001"
                      className="w-24 rounded-lg border border-ink/15 bg-navy-950/60 px-3 py-2 text-xs text-ink outline-none placeholder:text-ink/30 focus:border-gold-500/50"
                    />
                  </div>
                  <button onClick={applyManualLocation} className="rounded-lg bg-gold-500 px-4 py-2 text-xs font-semibold text-charcoal hover:bg-gold-400">
                    Apply
                  </button>
                  <span className="text-ink/30">or</span>
                  <div className="flex items-end gap-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-ink/50">Search Location</label>
                      <input
                        value={searchLocationText}
                        onChange={(e) => setSearchLocationText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
                        placeholder="e.g. Andheri West, Mumbai"
                        className="w-56 rounded-lg border border-ink/15 bg-navy-950/60 px-3 py-2 text-xs text-ink outline-none placeholder:text-ink/30 focus:border-gold-500/50"
                      />
                    </div>
                    <button
                      onClick={handleSearchLocation}
                      disabled={searchingLocation}
                      className="rounded-lg border border-gold-500/40 px-4 py-2 text-xs font-semibold text-gold-300 hover:bg-gold-500/10 disabled:opacity-50"
                    >
                      {searchingLocation ? <Spinner className="h-3.5 w-3.5" /> : 'Search'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showOrders && (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="relative max-w-xs flex-1">
                  <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search materials… e.g. UltraTech OPC 53 Cement"
                    className="w-full rounded-full border border-ink/15 bg-navy-900/60 py-2.5 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-gold-500/50"
                  />
                </div>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="rounded-full border border-ink/10 bg-navy-950/40 px-3 py-2 text-xs text-ink/70 outline-none"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(e.target.value)}
                  className="rounded-full border border-ink/10 bg-navy-950/40 px-3 py-2 text-xs text-ink/70 outline-none"
                >
                  {RADIUS_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="rounded-full border border-ink/10 bg-navy-950/40 px-3 py-2 text-xs text-ink/70 outline-none"
                >
                  {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>Sort: {s.label}</option>)}
                </select>
                <button
                  onClick={() => setInStockOnly((v) => !v)}
                  className={`rounded-full border px-3 py-2 text-xs font-medium ${inStockOnly ? 'border-gold-500/50 bg-gold-500/10 text-gold-300' : 'border-ink/10 text-ink/60 hover:border-ink/20'}`}
                >
                  In stock only
                </button>
                <button
                  onClick={() => setDeliveryOnly((v) => !v)}
                  className={`rounded-full border px-3 py-2 text-xs font-medium ${deliveryOnly ? 'border-gold-500/50 bg-gold-500/10 text-gold-300' : 'border-ink/10 text-ink/60 hover:border-ink/20'}`}
                >
                  Delivery available
                </button>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="rounded-full border border-ink/10 bg-navy-950/40 px-3 py-2 text-xs text-ink/70 outline-none"
                >
                  <option value={0}>Any rating</option>
                  <option value={4.5}>4.5★ &amp; up</option>
                  <option value={4}>4★ &amp; up</option>
                  <option value={3.5}>3.5★ &amp; up</option>
                </select>
                <div className="ml-auto flex items-center gap-1 rounded-full border border-ink/10 p-1">
                  <button onClick={() => setViewMode('list')} className={`rounded-full px-3 py-1 text-xs font-medium ${viewMode === 'list' ? 'bg-gold-500 text-charcoal' : 'text-ink/50 hover:text-ink'}`}>List</button>
                  <button onClick={() => setViewMode('map')} className={`rounded-full px-3 py-1 text-xs font-medium ${viewMode === 'map' ? 'bg-gold-500 text-charcoal' : 'text-ink/50 hover:text-ink'}`}>Map</button>
                </div>
              </div>

              {compareIds.size > 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-gold-500/20 bg-gold-500/5 px-4 py-2 text-xs text-ink/60">
                  {compareIds.size} item{compareIds.size > 1 ? 's' : ''} selected to compare
                  <button onClick={() => setCompareOpen(true)} className="font-medium text-gold-300 hover:text-gold-200">Compare now</button>
                  <button onClick={() => setCompareIds(new Set())} className="ml-auto text-ink/40 hover:text-ink/70">Clear</button>
                </div>
              )}
            </>
          )}

          {showOrders ? (
            <div className="mt-6 space-y-3">
              {orders.length === 0 ? (
                <p className="mt-10 text-center text-sm text-ink/40">No orders yet.</p>
              ) : (
                orders.map((order) => (
                  <motion.div key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-ink/10 bg-navy-900/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-xs text-ink/35">#{order.displayId}</p>
                        <p className="text-sm font-semibold text-ink">{order.supplierName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gold-300">{formatPrice(order.totalAmount)}</p>
                        <p className="text-xs text-ink/40">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="mt-2.5 space-y-1 border-t border-ink/5 pt-2.5">
                      {order.items.map((item, i) => (
                        <p key={i} className="text-xs text-ink/55">{item.quantity} × {item.productName} ({item.unit})</p>
                      ))}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          ) : loading ? (
            <div className="mt-16 flex justify-center"><Spinner className="h-6 w-6 text-ink/40" /></div>
          ) : emptyState ? (
            <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-ink/10 bg-navy-900/40 p-8 text-center">
              <p className="text-sm font-semibold text-ink">{emptyState.title}</p>
              <p className="max-w-md text-xs text-ink/50">{emptyState.body}</p>
              <div className="mt-1 flex flex-wrap justify-center gap-2">
                {emptyState.showLocation && (
                  <button onClick={() => setShowLocationPanel(true)} className="rounded-full border border-gold-500/40 px-4 py-1.5 text-xs font-medium text-gold-300 hover:bg-gold-500/10">
                    Change Location
                  </button>
                )}
                {emptyState.showRadius && radiusKm !== 'all' && (
                  <button
                    onClick={() => setRadiusKm(RADIUS_OPTIONS[Math.min(RADIUS_OPTIONS.findIndex((r) => r.value === radiusKm) + 1, RADIUS_OPTIONS.length - 1)].value)}
                    className="rounded-full border border-ink/15 px-4 py-1.5 text-xs font-medium text-ink/70 hover:border-gold-500/40 hover:text-ink"
                  >
                    Increase Search Radius
                  </button>
                )}
                {emptyState.showRetry && (
                  <button onClick={() => setDebouncedQuery((q) => q)} className="rounded-full border border-ink/15 px-4 py-1.5 text-xs font-medium text-ink/70">
                    Retry
                  </button>
                )}
              </div>
            </div>
          ) : viewMode === 'map' ? (
            <MapView
              userCoords={coords}
              suppliers={results}
              selectedSupplierId={selectedSupplierId}
              onSelectSupplier={setSelectedSupplierId}
              onViewShop={(id) => navigate(`/dashboard/materials/suppliers/${id}`)}
            />
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((item, index) => {
                const stock = STOCK_LABEL[item.inventory.stockStatus] || STOCK_LABEL.UNKNOWN
                const quantity = cart[item.supplierMaterialId] || 0
                const disabled = item.inventory.stockStatus === 'OUT_OF_STOCK' || !item.price
                return (
                  <motion.div
                    key={item.supplierMaterialId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.4), ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-navy-900/50 p-4"
                  >
                    <div className="flex gap-3">
                      {item.material.imageUrl ? (
                        <img src={item.material.imageUrl} alt={item.material.name} className="h-16 w-16 shrink-0 rounded-lg border border-ink/10 object-cover" />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-navy-950/60"><ShopIcon className="h-7 w-7 text-ink/30" /></div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{item.productName || item.material.name}</p>
                        <p className="text-xs text-ink/45">{item.brand ? `${item.brand} · ` : ''}{item.grade || item.material.grade || ''}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-ink/70">
                      <button onClick={() => navigate(`/dashboard/materials/suppliers/${item.supplier.id}`)} className="truncate font-medium text-ink hover:text-gold-300">
                        {item.supplier.businessName}
                      </button>
                      {item.supplier.verificationStatus === 'verified' && (
                        <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">✓ Verified</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-ink/50">
                      {item.distanceKm != null && (
                        <span className="flex items-center gap-1"><LocationIcon className="h-3 w-3" /> {item.distanceKm} km away</span>
                      )}
                      {item.supplier.rating != null && (
                        <span className="flex items-center gap-1"><StarIcon className="h-3 w-3 text-gold-300" /> {Number(item.supplier.rating).toFixed(1)}</span>
                      )}
                      {item.supplier.deliveryAvailable && <span className="flex items-center gap-1 text-emerald-300"><TruckIcon className="h-3 w-3" /> Delivery available</span>}
                    </div>

                    <div className="rounded-xl border border-ink/10 bg-navy-950/40 p-3">
                      {item.price ? (
                        <>
                          <p className="text-lg font-semibold text-gold-300">{formatPrice(item.price.price)} <span className="text-xs font-normal text-ink/40">/ {item.price.unit}</span></p>
                          <p className="text-[10px] text-ink/35">Price updated {timeAgo(item.price.updatedAt)}{!item.price.verified ? ' · unverified' : ''}</p>
                        </>
                      ) : (
                        <p className="text-xs text-ink/40">Price not available — contact supplier</p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs">{stock.dot} {stock.text}{item.inventory.quantity != null ? ` · ${item.inventory.quantity} ${item.price?.unit || item.material.unit}` : ''}</span>
                      </div>
                      {item.inventory.lastUpdatedAt && (
                        <p className="mt-0.5 text-[10px] text-ink/30">Stock updated {timeAgo(item.inventory.lastUpdatedAt)}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {quantity === 0 ? (
                        <button onClick={() => increment(item.supplierMaterialId)} disabled={disabled} className="flex-1 rounded-lg border border-gold-500/40 px-3 py-1.5 text-xs font-semibold text-gold-300 hover:bg-gold-500/10 disabled:cursor-not-allowed disabled:opacity-40">
                          Add to Cart
                        </button>
                      ) : (
                        <div className="flex flex-1 items-center justify-center gap-2">
                          <button onClick={() => decrement(item.supplierMaterialId)} className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-500 text-charcoal hover:bg-gold-400">−</button>
                          <span className="w-4 text-center text-sm text-ink">{quantity}</span>
                          <button onClick={() => increment(item.supplierMaterialId)} disabled={disabled} className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-500 text-charcoal hover:bg-gold-400 disabled:opacity-40">+</button>
                        </div>
                      )}
                      <button onClick={() => handleBuyNow(item)} disabled={disabled || placingSupplierId === item.supplier.id} className="flex-1 rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-charcoal hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40">
                        Buy Now
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <button onClick={() => toggleCompare(item.supplierMaterialId)} className={`rounded-full border px-2.5 py-1 font-medium ${compareIds.has(item.supplierMaterialId) ? 'border-gold-500/50 bg-gold-500/10 text-gold-300' : 'border-ink/10 text-ink/60 hover:border-ink/20'}`}>
                        Compare
                      </button>
                      <button onClick={() => navigate(`/dashboard/materials/suppliers/${item.supplier.id}`)} className="rounded-full border border-ink/10 px-2.5 py-1 font-medium text-ink/60 hover:border-ink/20">
                        View Shop
                      </button>
                      {item.location.latitude != null && (
                        <a href={directionsLink(item.location.latitude, item.location.longitude)} target="_blank" rel="noreferrer" className="rounded-full border border-ink/10 px-2.5 py-1 font-medium text-ink/60 hover:border-ink/20">
                          Directions
                        </a>
                      )}
                      {item.supplier.phone && (
                        <a href={`tel:${item.supplier.phone}`} className="rounded-full border border-ink/10 px-2.5 py-1 font-medium text-ink/60 hover:border-ink/20">Call</a>
                      )}
                      {item.supplier.whatsapp && (
                        <a href={whatsappLink(item.supplier.whatsapp, `Hi, I'm interested in ${item.productName || item.material.name}`)} target="_blank" rel="noreferrer" className="rounded-full border border-emerald-500/30 px-2.5 py-1 font-medium text-emerald-300 hover:bg-emerald-500/10">WhatsApp</a>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          <AnimatePresence>
            {cartCount > 0 && !cartOpen && !showOrders && (
              <motion.button
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
                onClick={() => setCartOpen(true)}
                className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full bg-gold-500 px-5 py-3 text-sm font-semibold text-charcoal shadow-2xl hover:bg-gold-400"
              >
                <CartIcon className="h-4 w-4" /> {cartCount} item{cartCount > 1 ? 's' : ''} · {formatPrice(cartTotal)}
                <span className="text-charcoal/70">View Cart</span>
              </motion.button>
            )}
          </AnimatePresence>

          <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} groups={cartGroups} onIncrement={increment} onDecrement={decrement} onPlaceOrder={handlePlaceOrder} placingShopId={placingSupplierId} />

          <AnimatePresence>
            {compareOpen && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCompareOpen(false)} className="fixed inset-0 z-40 bg-black/60" />
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-x-4 top-16 z-50 mx-auto max-w-4xl overflow-x-auto rounded-2xl border border-ink/10 bg-navy-900 p-5 shadow-2xl">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold text-ink">Compare Suppliers</h3>
                    <button onClick={() => setCompareOpen(false)} className="text-ink/40 hover:text-ink">✕</button>
                  </div>
                  <table className="w-full min-w-[560px] border-collapse text-sm">
                    <tbody>
                      {[
                        ['Supplier', (i) => i.supplier.businessName],
                        ['Product', (i) => i.productName || i.material.name],
                        ['Price', (i) => (i.price ? `${formatPrice(i.price.price)} / ${i.price.unit}` : '—')],
                        ['Stock', (i) => (STOCK_LABEL[i.inventory.stockStatus] || STOCK_LABEL.UNKNOWN).text],
                        ['Distance', (i) => (i.distanceKm != null ? `${i.distanceKm} km` : '—')],
                        ['Rating', (i) => (i.supplier.rating != null ? Number(i.supplier.rating).toFixed(1) : '—')],
                        ['Delivery', (i) => (i.supplier.deliveryAvailable ? 'Available' : 'Pickup only')],
                      ].map(([label, get]) => (
                        <tr key={label} className="border-b border-ink/5">
                          <td className="py-2 pr-4 text-xs font-medium text-ink/40">{label}</td>
                          {compareItems.map((i) => <td key={i.supplierMaterialId} className="py-2 pr-4 text-ink/85">{get(i)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {toast && (
              <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.9 }} transition={{ type: 'spring', stiffness: 340, damping: 26 }} className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-gold-500/40 bg-navy-900 px-5 py-2.5 text-sm text-ink shadow-2xl">
                <span className="flex items-center gap-2"><CheckCircleIcon className="h-4 w-4 text-emerald-400" /> {toast}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </DashboardShell>
  )
}

export default MaterialsPage
