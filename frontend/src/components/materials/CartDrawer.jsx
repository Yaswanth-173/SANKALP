import Modal from '../ui/Modal.jsx'
import Spinner from '../Spinner.jsx'
import ProductImage from './ProductImage.jsx'

function formatPrice(n) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function CartDrawer({ open, onClose, groups, onIncrement, onDecrement, onPlaceOrder, placingShopId }) {
  return (
    <Modal open={Boolean(open)} onClose={onClose} placement="right" label="Your Cart" className="flex w-[92vw] max-w-sm flex-col border-l border-line bg-surface shadow-pop h-full">
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <h3 className="font-display text-lg font-semibold text-ink">Your Cart</h3>
              <button onClick={onClose} className="rounded-md p-1 text-fg-subtle hover:bg-ink/5 hover:text-ink">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {groups.length === 0 ? (
                <p className="mt-10 text-center text-sm text-fg-subtle">Your cart is empty.</p>
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
                                <p className="truncate text-fg">{item.name}</p>
                                <p className="text-xs text-fg-subtle">{formatPrice(item.price)} / {item.unit}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onDecrement(item.id)}
                                className="flex h-6 w-6 items-center justify-center rounded-full border border-ink/15 text-fg-muted hover:border-gold-500/40 hover:text-ink"
                              >
                                −
                              </button>
                              <span className="w-5 text-center text-ink">{item.quantity}</span>
                              <button
                                onClick={() => onIncrement(item.id)}
                                className="flex h-6 w-6 items-center justify-center rounded-full border border-ink/15 text-fg-muted hover:border-gold-500/40 hover:text-ink"
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
                          className="btn btn-primary btn-sm"
                        >
                          {placingShopId === group.shopId && <Spinner className="h-3 w-3" />} Place Order
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
    </Modal>
  )
}

export default CartDrawer
