import { useCallback, useEffect, useState } from 'react'
import { authFetch, clearSession, getToken, getUser, setSession, isAuthenticated } from '../lib/auth'

const API_URL = import.meta.env?.VITE_WORKER_URL || 'https://keyzai-worker-prod.2406007.workers.dev'

/**
 * Hook auth: status login user, muat ulang user dari server saat mount,
 * dan expose login/logout. Google ID token didapat dari GIS button di UI.
 */
export function useAuth() {
  const [user, setUser] = useState(getUser)
  const [loading, setLoading] = useState(isAuthenticated)
  const [error, setError] = useState(null)

  // Validasi token yang tersimpan saat mount: worker kasih /api/auth/me.
  useEffect(() => {
    if (!isAuthenticated()) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await authFetch(`${API_URL}/api/auth/me`)
        const data = await res.json()
        if (cancelled) return
        if (data.success) {
          setUser(data.user)
          setSession(getToken(), data.user)
        } else {
          clearSession()
          setUser(null)
        }
      } catch {
        if (!cancelled) {
          clearSession()
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tukar ID token Google (dari GIS) dengan session JWT worker.
  const loginWithGoogle = useCallback(async (idToken) => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })
      const data = await res.json()
      if (!data.success || !data.token) {
        if (data.details) throw new Error(`${data.error || 'Login gagal'} (${data.details})`)
        throw new Error(data.error || 'Login gagal')
      }
      setSession(data.token, data.user)
      setUser(data.user)
      return data.user
    } catch (e) {
      setError(e.message || 'Login gagal')
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  // Perbarui user lokal setelah server mengubah data akun (mis. nama tampilan).
  const updateUser = useCallback((next) => {
    if (!next) return
    setUser(next)
    setSession(getToken(), next)
  }, [])

  return { user, loading, error, loginWithGoogle, logout, updateUser }
}

export { getToken } from '../lib/auth'
