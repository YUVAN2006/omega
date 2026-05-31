import { useEffect, useCallback } from 'react'
import { useOmegaStore } from '@/store'
import { authApi } from '@/services/api'

export function useAuth() {
  const { isAuthenticated, user, setAuth, logout: storeLogout } = useOmegaStore()

  const checkAuth = useCallback(async () => {
    try {
      const status = await authApi.getStatus()
      setAuth(status)
    } catch {
      setAuth({ authenticated: false, user: null })
    }
  }, [setAuth])

  useEffect(() => {
    checkAuth()

    // Check for auth=success callback in URL
    const params = new URLSearchParams(window.location.search)
    if (params.get('auth') === 'success') {
      window.history.replaceState({}, '', '/')
      checkAuth()
    }
    if (params.get('error')) {
      console.error('Auth error:', params.get('error'))
      window.history.replaceState({}, '', '/')
    }
  }, [])

  const login = async () => {
    try {
      const { auth_url } = await authApi.getLoginUrl()
      window.location.href = auth_url
    } catch (e) {
      console.error('Login error:', e)
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
      storeLogout()
    } catch {
      storeLogout()
    }
  }

  return { isAuthenticated, user, login, logout, checkAuth }
}
