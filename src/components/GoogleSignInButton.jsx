import { useEffect, useRef, useState } from 'react'

// Script Google Identity Services dimuat sekali saja.
let gsiPromise = null
function loadGsi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (gsiPromise) return gsiPromise
  gsiPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = () => {
      if (window.google?.accounts?.oauth2) resolve()
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
 * Tombol native HTML untuk login Google tanpa iframe.
 * Menggunakan google.accounts.oauth2.initTokenClient.
 */
export function GoogleSignInButton({
  onIdToken,
  onError,
  disabled = false,
  className = '',
  id = '',
  label = 'Lanjutkan dengan Google',
}) {
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const clientRef = useRef(null)

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
        if (cancelled) return
        clientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: 'email profile openid',
          callback: (resp) => {
            if (resp?.error) {
              errorRef.current?.(resp.error_description || resp.error || 'Login dibatalkan.')
              return
            }
            if (resp?.access_token) {
              callbackRef.current?.({ accessToken: resp.access_token })
            } else {
              errorRef.current?.('Gagal mendapatkan token akses dari Google.')
            }
          },
        })
        setReady(true)
      })
      .catch((e) => {
        if (cancelled) return
        const msg = e.message || 'Tidak bisa memuat login Google. Periksa koneksi lalu coba lagi.'
        setLoadError(msg)
        errorRef.current?.(msg)
      })
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

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-[400px] rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-center">
        <p className="text-sm text-destructive">{loadError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-1.5 text-sm font-medium text-foreground underline underline-offset-4"
        >
          Muat ulang halaman
        </button>
      </div>
    )
  }

  const busy = disabled || !ready

  return (
    <button
      id={id}
      type="button"
      disabled={busy}
      onClick={() => clientRef.current?.requestAccessToken()}
      className={`relative mx-auto flex h-12 w-full max-w-[400px] items-center justify-center gap-2.5 rounded-full border border-border bg-background px-5 text-[15px] font-medium text-foreground shadow-sm transition-colors hover:border-foreground/30 disabled:opacity-70 ${className}`}
    >
      {busy ? (
        <span
          className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground"
          role="presentation"
        />
      ) : (
        <GoogleG />
      )}
      <span>{ready ? label : 'Menyiapkan login Google…'}</span>
    </button>
  )
}