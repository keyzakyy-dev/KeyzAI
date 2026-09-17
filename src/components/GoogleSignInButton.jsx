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

const CLIENT_ID =
  import.meta.env?.VITE_GOOGLE_CLIENT_ID ||
  '227191802214-klcplrl89607it7obq9ne3ren73o9th9.apps.googleusercontent.com'

// Logo "G" Google (SVG resmi, 4 warna).
function GoogleG({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

/**
 * Tombol "Lanjutkan dengan Google" bergaya custom (logo G + label sesuai
 * design system). Klik ditangkap oleh tombol GIS asli yang dirender transparan
 * di atasnya (opacity-0, tetap bisa diklik) sehingga popup akun Google muncul
 * normal. Tidak ada client secret di frontend.
 */
export function GoogleSignInButton({
  onIdToken,
  onError,
  disabled = false,
  className = '',
  id = '',
  label = 'Lanjutkan dengan Google',
}) {
  const wrapperRef = useRef(null)
  const overlayRef = useRef(null)
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
    let ro = null

    // Render tombol GIS transparan selebar wrapper. Width maks GIS 400px;
    // wrapper dibatasi max-w-[400px] supaya tidak pernah kebesaran.
    const renderGsi = () => {
      const host = wrapperRef.current
      const el = overlayRef.current
      if (!host || !el || !window.google?.accounts?.id || cancelled) return
      const w = Math.max(220, Math.min(host.clientWidth, 400))
      window.google.accounts.id.renderButton(el, {
        type: 'standard',
        size: 'large',
        shape: 'pill',
        width: w,
        logo_alignment: 'left',
      })
    }

    loadGsi()
      .then(() => {
        if (cancelled) return
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (resp) => {
            if (resp?.credential) callbackRef.current?.(resp.credential)
            else errorRef.current?.('Login dibatalkan')
          },
          use_fedcm_for_prompt: true,
        })
        renderGsi()
        if (typeof ResizeObserver !== 'undefined' && wrapperRef.current) {
          ro = new ResizeObserver(renderGsi)
          ro.observe(wrapperRef.current)
        }
        setReady(true)
      })
      .catch((e) => errorRef.current?.(e.message || 'GSI gagal dimuat'))
    return () => {
      cancelled = true
      ro?.disconnect()
    }
  }, [])

  if (!CLIENT_ID) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        VITE_GOOGLE_CLIENT_ID belum dikonfigurasi.
      </div>
    )
  }

  return (
    <div
      id={id}
      ref={wrapperRef}
      className={`relative mx-auto w-full max-w-[400px] ${className}`}
    >
      {/* Visual custom: non-interaktif, hanya tampilan */}
      <div
        aria-hidden="true"
        className={`flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-border bg-background px-5 text-[15px] font-medium text-foreground shadow-sm transition-colors ${
          disabled ? 'opacity-60' : ''
        }`}
      >
        <GoogleG />
        <span>{label}</span>
      </div>

      {/* Tombol GIS asli: transparan tapi menangkap klik & fokus keyboard */}
      <div
        ref={overlayRef}
        className={`absolute inset-0 opacity-0 transition-opacity ${ready ? 'focus-within:opacity-100' : ''}`}
        aria-disabled={disabled}
        style={disabled ? { pointerEvents: 'none' } : undefined}
      />
    </div>
  )
}