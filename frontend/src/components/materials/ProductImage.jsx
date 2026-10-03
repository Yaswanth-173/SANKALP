import { useState } from 'react'
import { MATERIAL_ICON_MAP, ShopIcon } from './materialIcons.jsx'

// Real product photos are the primary presentation now — this only falls
// back to the flat SVG icon set if a material has no photo yet, or the
// hotlinked photo fails to load at runtime.
function ProductImage({ product, className = 'h-14 w-14' }) {
  const [errored, setErrored] = useState(false)
  const Icon = MATERIAL_ICON_MAP[product.icon] || ShopIcon

  if (!product.imageUrl || errored) {
    return (
      <div className={`flex shrink-0 items-center justify-center rounded-lg bg-navy-950/60 ${className}`}>
        <Icon className="h-1/2 w-1/2" />
      </div>
    )
  }

  return (
    <img
      src={product.imageUrl}
      alt={product.name}
      loading="lazy"
      onError={() => setErrored(true)}
      className={`shrink-0 rounded-lg border border-ink/10 object-cover ${className}`}
    />
  )
}

export default ProductImage
