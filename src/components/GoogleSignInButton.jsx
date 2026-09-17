import { useEffect, useRef, useState } from 'react'

// Script Google Identity Services dimuat sekali saja.
let gsiPromise = null
function loadGsi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.google?.accounts?.id) return Promise.resolve()
  if (gsiPromise) return gsiPromise
  gsiPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = () => {
      if (window.google?.accounts?.id) resolve()
      else reject(new Error('GSI gagal dimuat'))
    }
    s.onerror = () => reject(new Error('GSI gagal dimuat'))
    document.head.appendChild(s)
  })
  return gsiPromise
}

const CLIENT_ID = import.meta.env?.VITE_GOOGLE_CLIENT_ID || ''

/**
 * Tombol "Masuk dengan Google" (Google Identity Services).
 * Setelah klik + consent popup, GIS memberi ID token yang ditukar dengan
 * session JWT worker lewat onIdToken. Tidak ada client secret di frontend.
 */
export function GoogleSignInButton({ onIdToken, onError, disabled = false, className = '', id = '' }) {
  const containerRef = useRef(null)
  const [ready, setReady] = useState(false)

  const callbackRef = useRef(onIdToken)
  useEffect(() => {
    callbackRef.current = onIdToken
  }, [onIdToken])
  const errorRef = useRef(onError)
  useEffect(() => {
    errorRef.current = onError
  }, [onError])

  useEffect(() => {
    if (!CLIENT_ID) return
    let cancelled = false
    loadGsi()
      .then(() => {
        if (cancelled || !containerRef.current) return
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (resp) => {
            if (resp?.credential) callbackRef.current?.(resp.credential)
            else errorRef.current?.('Login dibatalkan')
          },
          use_fedcm_for_prompt: true,
        })
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          size: 'large',
          shape: 'pill',
          width: 240,
          text: 'continue_with',
          locale: 'id',
        })
        setReady(true)
      })
      .catch((e) => errorRef.current?.(e.message || 'GSI gagal dimuat'))
    return () => {
      cancelled = true
    }
  }, [])

  if (!CLIENT_ID) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        VITE_GOOGLE_CLIENT_ID belum dikonfigurasi.
      </div>
    )
  }

  // Tombol render by GIS; sembunyikan sampai ready untuk hindari layout shift.
  return (
    <div
      id={id}
      ref={containerRef}
      className={`google-btn ${ready ? 'opacity-100' : 'opacity-0'} transition-opacity ${disabled ? 'pointer-events-none opacity-50' : ''} ${className}`}
      aria-disabled={disabled}
    />
  )
}
