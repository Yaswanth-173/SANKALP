import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import DashboardShell from '../components/dashboard/DashboardShell.jsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import Spinner from '../components/Spinner.jsx'
import { SkeletonRows } from '../components/ui/Skeleton.jsx'
import { StarIcon, LocationIcon, TruckIcon } from '../components/materials/materialIcons.jsx'
import { apiFetch } from '../utils/api.js'
import { timeAgo, whatsappLink, directionsLink } from '../utils/geoSearch.js'

const STOCK_LABEL = {
  IN_STOCK: '🟢 In Stock', LIMITED: '🟡 Limited Stock', OUT_OF_STOCK: '🔴 Out of Stock',
  ON_REQUEST: '🟠 Available on Request', UNKNOWN: '⚪ Stock not reported',
}
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatPrice(n) {
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function SupplierDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('materials')
  const [supplier, setSupplier] = useState(null)
  const [materials, setMaterials] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      apiFetch(`/api/suppliers/${id}`),
      apiFetch(`/api/suppliers/${id}/materials?radiusKm=all&sort=price`),
      apiFetch(`/api/suppliers/${id}/reviews`),
    ])
      .then(([s, m, r]) => { setSupplier(s.supplier); setMaterials(m.results); setReviews(r.reviews) })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const submitReview = async (e) => {
    e.preventDefault()
    setSubmittingReview(true)
    try {
      await apiFetch(`/api/suppliers/${id}/reviews`, { method: 'POST', body: JSON.stringify(reviewForm) })
      const [s, r] = await Promise.all([apiFetch(`/api/suppliers/${id}`), apiFetch(`/api/suppliers/${id}/reviews`)])
      setSupplier(s.supplier)
      setReviews(r.reviews)
      setReviewForm({ rating: 5, comment: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmittingReview(false)
    }
  }

  return (
    <DashboardShell>
      {({ onMenuClick }) => (
        <>
          <DashboardHeader onMenuClick={onMenuClick} title={supplier?.businessName || 'Supplier'} subtitle="Supplier details, materials and reviews." />
          <button onClick={() => navigate(-1)} className="mt-3 text-xs font-medium text-fg-subtle hover:text-ink">← Back to search</button>

          {loading ? (
            <SkeletonRows className="mt-6" />
          ) : error ? (
            <p className="mt-8 text-sm text-danger">{error}</p>
          ) : !supplier ? (
            <p className="mt-8 text-sm text-fg-subtle">Supplier not found.</p>
          ) : (
            <>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-2xl border border-ink/10 bg-navy-900/50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-xl font-semibold text-ink">{supplier.businessName}</h2>
                      {supplier.verificationStatus === 'verified' ? (
                        <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">✓ Verified</span>
                      ) : (
                        <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs font-medium text-fg-subtle">Unverified listing</span>
                      )}
                    </div>
                    {supplier.location?.address && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-fg-subtle"><LocationIcon className="h-3.5 w-3.5" /> {supplier.location.address}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {supplier.rating != null && (
                      <span className="flex items-center gap-1 rounded-full border border-ink/10 bg-navy-950/40 px-2.5 py-1 text-fg-muted">
                        <StarIcon className="h-3.5 w-3.5 text-accent" /> {Number(supplier.rating).toFixed(1)} ({supplier.reviewCount})
                      </span>
                    )}
                    <span className={`flex items-center gap-1 rounded-full border px-2.5 py-1 ${supplier.deliveryAvailable ? 'border-success/30 bg-success/10 text-success' : 'border-ink/10 bg-navy-950/40 text-fg-subtle'}`}>
                      <TruckIcon className="h-3.5 w-3.5" /> {supplier.deliveryAvailable ? `Delivery within ${supplier.deliveryRadiusKm ?? '?'} km` : 'Pickup only'}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {supplier.location && (
                    <a href={directionsLink(supplier.location.latitude, supplier.location.longitude)} target="_blank" rel="noreferrer" className="rounded-full border border-ink/15 px-4 py-1.5 text-xs font-medium text-fg-muted hover:border-gold-500/40 hover:text-ink">Directions</a>
                  )}
                  {supplier.phone && <a href={`tel:${supplier.phone}`} className="rounded-full border border-ink/15 px-4 py-1.5 text-xs font-medium text-fg-muted hover:border-gold-500/40 hover:text-ink">Call</a>}
                  {supplier.whatsapp && <a href={whatsappLink(supplier.whatsapp)} target="_blank" rel="noreferrer" className="rounded-full border border-success/30 px-4 py-1.5 text-xs font-medium text-success hover:bg-success/10">WhatsApp</a>}
                </div>
              </motion.div>

              <div className="mt-5 flex flex-wrap gap-2">
                {['materials', 'reviews', 'business', 'location', 'delivery'].map((t) => (
                  <button key={t} onClick={() => setTab(t)} className={`rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize ${tab === t ? 'border-gold-500/50 bg-gold-500/10 text-accent' : 'border-ink/10 text-fg-muted hover:border-ink/20'}`}>
                    {t === 'business' ? 'Business Info' : t}
                  </button>
                ))}
              </div>

              {tab === 'materials' && (
                <div className="mt-4 space-y-2.5">
                  {materials.length === 0 && <p className="mt-6 text-center text-sm text-fg-subtle">This supplier hasn't listed any materials yet.</p>}
                  {materials.map((m) => (
                    <div key={m.supplierMaterialId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 bg-navy-950/40 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-fg">{m.productName || m.material.name}</p>
                        <p className="text-xs text-fg-subtle">{m.brand ? `${m.brand} · ` : ''}{m.grade || ''}</p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="font-semibold text-accent">{m.price ? `${formatPrice(m.price.price)} / ${m.price.unit}` : '—'}</p>
                        {m.price && <p className="text-xs text-fg-subtle">Updated {timeAgo(m.price.updatedAt)}</p>}
                      </div>
                      <span className="text-xs">{STOCK_LABEL[m.inventory.stockStatus] || STOCK_LABEL.UNKNOWN}</span>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'reviews' && (
                <div className="mt-4 space-y-4">
                  <form onSubmit={submitReview} className="rounded-xl border border-ink/10 bg-navy-950/40 p-4">
                    <p className="text-xs font-medium text-fg-muted">Leave a review</p>
                    <div className="mt-2 flex items-center gap-3">
                      <select value={reviewForm.rating} onChange={(e) => setReviewForm((f) => ({ ...f, rating: Number(e.target.value) }))} className="rounded-lg border border-ink/15 bg-navy-900/60 px-3 py-1.5 text-xs text-ink outline-none">
                        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
                      </select>
                      <input value={reviewForm.comment} onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))} placeholder="Optional comment" className="flex-1 rounded-lg border border-ink/15 bg-navy-900/60 px-3 py-1.5 text-xs text-ink outline-none placeholder:text-fg-subtle" />
                      <button type="submit" disabled={submittingReview} className="btn btn-primary btn-sm">
                        {submittingReview ? <Spinner className="h-3.5 w-3.5" /> : 'Submit'}
                      </button>
                    </div>
                  </form>
                  {reviews.length === 0 ? (
                    <p className="text-center text-sm text-fg-subtle">No reviews yet.</p>
                  ) : reviews.map((r) => (
                    <div key={r.id} className="rounded-xl border border-ink/10 bg-navy-950/40 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-ink">{r.authorName}</p>
                        <span className="text-xs text-accent">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                      </div>
                      {r.comment && <p className="mt-1 text-xs text-fg-muted">{r.comment}</p>}
                      <p className="mt-1 text-xs text-fg-subtle">{timeAgo(r.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'business' && (
                <div className="mt-4 space-y-2 rounded-xl border border-ink/10 bg-navy-950/40 p-4 text-sm text-fg-muted">
                  <p><span className="text-fg-subtle">Type:</span> {supplier.supplierType || '—'}</p>
                  <p><span className="text-fg-subtle">Description:</span> {supplier.description || 'No description provided.'}</p>
                  <p><span className="text-fg-subtle">Minimum order value:</span> {supplier.minimumOrderValue ? formatPrice(supplier.minimumOrderValue) : 'No minimum'}</p>
                  <p><span className="text-fg-subtle">Listing source:</span> {supplier.source === 'seed_dataset' ? 'Demo listing (not a verified real business)' : 'Registered supplier'}</p>
                </div>
              )}

              {tab === 'location' && (
                <div className="mt-4 space-y-2 rounded-xl border border-ink/10 bg-navy-950/40 p-4 text-sm text-fg-muted">
                  <p>{supplier.location?.address || 'No address on file'}</p>
                  <p className="text-xs text-fg-subtle">{[supplier.location?.city, supplier.location?.district, supplier.location?.state, supplier.location?.pincode].filter(Boolean).join(', ')}</p>
                </div>
              )}

              {tab === 'delivery' && (
                <div className="mt-4 space-y-2 rounded-xl border border-ink/10 bg-navy-950/40 p-4 text-sm text-fg-muted">
                  <p>{supplier.deliveryAvailable ? `Delivers within ${supplier.deliveryRadiusKm ?? 'an unspecified'} km.` : 'This supplier does not offer delivery — pickup only.'}</p>
                  {supplier.hours?.length > 0 && (
                    <div className="mt-2 space-y-0.5 text-xs">
                      {supplier.hours.map((h) => (
                        <p key={h.dayOfWeek}>{DAY_NAMES[h.dayOfWeek]}: {h.closed ? 'Closed' : `${h.opensAt} - ${h.closesAt}`}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </DashboardShell>
  )
}

export default SupplierDetailPage
