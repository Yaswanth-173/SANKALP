import Navbar from '../components/Navbar.jsx'
import Hero from '../components/Hero.jsx'
import JourneySection from '../components/JourneySection.jsx'
import AboutSection from '../components/AboutSection.jsx'
import VisualStorySection from '../components/VisualStorySection.jsx'
import SupportSection from '../components/SupportSection.jsx'
import Footer from '../components/Footer.jsx'

function LandingPage() {
  return (
    <div className="bg-navy-950">
      <Navbar />
      <Hero />
      <JourneySection />
      <AboutSection />
      <VisualStorySection />
      <SupportSection />
      <Footer />
    </div>
  )
}

export default LandingPage
