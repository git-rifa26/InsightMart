import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import MarketingLayout from '@/components/layout/MarketingLayout'
import AppShell from '@/components/layout/AppShell'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ROLES } from '@/lib/constants'

import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Plans from '@/pages/Plans'
import Dashboard from '@/pages/Dashboard'
import CsvAnalysis from '@/pages/CsvAnalysis'
import Organisation from '@/pages/Organisation'
import Admin from '@/pages/Admin'
import MyAccount from '@/pages/MyAccount'
import NotFound from '@/pages/NotFound'

/**
 * The route table. AnimatePresence keys on the pathname so each page can
 * play its exit animation before the next one enters.
 */
export function AppRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public marketing surface */}
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/plans" element={<Plans />} />
        </Route>

        {/* Authentication - full-bleed, no marketing chrome */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Signed-in application */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analysis" element={<CsvAnalysis />} />
          <Route path="/account" element={<MyAccount />} />
          <Route
            path="/organisation"
            element={
              <ProtectedRoute roles={[ROLES.ENTERPRISE, ROLES.MEMBER, ROLES.ADMIN]}>
                <Organisation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN]}>
                <Admin />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  )
}

export default AppRoutes
