import { Outlet } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from './Footer'

/** Public shell: floating header, page content, marketing footer. */
export default function MarketingLayout() {
  return (
    <div className="relative min-h-screen bg-canvas">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
