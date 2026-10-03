import Navbar from '../components/landing/Navbar.jsx'
import Hero from '../components/landing/Hero.jsx'
import About from '../components/landing/About.jsx'
import BlueprintStory from '../components/landing/BlueprintStory.jsx'
import Journey from '../components/landing/Journey.jsx'
import Platform from '../components/landing/Platform.jsx'
import Stats from '../components/landing/Stats.jsx'
import MaterialsMarquee from '../components/landing/MaterialsMarquee.jsx'
import Support from '../components/landing/Support.jsx'
import FinalCta from '../components/landing/FinalCta.jsx'
import Footer from '../components/landing/Footer.jsx'

function LandingPage() {
  return (
    <div className="bg-canvas">
      <a href="#main" className="btn btn-primary sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <About />
        <BlueprintStory />
        <Journey />
        <Platform />
        <Stats />
        <MaterialsMarquee />
        <Support />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}

export default LandingPage
