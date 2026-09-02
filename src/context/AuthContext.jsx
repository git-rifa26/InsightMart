import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi, accountApi, setUnauthorizedHandler, errorMessage } from '@/services/api'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { STORAGE_KEYS, ROLES, PLANS } from '@/lib/constants'

const AuthContext = createContext(null)

/**
 * Owns the session: the signed-in user, their JWT, and the derived
 * permissions the rest of the app gates on.
 */
export function AuthProvider({ children }) {
  const [user, setUser, clearUser] = useLocalStorage(STORAGE_KEYS.user, null)
  const [token, setToken, clearToken] = useLocalStorage(STORAGE_KEYS.token, null)
  const [booting, setBooting] = useState(true)
  const [pending, setPending] = useState(false)

  const logout = useCallback(() => {
    authApi.logout().catch(() => {
      /* the session is being discarded either way */
    })
    clearUser()
    clearToken()
  }, [clearUser, clearToken])

  // A 401 from any request means the token is no longer good.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearUser()
      clearToken()
    })
    return () => setUnauthorizedHandler(null)
  }, [clearUser, clearToken])

  // Nothing to restore beyond localStorage, but the flag keeps
  // ProtectedRoute from redirecting during the first render.
  useEffect(() => {
    setBooting(false)
  }, [])

  const login = useCallback(
    async (credentials) => {
      setPending(true)
      try {
        const { user: nextUser, access_token } = await authApi.login(credentials)
        setUser(nextUser)
        setToken(access_token)
        return nextUser
      } catch (error) {
        throw new Error(errorMessage(error, 'Could not sign you in.'))
      } finally {
        setPending(false)
      }
    },
    [setUser, setToken],
  )

  const register = useCallback(
    async (payload) => {
      setPending(true)
      try {
        const { user: nextUser, access_token } = await authApi.register(payload)
        setUser(nextUser)
        setToken(access_token)
        return nextUser
      } catch (error) {
        throw new Error(errorMessage(error, 'Could not create your account.'))
      } finally {
        setPending(false)
      }
    },
    [setUser, setToken],
  )

  const updateProfile = useCallback(
    async (patch) => {
      const { user: nextUser } = await accountApi.updateProfile(patch, user)
      setUser(nextUser)
      return nextUser
    },
    [user, setUser],
  )

  const changePlan = useCallback(
    async (planId) => {
      const { user: nextUser } = await accountApi.changePlan({ planId }, user)
      setUser(nextUser)
      return nextUser
    },
    [user, setUser],
  )

  const value = useMemo(() => {
    const role = user?.role ?? null
    const plan = PLANS.find((p) => p.id === user?.plan) ?? PLANS[0]

    return {
      user,
      token,
      role,
      plan,
      booting,
      pending,
      isAuthenticated: Boolean(user && token),
      isAdmin: role === ROLES.ADMIN,
      // Enterprise owners, their team members and admins all reach the org page.
      hasOrganisation: [ROLES.ENTERPRISE, ROLES.MEMBER, ROLES.ADMIN].includes(role),
      canExport: plan.limits.export,
      login,
      register,
      logout,
      updateProfile,
      changePlan,
    }
  }, [user, token, booting, pending, login, register, logout, updateProfile, changePlan])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an AuthProvider')
  return context
}
