import { AnimatePresence, motion } from 'framer-motion'
import Spinner from '../Spinner.jsx'
import ProductImage from './ProductImage.jsx'

function formatPrice(n) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function CartDrawer({ open, onClose, groups, onIncrement, onDecrement, onPlaceOrder, placingShopId }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed inset-y-0 right-0 z-50 flex w-[92vw] max-w-sm flex-col border-l border-ink/10 bg-navy-900 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <h3 className="font-display text-lg font-semibold text-ink">Your Cart</h3>
              <button onClick={onClose} className="rounded-md p-1 text-ink/40 hover:bg-ink/5 hover:text-ink">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {groups.length === 0 ? (
                <p className="mt-10 text-center text-sm text-ink/40">Your cart is empty.</p>
              ) : (
                <div className="space-y-6">
                  {groups.map((group) => (
                    <div key={group.shopId} className="rounded-xl border border-ink/10 bg-navy-950/40 p-4">
                      <p className="text-sm font-semibold text-ink">{group.shopName}</p>
                      <div className="mt-3 space-y-2.5">
                        {group.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                            <div className="flex min-w-0 flex-1 items-center gap-2.5">
                              <ProductImage product={item} className="h-10 w-10" />
                              <div className="min-w-0">
                                <p className="truncate text-ink/85">{item.name}</p>
                                <p className="text-xs text-ink/40">{formatPrice(item.price)} / {item.unit}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onDecrement(item.id)}
                                className="flex h-6 w-6 items-center justify-center rounded-full border border-ink/15 text-ink/60 hover:border-gold-500/40 hover:text-ink"
                              >
                                −
                              </button>
                              <span className="w-5 text-center text-ink">{item.quantity}</span>
                              <button
                                onClick={() => onIncrement(item.id)}
                                className="flex h-6 w-6 items-center justify-center rounded-full border border-ink/15 text-ink/60 hover:border-gold-500/40 hover:text-ink"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
                        <span className="text-sm font-semibold text-ink">{formatPrice(group.subtotal)}</span>
                        <button
                          onClick={() => onPlaceOrder(group.shopId)}
                          disabled={placingShopId === group.shopId}
                          className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-3.5 py-1.5 text-xs font-semibold text-charcoal hover:bg-gold-400 disabled:opacity-60"
                        >
                          {placingShopId === group.shopId && <Spinner className="h-3 w-3" />} Place Order
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CartDrawer
