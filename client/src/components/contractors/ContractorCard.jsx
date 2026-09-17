import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CartIcon, CheckCircleIcon } from './contractorIcons.jsx'
import { CONTRACTOR_ICON_IMAGES } from './contractorIconImages.js'
import Spinner from '../Spinner.jsx'

function ContractorCard({ category, index = 0, featured = false, inCart = false, onAddToCart, onRemoveFromCart }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const iconSrc = CONTRACTOR_ICON_IMAGES[category.slug]

  const handleToggleCart = async (e) => {
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    try {
      if (inCart) {
        await onRemoveFromCart(category)
      } else {
        await onAddToCart(category)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.4), ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, transition: { type: 'spring', stiffness: 320, damping: 22 } }}
      onClick={() => navigate(`/dashboard/contractors/${category.slug}`)}
      className={`group relative flex cursor-pointer flex-col rounded-2xl border p-5 transition-colors duration-300 ${
        featured
          ? 'border-gold-500/50 bg-gradient-to-br from-gold-500/10 via-navy-900/60 to-navy-900/60 hover:border-gold-500/70'
          : 'border-ink/10 bg-navy-900/50 hover:border-gold-500/30'
      }`}
    >
      {featured && (
        <span className="absolute right-4 top-4 rounded-full bg-gold-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gold-300">
          Complete Solution
        </span>
      )}

      <img
        src={iconSrc}
        alt=""
        draggable={false}
        className={featured ? 'h-16 w-16' : 'h-14 w-14'}
      />

      <h3 className={`mt-4 font-display font-semibold text-ink ${featured ? 'text-lg' : 'text-base'}`}>
        {category.name}
      </h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink/55">{category.description}</p>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/dashboard/contractors/${category.slug}`)
          }}
          className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-xs font-medium text-ink/70 transition-colors duration-200 hover:border-gold-500/40 hover:text-ink"
        >
          Details
        </button>
        <button
          onClick={handleToggleCart}
          disabled={busy}
          className={`group/cart flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-200 ${
            inCart
              ? 'bg-emerald-500/15 text-emerald-400 hover:bg-red-400/15 hover:text-red-400'
              : 'bg-gold-500 text-charcoal hover:bg-gold-400'
          } disabled:cursor-wait disabled:opacity-80`}
        >
          {busy ? (
            <Spinner className="h-3.5 w-3.5" />
          ) : inCart ? (
            <>
              <CheckCircleIcon className="h-3.5 w-3.5 group-hover/cart:hidden" />
              <span className="group-hover/cart:hidden">Added</span>
              <span className="hidden group-hover/cart:inline">Remove</span>
            </>
          ) : (
            <>
              <CartIcon className="h-3.5 w-3.5" /> Add to Cart
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}

export default ContractorCard
