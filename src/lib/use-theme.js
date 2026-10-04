import { useState, useEffect, useRef, useCallback } from 'react'
import { playThemeWipe } from './theme-wipe'

const STORAGE_KEY = 'keyzai-theme'

function getInitialTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'dark'
  } catch {
    return 'dark'
  }
}

/**
 * @returns {[string, (next: string | ((t: string) => string)) => void, (e?: unknown) => void]}
 *   `[theme, setTheme, toggleTheme]`. Pakai `toggleTheme` untuk tombol tema:
 *   dia membaca elemen pemicu dari event click supaya wipe mulai dari tombol,
 *   bukan dari tengah layar.
 */
export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)
  const mounted = useRef(false)
  const triggerRef = useRef(null)

  useEffect(() => {
    const root = document.documentElement
    const swap = () => root.classList.toggle('dark', theme === 'dark')

    // Mount pertama bukan perpindahan tema — jangan animasi, langsung
    // terapkan supaya tidak ada kilatan tema lama.
    if (mounted.current) {
      playThemeWipe(theme, swap, triggerRef.current)
    } else {
      swap()
    }

    mounted.current = true
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // private mode — theme just won't persist
    }
    // Hanya dipakai sekali per perpindahan; jangan tahan elemen yang
    // sudah lepas dari DOM.
    triggerRef.current = null
  }, [theme])

  // Dipasang langsung sebagai onClick: `onClick={toggleTheme}` membuat
  // React mengirim SyntheticEvent, jadi currentTarget = tombol yang ditekan.
  const toggleTheme = useCallback((event) => {
    const el = event?.currentTarget
    triggerRef.current =
      el && typeof el.getBoundingClientRect === 'function' ? el : null
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return [theme, setTheme, toggleTheme]
}
