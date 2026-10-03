import Button from '../ui/Button.jsx'
import { ArrowRightIcon } from '../dashboard/icons.jsx'
import BuildingIllustration from './BuildingIllustration.jsx'
import BlueprintFrame from './BlueprintFrame.jsx'
import { HERO } from './content.js'

function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden pt-28 sm:pt-32 lg:flex lg:min-h-svh lg:items-center lg:pt-24">
      {/* Atmosphere: blueprint grid, amber ground glow, vignette */}
      <div aria-hidden="true" className="bg-blueprint-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div aria-hidden="true" className="absolute -bottom-40 left-1/2 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-gold-500/10 blur-[120px]" />

      <div className="container-page grid items-center gap-12 pb-16 lg:grid-cols-12 lg:gap-8 lg:pb-0">
        <div className="lg:col-span-7">
          <span className="eyebrow">
            <span aria-hidden="true" className="h-2 w-2 bg-gold-500" />
            {HERO.eyebrow}
          </span>

          <h1 className="mt-6 font-display text-display-xl font-bold text-fg">{HERO.title}</h1>

          <p className="mt-6 max-w-xl font-display text-title font-medium text-fg">{HERO.subtitle}</p>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-fg-muted sm:text-lg">{HERO.body}</p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button to="/signup" size="lg">
              Get Started Free
              <ArrowRightIcon className="h-4.5 w-4.5" />
            </Button>
            <Button to="/login" variant="secondary" size="lg">
              Log in
            </Button>
          </div>
        </div>

        <div className="lg:col-span-5">
          <BlueprintFrame className="mx-auto aspect-square w-full max-w-md lg:max-w-none">
            <BuildingIllustration className="h-full w-full" />
          </BlueprintFrame>
        </div>
      </div>

      <a
        href="#about"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-fg-subtle transition-colors hover:text-accent lg:flex"
      >
        Scroll
        <span aria-hidden="true" className="h-10 w-px bg-gradient-to-b from-gold-500 to-transparent" />
      </a>
    </section>
  )
}

export default Hero
