/**
 * Auth client: simpan session token, dan inject Authorization header ke
 * semua request API. Token adalah session JWT yang diterbitkan worker
 * (POST /api/auth/google); Google ID token tidak pernah disimpan.
 */

const TOKEN_KEY = 'keyzai-auth-token'
const USER_KEY = 'keyzai-auth-user'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null
  } catch {
    return null
  }
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setSession(token, user) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_KEY)
  } catch {
    // storage unavailable — session hanya in-memory
  }
}

export function clearSession() {
  setSession(null, null)
}

/**
 * Fetch yang otomatis menyertakan Bearer token. Melempar AuthError khusus
 * saat 401 agar caller bisa logout + redirect ke landing.
 */
export class AuthError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AuthError'
  }
}

export async function authFetch(url, options = {}) {
  const token = getToken()
  const headers = { ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { ...options, headers })
  if (res.status === 401) {
    clearSession()
    throw new AuthError('Sesi berakhir. Silakan masuk kembali.')
  }
  return res
}

// True bila token ada (cek kedalaman isi dilakukan worker via /api/auth/me).
export function isAuthenticated() {
  return !!getToken()
}
