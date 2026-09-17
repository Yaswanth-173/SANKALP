/**
 * Official Sankalp logo (icon + wordmark + tagline baked into the
 * artwork itself). Sourced from client/public/sankalp-logo.png —
 * never redraw, recolor, or substitute this asset.
 */
function Logo({ className = 'h-10 w-auto' }) {
  return (
    <img
      src="/sankalp-logo.png"
      alt="Sankalp — Build Smarter, Live Better"
      className={`${className} object-contain`}
      draggable={false}
    />
  )
}

export default Logo
