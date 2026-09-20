import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import DashboardShell from '../components/dashboard/DashboardShell.jsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import Spinner from '../components/Spinner.jsx'
import { LocationIcon } from '../components/materials/materialIcons.jsx'
import { apiFetch } from '../utils/api.js'
import { STATE_CITIES } from '../data/indianCities.js'

const STOCK_STATUSES = ['IN_STOCK', 'LIMITED', 'OUT_OF_STOCK', 'ON_REQUEST', 'UNKNOWN']

function RegistrationForm({ onRegistered }) {
  const [form, setForm] = useState({
    businessName: '', ownerName: '', phone: '', email: '', gstNumber: '',
    address: '', state: '', city: '', pincode: '', supplierType: '', deliveryAvailable: false, deliveryRadiusKm: '',
  })
  const [coords, setCoords] = useState(null)
  const [locating, setLocating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation is not available in this browser.'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false) },
      () => { setError('Could not get your location. Enter your address manually.'); setLocating(false) },
      { timeout: 8000 }
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!coords) { setError('Set your business location using "Use Current Location" before submitting.'); return }
    setSubmitting(true)
    try {
      const data = await apiFetch('/api/suppliers/register', {
        method: 'POST',
        body: JSON.stringify({ ...form, deliveryRadiusKm: form.deliveryRadiusKm || null, latitude: coords.lat, longitude: coords.lng }),
      })
      onRegistered(data.supplier)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  return (
    <form onSubmit={submit} className="mt-5 max-w-2xl space-y-4 rounded-2xl border border-ink/10 bg-navy-900/50 p-6">
      {error && <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Business Name *" value={form.businessName} onChange={set('businessName')} required />
        <Field label="Owner Name" value={form.ownerName} onChange={set('ownerName')} />
        <Field label="Phone *" value={form.phone} onChange={set('phone')} required />
        <Field label="Email" value={form.email} onChange={set('email')} type="email" />
        <Field label="GSTIN" value={form.gstNumber} onChange={set('gstNumber')} />
        <Field label="Category (e.g. Cement, Steel)" value={form.supplierType} onChange={set('supplierType')} />
      </div>
      <Field label="Address" value={form.address} onChange={set('address')} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink/50">State</label>
          <select value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value, city: '' }))} className="w-full rounded-lg border border-ink/15 bg-navy-950/60 px-3 py-2 text-sm text-ink outline-none focus:border-gold-500/50">
            <option value="">Select state</option>
            {Object.keys(STATE_CITIES).sort().map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink/50">City</label>
          <select value={form.city} onChange={set('city')} disabled={!form.state} className="w-full rounded-lg border border-ink/15 bg-navy-950/60 px-3 py-2 text-sm text-ink outline-none focus:border-gold-500/50 disabled:opacity-40">
            <option value="">Select city</option>
            {(STATE_CITIES[form.state] || []).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Field label="Pincode" value={form.pincode} onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} />
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={useCurrentLocation} className="flex items-center gap-1.5 rounded-full border border-gold-500/40 px-4 py-2 text-xs font-semibold text-gold-300 hover:bg-gold-500/10">
          {locating ? <Spinner className="h-3.5 w-3.5" /> : <LocationIcon className="h-3.5 w-3.5" />} Use Current Location
        </button>
        {coords && <span className="text-xs text-emerald-300">Location set ✓</span>}
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-ink/70">
          <input type="checkbox" checked={form.deliveryAvailable} onChange={(e) => setForm((f) => ({ ...f, deliveryAvailable: e.target.checked }))} />
          Delivery available
        </label>
        {form.deliveryAvailable && (
          <Field label="Delivery radius (km)" value={form.deliveryRadiusKm} onChange={set('deliveryRadiusKm')} type="number" compact />
        )}
      </div>
      <button type="submit" disabled={submitting} className="rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-charcoal hover:bg-gold-400 disabled:opacity-60">
        {submitting ? <Spinner className="h-4 w-4" /> : 'Submit for Verification'}
      </button>
    </form>
  )
}

function Field({ label, compact, ...props }) {
  return (
    <div className={compact ? 'w-40' : ''}>
      <label className="mb-1 block text-xs font-medium text-ink/50">{label}</label>
      <input {...props} className="w-full rounded-lg border border-ink/15 bg-navy-950/60 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold-500/50" />
    </div>
  )
}

