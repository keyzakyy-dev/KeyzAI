import { useState, useEffect, useRef, useCallback } from 'react'
import { playThemeFade } from './theme-fade'

const STORAGE_KEY = 'keyzai-theme'

function getInitialTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'dark'
  } catch {
    return 'dark'
  }
}

/**
 * @returns {[string, (next: string | ((t: string) => string)) => void, () => void]}
 *   `[theme, setTheme, toggleTheme]`. Pakai `toggleTheme` untuk tombol tema.
 */
export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)
  const mounted = useRef(false)

  useEffect(() => {
    const root = document.documentElement
    const swap = () => root.classList.toggle('dark', theme === 'dark')

    // Mount pertama bukan perpindahan tema — jangan animasi, langsung
    // terapkan supaya tidak ada kilatan tema lama.
    if (mounted.current) {
      playThemeFade(theme, swap)
    } else {
      swap()
    }

    mounted.current = true
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // private mode — theme just won't persist
    }
  }, [theme])

  // Tanpa argumen event: fade tidak butuh titik asal, hanya state tema
  // sekarang.
  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return [theme, setTheme, toggleTheme]
}
