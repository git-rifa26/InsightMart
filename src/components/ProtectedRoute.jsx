import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

/**
 * Gates a route on authentication and, optionally, on role.
 *
 * An unauthenticated visitor is sent to /login with the attempted path
 * remembered, so signing in returns them where they were headed. A signed-in
 * user without the required role is sent to CSV Analysis rather than the
 * login screen - they are authenticated, just not permitted here.
 */
export function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, role, booting } = useAuth()
  const location = useLocation()

  if (booting) return null

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to="/analysis" replace />
  }

  return children
}

export default ProtectedRoute
