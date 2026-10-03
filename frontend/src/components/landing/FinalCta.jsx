import Button from '../ui/Button.jsx'
import { ArrowRightIcon } from '../dashboard/icons.jsx'
import { HERO } from './content.js'

function FinalCta() {
  return (
    <section aria-labelledby="cta-heading" className="section-pad relative">
      <div className="container-page">
        <div className="relative isolate overflow-hidden rounded-3xl border border-gold-500/30 bg-surface px-6 py-16 text-center sm:px-12 sm:py-24">
          <div aria-hidden="true" className="bg-blueprint-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
          <div aria-hidden="true" className="absolute -bottom-32 left-1/2 -z-10 h-72 w-[42rem] max-w-full -translate-x-1/2 rounded-full bg-gold-500/20 blur-[90px]" />

          <span className="eyebrow justify-center">
            <span aria-hidden="true" className="h-2 w-2 bg-gold-500" />
            Sankalp
          </span>
          <h2 id="cta-heading" className="mx-auto mt-5 max-w-3xl font-display text-display-lg font-bold text-fg">
            Build Smarter. <span className="text-accent">Live Better.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-fg-muted sm:text-lg">{HERO.body}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button to="/signup" size="lg">
              Get Started Free
              <ArrowRightIcon className="h-4.5 w-4.5" />
            </Button>
            <Button to="/login" variant="secondary" size="lg">
              Log in
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FinalCta
