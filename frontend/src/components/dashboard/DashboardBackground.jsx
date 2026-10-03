/**
 * Fixed backdrop behind every dashboard page: faint blueprint grid, a
 * crane line-drawing in the corner and a soft amber/blue atmosphere.
 * Static on purpose — it sits behind data-dense screens.
 */
function DashboardBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-canvas">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgb(111_163_255/0.08),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgb(245_165_36/0.06),transparent_50%)]" />
      <div className="bg-blueprint-grid absolute inset-0 opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />

      <svg
        viewBox="0 0 400 300"
        className="absolute -right-10 -top-6 h-72 w-72 text-blueprint/20 sm:h-96 sm:w-96"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      >
        <path d="M60 280V60M60 60l120 20M60 90l150 15M180 80v40M60 60l-30 10" />
        <path d="M180 120v160M150 280h60M120 200h120" strokeDasharray="4 5" />
        <circle cx="60" cy="55" r="4" fill="currentColor" stroke="none" />
      </svg>
    </div>
  )
}

export default DashboardBackground
