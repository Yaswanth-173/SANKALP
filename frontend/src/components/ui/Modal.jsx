import { useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

const PANEL_MOTION = {
  center: {
    initial: { opacity: 0, scale: 0.94, y: 16 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.97, y: 8 },
    transition: { type: 'spring', stiffness: 320, damping: 28 },
  },
  right: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    transition: { duration: 0.45, ease: [0.76, 0, 0.24, 1] },
  },
  left: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
    transition: { duration: 0.45, ease: [0.76, 0, 0.24, 1] },
  },
}

const LAYOUT = {
  center: 'items-center justify-center p-4',
  right: 'justify-end',
  left: 'justify-start',
}

/**
 * Accessible dialog shell: portal, backdrop, Escape to close, focus trap,
 * focus restore and body scroll lock. Callers supply the panel's look via
 * `className` and its content as children.
 *
 * `placement` is "center" (modal) or "right"/"left" (drawer).
 */
function Modal({ open, onClose, children, className = '', placement = 'center', labelledBy, label, overlayClassName = '' }) {
  const panelRef = useRef(null)
  // Latest onClose without re-running the open/close effect when callers
  // pass a fresh inline function each render.
  const onCloseRef = useRef(onClose)
  useLayoutEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    const focusFirst = requestAnimationFrame(() => {
      const panel = panelRef.current
      if (!panel || panel.contains(document.activeElement)) return
      const first = panel.querySelector('[autofocus]') || panel.querySelector(FOCUSABLE)
      ;(first || panel).focus({ preventScroll: true })
    })

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current?.()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = [...panelRef.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      cancelAnimationFrame(focusFirst)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previouslyFocused?.focus?.({ preventScroll: true })
    }
  }, [open])

  const motionProps = PANEL_MOTION[placement]

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={`fixed inset-0 z-50 flex ${LAYOUT[placement]}`}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            aria-hidden="true"
            className={`absolute inset-0 bg-black/65 backdrop-blur-[2px] ${overlayClassName}`}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            aria-label={labelledBy ? undefined : label}
            tabIndex={-1}
            data-lenis-prevent
            {...motionProps}
            className={`relative outline-none ${className}`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export default Modal
