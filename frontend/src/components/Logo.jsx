/**
 * Official Sankalp logo (icon + wordmark + tagline baked into the
 * artwork itself). Sourced from frontend/public/sankalp-logo.png —
 * never redraw, recolor, or substitute this asset.
 *
 * The artwork's wordmark is white, so in the light theme it sits on a
 * dark backing plate (the asset itself is untouched).
 */
function Logo({ className = 'h-10 w-auto' }) {
  return (
    <span className="inline-flex rounded-lg light:bg-charcoal light:px-2.5 light:py-1.5 light:shadow-card">
      <img
        src="/sankalp-logo.png"
        alt="Sankalp — Build Smarter, Live Better"
        className={`${className} object-contain`}
        draggable={false}
      />
    </span>
  )
}

export default Logo
