import { Routes, Route, Navigate } from 'react-router-dom'

import MarketingLayout from '@/components/layout/MarketingLayout'
import AppShell from '@/components/layout/AppShell'
import AdminLayout from '@/components/layout/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ROLES } from '@/lib/constants'

import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Plans from '@/pages/Plans'
import Dashboard from '@/pages/Dashboard'
import CsvAnalysis from '@/pages/CsvAnalysis'
import Organisation from '@/pages/Organisation'
import MyAccount from '@/pages/MyAccount'
import NotFound from '@/pages/NotFound'

import AdminOverview from '@/pages/admin/AdminOverview'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminOrganisations from '@/pages/admin/AdminOrganisations'
import AdminUploads from '@/pages/admin/AdminUploads'

/**
 * The route table.
 *
 * Page transitions are owned by each layout, around its own <Outlet/>, so a
 * layout stays mounted across navigation. Keying the whole <Routes> element
 * instead would remount the shell on every click and stall browser back.
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* Public marketing surface */}
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/plans" element={<Plans />} />
      </Route>

      {/* Authentication - full-bleed, no marketing chrome */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Signed-in application - sidebar shell */}
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
      </Route>

      {/* Admin console - its own top-bar chrome, no sidebar */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="organisations" element={<AdminOrganisations />} />
        <Route path="uploads" element={<AdminUploads />} />
      </Route>

      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