function CatalogManager() {
  const [materials, setMaterials] = useState([])
  const [catalog, setCatalog] = useState([])
  const [form, setForm] = useState({ materialId: '', price: '', quantity: '', stockStatus: 'IN_STOCK', minimumOrderQuantity: 1 })
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const reload = () => {
    apiFetch('/api/suppliers/mine/materials').then((d) => setCatalog(d.materials)).catch(() => {})
  }
  useEffect(() => {
    apiFetch('/api/materials?pageSize=200').then((d) => setMaterials(d.materials)).catch(() => {})
    reload()
  }, [])

  const addMaterial = async (e) => {
    e.preventDefault()
    setError('')
    const material = materials.find((m) => m.id === form.materialId)
    if (!material) { setError('Choose a material'); return }
    setAdding(true)
    try {
      await apiFetch('/api/supplier-materials', {
        method: 'POST',
        body: JSON.stringify({ ...form, brand: material.brand, productName: material.name, unit: material.unit }),
      })
      setForm({ materialId: '', price: '', quantity: '', stockStatus: 'IN_STOCK', minimumOrderQuantity: 1 })
      reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  const updatePrice = async (id, price) => {
    if (!price) return
    await apiFetch(`/api/supplier-materials/${id}/price`, { method: 'POST', body: JSON.stringify({ price: Number(price), unit: catalog.find((c) => c.id === id)?.unit || 'unit' }) })
    reload()
  }

  return (
    <div className="mt-8">
      <h3 className="font-display text-lg font-semibold text-ink">Your Catalog</h3>
      <p className="text-xs text-ink/45">Add materials you sell, set price and stock. Price changes keep full history.</p>

      <form onSubmit={addMaterial} className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-ink/10 bg-navy-950/40 p-3">
        {error && <p className="w-full text-xs text-red-300">{error}</p>}
        <div>
          <label className="mb-1 block text-[11px] text-ink/50">Material</label>
          <select value={form.materialId} onChange={(e) => setForm((f) => ({ ...f, materialId: e.target.value }))} className="rounded-lg border border-ink/15 bg-navy-900/60 px-3 py-1.5 text-xs text-ink outline-none">
            <option value="">Select</option>
            {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-ink/50">Price (₹)</label>
          <input type="number" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="w-24 rounded-lg border border-ink/15 bg-navy-900/60 px-3 py-1.5 text-xs text-ink outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-ink/50">Quantity</label>
          <input type="number" min="0" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} className="w-24 rounded-lg border border-ink/15 bg-navy-900/60 px-3 py-1.5 text-xs text-ink outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-ink/50">Stock status</label>
          <select value={form.stockStatus} onChange={(e) => setForm((f) => ({ ...f, stockStatus: e.target.value }))} className="rounded-lg border border-ink/15 bg-navy-900/60 px-3 py-1.5 text-xs text-ink outline-none">
            {STOCK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button type="submit" disabled={adding} className="rounded-lg bg-gold-500 px-4 py-1.5 text-xs font-semibold text-charcoal hover:bg-gold-400 disabled:opacity-60">
          {adding ? <Spinner className="h-3.5 w-3.5" /> : 'Add'}
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {catalog.length === 0 && <p className="text-sm text-ink/40">You haven't listed any materials yet.</p>}
        {catalog.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 bg-navy-950/40 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink/90">{c.productName || c.materialName}</p>
              <p className="text-xs text-ink/40">{c.stockStatus} · {c.quantity ?? '—'} {c.unit}</p>
            </div>
            <PriceEditor current={c.price} onSave={(price) => updatePrice(c.id, price)} />
          </div>
        ))}
      </div>
    </div>
  )
}

function PriceEditor({ current, onSave }) {
  const [value, setValue] = useState(current ?? '')
  return (
    <div className="flex items-center gap-2">
      <input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} className="w-24 rounded-lg border border-ink/15 bg-navy-900/60 px-2 py-1 text-xs text-ink outline-none" />
      <button onClick={() => onSave(value)} className="rounded-lg border border-gold-500/40 px-3 py-1 text-xs font-medium text-gold-300 hover:bg-gold-500/10">Save Price</button>
    </div>
  )
}

function BecomeSupplierPage() {
  const [loading, setLoading] = useState(true)
  const [supplier, setSupplier] = useState(null)

  useEffect(() => {
    apiFetch('/api/suppliers/mine').then((d) => setSupplier(d.supplier)).catch(() => setSupplier(null)).finally(() => setLoading(false))
  }, [])

  return (
    <DashboardShell>
      {({ onMenuClick }) => (
        <>
          <DashboardHeader onMenuClick={onMenuClick} title="Become a Supplier" subtitle="List your business on the Sankalp materials marketplace." />
          {loading ? (
            <div className="mt-16 flex justify-center"><Spinner className="h-6 w-6 text-ink/40" /></div>
          ) : supplier ? (
            <>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-5 max-w-2xl rounded-2xl border border-gold-500/20 bg-gold-500/5 p-5">
                <p className="text-sm font-semibold text-ink">{supplier.businessName}</p>
                <p className="mt-1 text-xs text-ink/60">
                  Status: <span className={supplier.verificationStatus === 'verified' ? 'text-emerald-300' : supplier.verificationStatus === 'rejected' ? 'text-red-300' : 'text-amber-300'}>
                    {supplier.verificationStatus === 'pending' ? 'Pending Verification' : supplier.verificationStatus}
                  </span>
                </p>
                {supplier.verificationStatus === 'pending' && (
                  <p className="mt-1 text-xs text-ink/40">Your listing stays hidden from customer search until an admin verifies it. You can still build your catalog below.</p>
                )}
              </motion.div>
              <CatalogManager />
            </>
          ) : (
            <RegistrationForm onRegistered={setSupplier} />
          )}
        </>
      )}
    </DashboardShell>
  )
}

export default BecomeSupplierPage
