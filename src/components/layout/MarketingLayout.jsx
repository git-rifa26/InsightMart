import Navbar from '@/components/Navbar'
import Footer from './Footer'
import RouteTransition from './RouteTransition'

/** Public shell: floating header, page content, marketing footer. */
export default function MarketingLayout() {
  return (
    <div className="relative min-h-screen bg-canvas">
      <Navbar />
      <main>
        <RouteTransition />
      </main>
      <Footer />
    </div>
  )
}
