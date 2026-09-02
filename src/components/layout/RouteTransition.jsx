import { AnimatePresence } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'

/**
 * Animates the routed page inside a layout.
 *
 * The layout itself stays mounted, so sidebar state, scroll containers and
 * fetched layout data survive navigation. Only the <Outlet/> subtree is
 * keyed, which is also what makes browser back and forward behave.
 */
export function RouteTransition() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Outlet key={location.pathname} />
    </AnimatePresence>
  )
}

export default RouteTransition
